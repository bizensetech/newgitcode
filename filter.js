// this module will get real time request info
// like msisdn object and ad info
// this Should return valid campaigns

var Agentconfig = require('./agentconfig');

var filterPath = {
  "connectiontype" : ["device", "connectiontypestr"],
  "carrierFilter" : ["device", "carrier"],
  "locationFilter" : ["device", "geo", "fulllocation"],
  "operatingSystemFilter" : ["device", "fullos"],
  
  "seat" : ["bseat"],     // blocked seat id
  "cat" : ["bcat"],       // blocked category
  "adv" : ["badv"],       // blocked advertisement
  "app" : ["bapp"]        // blocked app
}
//  array of filters 
var campaignhierarchyFilters = ["connectiontype","carrierFilter", "locationFilter", "operatingSystemFilter"];

var rangeFilters = ["age"];  

module.exports.getValidCampaignIds = function(bidRequest, CampaignConfigMap) {

  debugger;
  //changes for filtering
  if(bidRequest.device.geo)bidRequest.device.geo.fulllocation = bidRequest.device.geo.country+":"+bidRequest.device.geo.region+":"+bidRequest.device.geo.metro+":"+bidRequest.device.geo.city;
  if(bidRequest.device.connectiontype)bidRequest.device.connectiontypestr = bidRequest.device.connectiontype.toString();
  if(bidRequest.device.os)bidRequest.device.fullos = bidRequest.device.os+" "+bidRequest.device.osv;
  if(bidRequest.site)bidRequest.appositeId = bidRequest.site.id;
  if(bidRequest.app)bidRequest.appositeId = bidRequest.app.id;

  // new array of validcampaigns
  var validCampaignIds = [];
  
  for (var id in CampaignConfigMap) {
    if(CampaignConfigMap.hasOwnProperty(id)){
      if(isCampaignValid(CampaignConfigMap[id], bidRequest)){
         validCampaignIds.push(id);
      };
    }
  }
  
  var creativeMatrix = {};
  var blockFilters = [];    //["seat", "cat", "adv", "app"]       

  for(var id of validCampaignIds){
    for(let spot of bidRequest.imp){
      var arr = [];
      for(let creative of CampaignConfigMap[id].creatives){
        if(!blockFilter(blockFilters, filterPath, creative, bidRequest))return false;
        if(isCreativeValid(creative, spot, bidRequest)){
          console.log("valid creative");
          arr.push(creative.id);    
        }
      }
      if(arr.length){
        creativeMatrix[id] = arr;
      }
    }
  }
  var externalIds = [];
  for(var id in creativeMatrix){
    externalIds.push(id);
  }
  console.log(creativeMatrix);
  bidRequest.ext.externalIds = externalIds;
  console.log(externalIds);
  return validCampaignIds;
}

//includeexcludefilter
function ieFilter(campaignConfig, bidRequest){
  for (let hFilter of campaignhierarchyFilters) {
    if(campaignConfig[hFilter]){
      var filterpath = filterPath[hFilter];
      var obj = bidRequest;
      for(let path of filterpath){
        if(obj[path]){
          obj = obj[path];
        }else{
          return false;
        }
      }

      if(campaignConfig[hFilter].exclude && campaignConfig[hFilter].exclude.length){
        for(let notAllowedProperty of campaignConfig[hFilter].exclude){
          if(obj.includes(notAllowedProperty)){
            return false;
          }
        }
      }
      if(campaignConfig[hFilter].include && campaignConfig[hFilter].include.length){

        let allowedPropertyArray = campaignConfig[hFilter].include.filter(function(allowedProperty){
            return obj.includes(allowedProperty);
        })
        if(allowedPropertyArray.length == 0){
          return false;
        }
      }
    }
  }
  return true;  
}

//filter to check if config and request fields are matching
function matchFilter(matchFilters, filterPath, config, spot){
    for(let mFilter of matchFilters){    
      var filterpath = filterPath[mFilter];
      var obj = spot; 
    
      for(let path of filterpath){
        if(obj[path]){
          obj = obj[path];
        }else{
          return false;
        }
      }
      if(obj != config[mFilter])return false;
    }
    return true;
}

// filter to check blocked values
function blockFilter(blockFilters, filterPath, config, spot){
  for(let bFilter of blockFilters){
    var filterpath = filterPath[bFilter];
    var obj = spot;

    for(let path of filterpath){
      if(obj[path]){
        obj = obj[path];
      }else{
        continue;
      }
    }
    if(Array.isArray(obj)){
      for(let val of config[bFilter]){
        if(obj.includes(val))return false;
      }
    }
  }
  return true;
}
function isCreativeValid(creativeConfig, spot, bidRequest){
  if(spot.banner && creativeConfig.adformat == "banner"){
    var bannerFilterPath = {
      "width" : ["w"],
      "height" : ["h"],
      "type" : ["btype"],
      "attr" : ["battr"]
    }

    var bannerMatchFilters = ["width", "height"];
    var blockFilters = ["type", "attr"];

    if(!blockFilter(blockFilters, bannerFilterPath, creativeConfig, spot.banner))return false;
    if(!matchFilter(bannerMatchFilters, bannerFilterPath, creativeConfig, spot.banner))return false;
    return true;
  }//return false;
}

function isCampaignValid(campaignConfig, bidRequest){

  // day time audience segment filtering
  var date = new Date();
  var day = "/" + (date.getDay() || 7);
  var time = "/" + date.getHours();
  var allowedDayTime = ["//"];
  allowedDayTime.push("/" + time);
  allowedDayTime.push(day + "/");
  allowedDayTime.push(day + time);

  if(campaignConfig.dayTime){
    if(campaignConfig.dayTime.allowed && campaignConfig.dayTime.allowed.length){
      let allowedPropertyArray = campaignConfig.dayTime.allowed.filter(function(allowedProperty){
          return allowedDayTime.includes(allowedProperty);
      })
      if(allowedPropertyArray.length == 0){
        return false;
      }
    }
  }

  if(!ieFilter(campaignConfig, bidRequest)){
    return false;
  }
  console.log("returned true");
  return true;
}   