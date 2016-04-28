'use strict';
var r = require('../../lib/requestService');
var a = require('../../lib/amalgamationService');
var request = require('request-promise');
var redis = require('redis');
var redisClient = redis.createClient();
redisClient.on("error", function (err) {
    console.log("Redis Error " + err);
});

var chai = require('chai');
var expect = chai.expect;

describe('Live Data', function () {
    describe('Route Config Service', function () {
        this.timeout(5000);
        it('should return  properly formatted routes', function (done) {
            r.getRouteConfig('sf-muni', '88').then(function (result) {
                expect(result).to.be.ok;
                expect(result.route).to.equal("88");
                expect(Object.keys(result.route).length).to.be.above(0);
                done();
            });
            //     .catch(function (err){
            //     chai.assert().fail("error","something");
            //     console.log("ERROR in "+err);
            // });

        })
    });

    describe('Route List Service', function () {
        this.timeout(10000);
        it('should return a list of routes', function (done) {
            r.getRoutes('dc-streetcar').then(function (result) {
                expect(result.length).to.be.above(0);
                done();
            })
        });
    });

    describe('Predictions', function () {
        this.timeout(10000);
        it('should return predictions', function (done) {
            r.getPredictions('sf-muni', 'KT', ['5727', '7778']).then(function (result) {
                expect(result).to.be.ok;
                expect(Object.keys(result["5727"]).length).to.be.above(0);
                done();
            });
        })
    });

    describe('I can hit the NB API', function () {
        this.timeout(10000);
        it('should return 200', function (done) {
            request.get("http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=sf-muni&r=88", function (err, res) {
                //console.log(body);
                expect(res.statusCode).to.equal(200);
                done();
            });
        });
    });
});

describe('Difference matrix creation', function () {
    it('should return a properly formatted array', function (done) {
        var orderedStopArray = {
            "route": "25",
            "directions": {
                "25___I_F00": ["7558", "4936", "4934", "4935", "3670", "7004", "7590", "7560", "3229", "3674", "3673", "3675", "3904", "6685", "37617"],
                "25___O_F00": ["7617", "6684", "3905", "7555", "7556", "7557", "37558"]
            }
        };
        var predictions = {
            "3905": {
                "25___O_F00": [{"vehicle": "8623", "time": "1461945097801"}, {
                    "vehicle": "8185",
                    "time": "1461945485998"
                }, {"vehicle": "8720", "time": "1461946083858"}, {
                    "vehicle": "8429",
                    "time": "1461946683858"
                }, {"vehicle": "8722", "time": "1461947283858"}]
            },
            "6684": {
                "25___O_F00": [{"vehicle": "8623", "time": "1461945048392"}, {
                    "vehicle": "8185",
                    "time": "1461945436589"
                }, {"vehicle": "8720", "time": "1461946026709"}, {
                    "vehicle": "8429",
                    "time": "1461946626709"
                }, {"vehicle": "8722", "time": "1461947226709"}]
            },
            "7555": {
                "25___O_F00": [{"vehicle": "8623", "time": "1461945132010"}, {
                    "vehicle": "8185",
                    "time": "1461945520207"
                }, {"vehicle": "8720", "time": "1461946119017"}, {
                    "vehicle": "8429",
                    "time": "1461946719017"
                }, {"vehicle": "8722", "time": "1461947319017"}]
            },
            "7556": {
                "25___O_F00": [{"vehicle": "8623", "time": "1461945162449"}, {
                    "vehicle": "8185",
                    "time": "1461945550646"
                }, {"vehicle": "8720", "time": "1461946147806"}, {
                    "vehicle": "8429",
                    "time": "1461946747806"
                }, {"vehicle": "8722", "time": "1461947347806"}]
            },
            "7557": {
                "25___O_F00": [{"vehicle": "8623", "time": "1461945203788"}, {
                    "vehicle": "8185",
                    "time": "1461945591985"
                }, {"vehicle": "8720", "time": "1461946187885"}, {
                    "vehicle": "8429",
                    "time": "1461946787885"
                }, {"vehicle": "8722", "time": "1461947387885"}]
            },
            "7617": {
                "25___O_F00": [{"vehicle": "8185", "time": "1461945000000"}, {
                    "vehicle": "8720",
                    "time": "1461945600000"
                }, {"vehicle": "8429", "time": "1461946200000"}, {
                    "vehicle": "8722",
                    "time": "1461946800000"
                }, {"vehicle": "8623", "time": "1461947400000"}]
            },
            "37558": {
                "25___O_F00": [{"vehicle": "8623", "time": "1461945274858"}, {
                    "vehicle": "8185",
                    "time": "1461945659887"
                }, {"vehicle": "8720", "time": "1461946255385"}, {
                    "vehicle": "8429",
                    "time": "1461946855385"
                }, {"vehicle": "8722", "time": "1461947455385"}]
            }
        };

        var differenceFor6684 = 1461945436589 - 1461945000000;

        a.buildPredictionDifferences('sf-muni', '25', predictions, orderedStopArray);

        redisClient.getAsync('sf-muni25-diff-25___O_F00').then(function (result) {
            var differences = JSON.parse(result);
            expect(differences['7617'].diff).to.equal(0);
            expect(differences['6684'].diff).to.equal(differenceFor6684);
            expect(Object.keys(differences).length).to.equal(7);
            done();
        })
    });
});
