var redis = require('redis');

var ScreenSwitchHelper = function(){
    var checkForScreenUpdates = function(callback) {
        var client = redis.createClient();
        client.lpop("screen_switch", function(error, cmd){ 
            if(cmd!=null){
                callback(cmd);
            }
        });
    }
    
    this.start = function(updateRate, callback){
        setInterval(function(){
            checkForScreenUpdates(callback);
        }, updateRate);
    } 
}   

module.exports = new ScreenSwitchHelper();