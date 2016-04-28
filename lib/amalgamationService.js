var _ = require('underscore');

var exports = module.exports = {};
/**
 *
 * @param route
 * @param predictions the object from requestService that is returned by the
 * @param orderedStopArray
 */
exports.buildPredictionDifferences = function (route, predictions, orderedStopArray) {
    //set up prediction object
    var differences = {};
    differences[route] = {};

    _.each(orderedStopArray.directions, function (stops, dir) {

        differences[route][dir] = {};

        _.each(stops, function (stopId) {
            var diff = 0;
            var stopIdx = _.indexOf(stops, stopId);

            if (stopIdx > 0) {
                var priorStopId = stops[stopIdx - 1];
                var priorStopPred = _.chain(predictions[priorStopId][dir]).values().flatten().min().value();
                var currStopPred = _.chain(predictions[stopIdx][dir]).values().flatten().min().value();

                if (currStopPred > priorStopPred) {
                    diff = currStopPred - priorStopPred;
                }
            }

            differences[route][dir][stopId] = {};
            differences[route][dir][stopId].diff = diff;
            differences[route][dir][stopId].priorStopID = (priorStopId === undefined) ? 0 : priorStopId;


        });
        console.log(JSON.stringify(differences));

    });

    // var directions = _.chain(predictions)
    //     .map(function(p){ return _.keys(p)}).flatten().uniq().value();
    //
    // _.each(directions, function(dir){differences[route][dir] = {}});
    //
    // // for each stop
    // _.each(predictions, function(p, stopId){
    //     var dir = _.keys(p);
    //
    //     differences[route][dir][stopId] = p;
    // })

};

