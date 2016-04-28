'use strict';
var r = require('../../lib/requestService');
var request = require('request-promise');
var chai = require('chai');
var expect = chai.expect;

describe('Live Data', function () {
    describe('Route Config Service', function () {
        this.timeout(2000);
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
