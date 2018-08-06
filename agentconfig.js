var express = require('express');
var router = express.Router();

// mopub provides an exchange & the way to connect router 
var mopub = require('./mopub_exchangeconnector');
var smaato = require('./smaato_exchangeconnector');
var pubnative = require('./pubnative_exchangeconnector');
var adx = require('./adx_exchangeconnector');

var mopubcheck = mopub.isCampaignValid;           
var smaatocheck = smaato.isCampaignValid;
var pubnativecheck = pubnative.isCampaignValid;
var adxcheck = adx.isCampaignValid;

var smaatodeleteId = smaato.deleteId;
var mopubdeleteId = mopub.deleteId;
var pubnativedeleteId = pubnative.deleteId;
var adxdeleteId = adx.deleteId;

var Agentconfig = {};

router.post('/delete/:id', function(req, res, id){          // to delete the campaign
  var config = req.body;
  smaatodeleteId(req.params.id);
  mopubdeleteId(req.params.id);
  pubnativedeleteId(req.params.id);
  adxdeleteId(req.params.id);
  res.send('agentconfig deleted : '+ req.params.id);  
});

 //registering agent config with correspoding exchanges
  router.post('/create/:id', function(req, res, next) {
  var config = req.body;

  Agentconfig[req.params.id] = config;
  console.log("config" + JSON.stringify(config));
/*  if(config.appidFilter || config.appidFilter) {
    config.webidFilter = {};
    if(config.appidFilter) = 
  }
// sending response as to bidder as 'asd'
*/  
    if(config.providerConfig.smaato){                   // if request is from smaato
      smaatocheck(req.params.id, config);
      }
    if(config.providerConfig.mopub){                    // if request is from mopub
      mopubcheck(req.params.id, config);
      }
    if(config.providerConfig.pubnative){                // if request is from pubnative
      pubnativecheck(req.params.id, config);
      }
    if(config.providerConfig.adx){
      adxcheck(req.params.id, config);
      }
      res.send('agentconfig received');                 // sending response
  });

module.exports = router;
