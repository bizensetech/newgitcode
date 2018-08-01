var Agentconfig = require('./agentconfig');

var redis = require('redis'),
    client = redis.createClient();

var mopub_exchangeconnector = require('./mopub_exchangeconnector');  
var smaato_exchangeconnector = require('./smaato_exchangeconnector');  
var filter = require('./filter');
var redisconnector = require('./redisconnector');  

// to display ad by using freqency cap

function getValidCampaignIds(audienceId, ids, CampaignConfigMap, validIds, callback){
    if(!ids.length){                                                        // ids?
        return callback(validIds);                                                               
    }  
    [id, ...Rest] = ids;                                                    // syntax
    campaignconfig = CampaignConfigMap[id];    
    if(campaignconfig.augmentations){
        redisconnector.get(audienceId ,function(err,i){ 
            console.log("value from redis", +i);
            if(i < campaignconfig.augmentations.freq_req.maxperday){        // checking that audience Id should not exceed freqeency cap
                validIds.push(id);
            }
            return getValidCampaignIds(audienceId, Rest, CampaignConfigMap, validIds, callback);                
        })
    }else{ 
        validIds.push(id);  
        return getValidCampaignIds(audienceId, Rest, CampaignConfigMap, validIds, callback);
    }    
}
module.exports.getValidCampaignIds = getValidCampaignIds;
