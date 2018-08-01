//basic exchange connector
//includes common functionalities required for all exchanges

var express = require('express');
var request = require('request');

var router = express.Router();

var AudienceId = require('./AudienceId');
var augmentor = require('./augmentor');
var Agentconfig = require('./agentconfig');
var filter = require('./filter.js');

var CampaignConfigMap = {};

//check if agentconfig is valid
function isCampaignValid(id, config){
  // if agentconfig is valid ad it to CampaignConfigMap
    for(var creative of config.creatives){
        if(!(creative["cat"] && creative["attr"] && creative["adomain"]))
            config.creatives.splice(creative);
    }
    if(config.creatives && config.creatives.length)
        CampaignConfigMap[id] = config;
}

function deleteId(id){
    if(id in CampaignConfigMap){
       delete CampaignConfigMap[id];
       console.log("request is deleted");
    }
}

   //--------get the bidrequest and send them for filtering
router.post('/', function(req, res, next) {
    var bidrequest = req.body;
    debugger;
    console.log('received bidrequest' +JSON.stringify(bidrequest));

    var val;

    if(Object.keys(CampaignConfigMap).length){
        filter.getValidCampaignIds(bidrequest, CampaignConfigMap);
    }else{
        return res.status(204).send();
    }

    AudienceId.getAudienceId(bidrequest, val, function(val)     
    {   
        bidrequest.ext.audienceId = val;
        bidaudi(bidrequest);
    });

    function bidaudi(bidrequest){

        if(bidrequest.ext.externalIds && bidrequest.ext.externalIds.length){
            var validIds = [];
            if(bidrequest.ext.audienceId && bidrequest.ext.audienceId.length){ 
                var audienceIds = [];
                augmentor.getValidCampaignIds(bidrequest.ext.audienceId, bidrequest.ext.externalIds, CampaignConfigMap, validIds, 
                    function(validIds) {
                        bidrequest.ext.externalIds = validIds;
                        if(bidrequest.ext.externalIds && bidrequest.ext.externalIds.length){
                            if(bidrequest.ext.audienceId){
                                console.log("send to bidders");
                                sendToBidders(bidrequest, res);
                            }   
                        }   
                    else return res.status(204).send();    
            });
        }}
        else return res.status(204).send(); 
     }   
  }); 
 
  //-------send to bidders and get response
function sendToBidders(bidRequest, res){
    request({
        url: "http://localhost:3000/bidrequest",
        method: "POST",
        json: true,   // <--Very important!!!
        headers: {
            "content-type": "application/json",  // <--Very important!!!
            "x-openrtb-version" : "2.3"
        },
        body: bidRequest
    }, function (error, response, body){
        console.log(body);
        if(response.statusCode == 204)res.status(204).send();
        else if(!error && response.statusCode == 200){
            sendResponse(res, body);
        }
    });
}
// {"id":"132","price":0.2721,"crid":"169","impid":"1","ext":{"external-id":132,"priority":1,"bsexchange":"pubnative"}}
//function to populate bidresponse and send response back to exchange
function sendResponse(res, bid){
    try{
        var campaignConfig = CampaignConfigMap[bid.seatbid[0].bid[0].id];
        var creativeConfig = {};
        for(var creative of campaignConfig.creatives){
            if(creative.id == bid.seatbid[0].bid[0].crid){
                creativeConfig = creative;
                break;
            }
        }
        var cpInfo = campaignConfig.providerConfig["pubnative"];
        var crInfo = creativeConfig.providerConfig["pubnative"];

        var bidResponse = {};
        bidResponse.id = bid.id;
        bidResponse.cur = "USD";

        var b = {};
        var ibid = bid.seatbid[0].bid[0];
        b.id = bid.id+":"+ibid.impid;
        b.impid = ibid.impid;
        b.price = ibid.price;
        b.adm = crInfo.adm;
        b.adomain = crInfo.adomain;
        b.crid = crInfo.crid;
        b.cat = crInfo.cat;
        b.attr = crInfo.attr;

        var fbid = [];
        fbid.push(b);
        bidResponse.seatbid = [];
        bidResponse.seatbid.push({
            "bid": fbid,
            "seat": crInfo.seat
        });
        res.set('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify(bidResponse));
    }catch(err){
        return res.status(204).send()
    }
}

module.exports = router;
module.exports.isCampaignValid = isCampaignValid;
module.exports.deleteId = deleteId;
