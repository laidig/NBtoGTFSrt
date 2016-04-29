'use strict';

var _ = require('underscore');
var request = require('request-promise');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var Promise = require('bluebird');
var retry = require('bluebird-retry');

var getOptions = {gzip: true};
var BASE_URL = "http://webservices.nextbus.com/service/publicXMLFeed?command=";

var Bucket = require('limiter').TokenBucket;
/* Limits are:
 Maximum characters per requester for all commands (IP address): 2MB/20sec
 Maximum routes per "routeConfig" command: 100
 Maximum stops per route for the "predictionsForMultiStops" command: 150
 Maximum number of predictions per stop for prediction  commands: 5
 Maximum timespan for "vehicleLocations" command: 5min
 */
var BURST_RATE = 1024 * 1024 * 1024; // Burst to 1MB/s
var RATE = 1024 * 1024 * 2 / 20; // avg speed of 2MB per 20s
var bucket = new Bucket(BURST_RATE, RATE, 'second', null);

var exports = module.exports = {};

var redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
var redisClient = redis.createClient();
redisClient.on("error", function (err) {
    console.log("Redis Error " + err);
});


/**
 *
 * @param agency
 * @returns [String]
 */
exports.getRoutes = function (agency) {
    return new Promise(function (resolve, reject) {
        getOptions.url = BASE_URL + "routeList" + "&a=" + agency;

        request(getOptions).then(function (response) {
            parser.parseString(response, function (err, result) {
                var routes = [];
                _.each(result.body.route, function (r) {
                    routes.push(r.$.tag);
                });
                resolve(routes);
            })
        })
    })
};

/**
 *
 * @param agency
 * @param route
 * @returns {route-{directions} - [stops]}
 */
exports.getRouteConfig = function (agency, route) {
    var cache = getRouteConfigFromCache(agency, route);

    return cache.catch(function (e) {
        getRouteConfigFromWeb(agency, route);
    });
};

/**
 *
 * @param agency
 * @param route
 * @returns {route-{directions} - [stops]}
 */
var getRouteConfigFromWeb = function (agency, route) {
    var routeDirStops = {};

    return new Promise(function (resolve, reject) {

        console.log('querying route config');
        getOptions.url = BASE_URL + "routeConfig" + "&a=" + agency + '&r=' + route;

        request(getOptions).then(function (response) {

            parser.parseString(response, function (err, result) {

                routeDirStops.route = result.body.route[0].$.tag;
                routeDirStops.directions = {};

                var directions = result.body.route[0].direction;

                _.each(directions, function (d) {
                    var routeDirection = d.$.tag;
                    var dirStops = []; // tags

                    _.each(d.stop, function (s) {
                        dirStops.push(s.$.tag);
                    });
                    routeDirStops.directions[routeDirection] = dirStops;
                })
            });
            redisClient.set(agency.concat(route), JSON.stringify(routeDirStops));
            redisClient.expire(agency.concat(route), 3600);
        });

        resolve(routeDirStops);

    }).catch(function (e) {
        reject('error getting route config ' + e)
    });
};

var getRouteConfigFromCache = function (agency, route) {
    return new Promise(function (resolve, reject) {
        redisClient.getAsync(agency.concat(route)).then(
            function (reply) {
                resolve(JSON.parse(reply.toString()))
            }
        ).catch(function (e) {
            reject(e);
        })
    })
};
//
/**
 *
 * @param agency
 * @param route
 * @param stopArray
 * @return {direction: predictions}
 */

exports.getPredictions = function (agency, route, stopArray) {
    return new Promise(function (resolve, reject) {

        var url = BASE_URL + "predictionsForMultiStops" + "&a=" + agency + '&useShortTitles=true';
        _.each(stopArray, function (s) {
            url += '&stops=' + route + '|' + s;
        });
        getOptions.url = url;

        request(getOptions).then(function (response) {
            parser.parseString(response, function (err, result) {

                if (typeof result.body.predictions === 'undefined') {
                    reject('Predictions Not Present');
                } else {
                    var stopPredictions = {};
                    _.each(result.body.predictions, function (s) {
                        var stopTag = s.$.stopTag;
                        var directions = {};

                        _.each(s.direction, function (d) {
                            directions[d.prediction[0].$.dirTag] =
                                _.map(d.prediction, function (pred) {
                                    var obj = {};
                                    obj.vehicle = pred.$.vehicle;
                                    obj.time = pred.$.epochTime;
                                    return obj;
                            });
                        });
                        stopPredictions[stopTag] = directions;
                    });
                    // console.log(JSON.stringify(stopPredictions, null, " "));
                    resolve(stopPredictions);
                }
            })

        })
    })
};
