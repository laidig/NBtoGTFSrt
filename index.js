/**
 * Created by tony on 4/25/16.
 */

var requestService = require('./lib/requestService');


var main = function(){
    // get routes then predictions for that route

    requestService.getRouteConfig('sf-muni',['N']).then(
        function(res, err){
            console.log(res);
        }
    ).catch(function (e) {
        console.log('error!')
    });

}


if (require.main === module){
    main();
}
