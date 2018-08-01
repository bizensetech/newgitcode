var agentconfig = require('./agentconfig');

var redis = require('redis'),
    client = redis.createClient();

var filter = require('./filter');
var mopub_exchangeconnector = require('./mopub_exchangeconnector');
var smaato_exchangeconnector = require('./smaato_exchangeconnector');
var redisconnector = require('./redisconnector'); 

function getAudienceId(bidrequest, val, callback){    // getting audience from the bidrequest
         var deviceIdgroup;
         var deviceId;
         var key;

         if(bidrequest.device != null){               // checking whether deviceId in bidrequest is null or not

            if(bidrequest.device.hasOwnProperty('ifa')){
                    deviceId = bidrequest.device.ifa;
                    deviceIdgroup = "ifa";
            }

            else if(bidrequest.device.hasOwnProperty('didsha1')){
                    deviceId = bidrequest.device.didsha1;
                    deviceIdgroup = "didsha1";
            }

            else if(bidrequest.device.hasOwnProperty('didmd5')){
                    deviceId = bidrequest.device.didmd5;
                    deviceIdgroup = "didmd5";
            }
            
            else if(bidrequest.device.hasOwnProperty('dpidsha1')){
                    deviceId = bidrequest.device.dpidsha1;
                    deviceIdgroup = "dpidsha1";
            }
            
            else if(bidrequest.device.hasOwnProperty('dpidmd5')){
                    deviceId = bidrequest.device.dpidmd5;
                    deviceIdgroup = "dpidmd5";
            }
            
            else if(bidrequest.device.hasOwnProperty('macsha1')){
                    deviceId = bidrequest.device.macsha1;
                    deviceIdgroup = "macsha1";
            }
            
            else if(bidrequest.device.hasOwnProperty('macmd5')){
                    deviceId = bidrequest.device.macmd5;
                    deviceIdgroup = "macmd5";
            }
        }
        // if deviceId in bidrequest is empty then we have to create deviceId  

        if(deviceId == null){                                     
        
            var isEmpty = function(deviceId) {
                return Object.keys(deviceId).length === 0;
                }

                var inc = bidrequest.ext.udi.toString();                     
                console.log(inc);     

                if(isEmpty && inc.includes("googleadid")){  
                    deviceId = bidrequest.ext["udi"]["googleadid"].toString();
                    deviceIdgroup = "googleadid";
                }
  
                if(isEmpty && bidrequest.user != null){             // if user in bidrequest is null           
                    if(bidrequest.user.hasOwnProperty('id'))
                    deviceId = bidrequest.user.id.toString();

                    if(bidrequest.exchange = "mopub"){              // if exchange is mopub_exchangeconnector
                        deviceIdgroup = "mopubid";
                    }
                    else if(bidrequest.exchange = "smaato"){        // if exchange is smaato_exchangeconnector
                        deviceIdgroup = "smaatoid";
                    }
                }
            if(bidrequest.user.hasOwnProperty('buyeruid')){ 
                deviceId = bidrequest.user.buyeruid.toString();
                if(bidrequest.exchange == "mopub"){
                    deviceIdgroup = "mopub";
                }   
                else if(bidrequest.exchange == "smaato"){
                    deviceIdgroup = "smaato";
                }    
            }       
        }           
    key = deviceIdgroup+"_"+deviceId;                       
    console.log(key);
        // if value is already stored in redis then no need to increment the audienceId
        // else we should increment the audienceId count 
    redisconnector.get(key, function(err, val){                 // getting key value from the redis
        
        if(val){
            callback(val);
            console.log(val)
            bidrequest.ext.audienceId = val;
        }

        else{                                              // if key is not in the redis(new key)
            redisconnector.increment("audienceIdcount");    
            redisconnector.get("audienceIdcount", function(err, num){
                console.log("value is", +num);
                bidrequest.ext.audienceId = num;     // get audienceIdcount from redis and equate to the audienceId
                redisconnector.set(key, num, redis.print);     // set the audienceIdcount to the key
            });
        }
    });
}	
module.exports.getAudienceId = getAudienceId;
    