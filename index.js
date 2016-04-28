/**
 * Created by tony on 4/25/16.
 */
var _ = require('underscore');

var requestService = require('./lib/requestService');
var amalgamationService = require('./lib/amalgamationService');


var main = function () {
    // get routes then predictions for that route

    var predictions;
    var rte = '25';
    var agency = 'sf-muni';

    var routePromise = requestService.getRouteConfig(agency, rte);
    routePromise.then(
        function (stops) {

            _.each(stops.directions, function (r) {
                requestService.getPredictions(agency, rte, r).then(
                    function (res) {
                        predictions = res;
                        amalgamationService.buildPredictionDifferences(agency, rte, predictions, stops);
                    }
                ).catch(function (e) {
                    console.log(e);
                })
            })
        }).catch(function (e) {
        console.log('error! ' + e);
    })

};


if (require.main === module) {
    main();
}
