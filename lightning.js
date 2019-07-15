/*
* Tuulikartta.info weatherGraph class
* Copyright (C) 2017 Ville Ilkka
*/

var saa = saa || {};

(function(lightning, undefined) {

  var timePeriod;
  saa.lightning.geoLayer = L.layerGroup()

  saa.lightning.init = function (timeString, timeInterval) {

    var timeArray = timeString.split('/')
    var endTime = moment.utc(timeArray[1]).toISOString()
    var startTime = moment.utc(endTime).subtract(timeInterval, 'hours').toISOString()
    var period = timeArray[2]
    timePeriod = period
    var time = `${startTime}/${endTime}/${period}`

    $.ajax({
      dataType: 'json',
      data: 'time='+time,
      url: 'php/lightning.php',
      error: function () {
        console.log('error')
      },
      success: function (data) {
        // console.log(data)
      },
      complete: function (data) {
        var data = data.responseJSON
        saa.lightning.drawData(data)
      }
    })
  }

  saa.lightning.drawData = function(data) {

    saa.lightning.geoLayer.clearLayers()

    var groundLightningStyle = {
      radius: 4, 
      fillColor: 'red', 
      fillOpacity: 0.7, 
      stroke: true,
      weight: 1,
      opacity: 0.8,
      color: 'black'
    };

    var cloudLightningStyle = {
      radius: 3, 
      fillColor: 'violet', 
      fillOpacity: 0.6, 
      stroke: true,
      weight: 1,
      opacity: 0.5,
      color: 'black'
    };
    
    var customLayerGround = L.geoJson(data[0], {
      pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, groundLightningStyle);
      }
    })

    var customLayerCloud = L.geoJson(data[1], {
      pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, cloudLightningStyle);
      }
    })

    saa.tutkain.flashTimeLayer = L.timeDimension.layer.geoJson(customLayerGround, {
      duration: timePeriod
    }).addTo(saa.lightning.geoLayer);
    saa.tutkain.flashTimeLayer = L.timeDimension.layer.geoJson(customLayerCloud, {
      duration: timePeriod
    }).addTo(saa.lightning.geoLayer);

    saa.lightning.geoLayer.addTo(saa.tutkain.map)

  }

}(saa.lightning = saa.lightning || {}));
