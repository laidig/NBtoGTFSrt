var _ = require('underscore');
var redis = require('redis');
var Promise = require('bluebird');
Promise.promisifyAll(redis.RedisClient.prototype);
var redisClient = redis.createClient();
redisClient.on("error", function (err) {
    console.log("Redis Error " + err);
});


var exports = module.exports = {};
/**
 *
 * @param agency
 * @param route
 * @param predictions the object from requestService that is returned by the
 * @param orderedStopArray
 */
exports.buildPredictionDifferences = function (agency, route, predictions, orderedStopArray) {
    //set up prediction object
    var differences = {};
    differences[route] = {};

    // in order to not build a matrix for irrelevant data,
    // get the intersection of directions from routeConfig and directions from predictions.
    var directionsInPredictions = _.chain(predictions)
        .map(function (key, v) {
            return key
        })
        .reduce(function (memo, val) {
            return _.keys(val);
        }, {}).value();

    var directionsToQuery = _.intersection(_.keys(orderedStopArray.directions), directionsInPredictions);
    var stopsToQuery = _.pick(orderedStopArray.directions, directionsToQuery);

    _.each(stopsToQuery, function (stops, dir) {

        differences[dir] = {};
        _.each(stops, function (stopId) {
            var diff = 0;
            var stopIdx = _.indexOf(stops, stopId);

            differences[dir][stopId] = differences[dir][stopId] || {};

            if (stopIdx > 0) {
                var priorStopId = stops[stopIdx - 1];

                var latestPredictionAtStop = _.min(predictions[stopId][dir], _.property('time'));
                var latestPredictionAtPriorStop = _.min(predictions[priorStopId][dir], _.property('time'));

                var priorStopPred = latestPredictionAtPriorStop.time;
                var currStopPred = latestPredictionAtStop.time;

                if (currStopPred > priorStopPred &&
                    latestPredictionAtPriorStop.vehicle === latestPredictionAtStop.vehicle) {
                    diff = currStopPred - priorStopPred;
                } else {
                    // console.log("subsequent pr for " + priorStopId);
                    // get current stop's subsequent prediction with the current prior stop prediction vehicle id
                    var subPrediction = _.chain(predictions[stopId][dir])
                        .filter(function (o) {
                            return o.vehicle === latestPredictionAtPriorStop.vehicle;
                        }).pluck('time').first().value();
                    diff = subPrediction - priorStopPred;
                }
                differences[dir][stopId].priorStopID = priorStopId;
            }
            differences[dir][stopId].diff = diff;
        });
        var diffKey = agency + route + '-diff-' + dir;
        redisClient.set(diffKey, JSON.stringify(differences[dir]));

    });
};

