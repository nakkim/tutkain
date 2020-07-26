/* */

var saa = saa || {};

(function (tutkain, undefined) {
  // 'use strict'   ooooor dont.

  var useDebug = true
  saa.tutkain.map

  saa.tutkain.dataString
  var timeDimensionControl
  var mobileUser = false

  // var dataWMS = '//data.fmi.fi/fmi-apikey/apikey/wms'
  var geosrvWMS = '//openwms.fmi.fi/geoserver/Radar/wms'
  var eumetsatWMS = '//eumetview.eumetsat.int/geoserver/wms'

  saa.tutkain.timeInterval    = localStorage.getItem('timeInterval')     ? localStorage.getItem('timeInterval')    : 1
  saa.tutkain.showSatellite   = localStorage.getItem('showSatellite')    ? localStorage.getItem('showSatellite')   : false
  saa.tutkain.showFlash       = localStorage.getItem('showFlash')        ? localStorage.getItem('showFlash')       : true
  saa.tutkain.animFrameRate   = localStorage.getItem('animFrameRate')    ? localStorage.getItem('animFrameRate')   : 1000
  saa.tutkain.collapseOptions = localStorage.getItem('collapseOptions')  ? localStorage.getItem('collapseOptions') : false
  saa.tutkain.radarOpacity    = localStorage.getItem('radarOpacity')     ? localStorage.getItem('radarOpacity')    : 50
  saa.tutkain.satOpacity      = localStorage.getItem('satOpacity')       ? localStorage.getItem('satOpacity')      : 40
  saa.tutkain.timeSlider      = localStorage.getItem('timeSlider')       ? localStorage.getItem('timeSlider')      : true

  var layerName = 'suomi_dbz_eureffin'
  saa.tutkain.lightningIntervalStart = 5
  saa.tutkain.lightningTimestep = 5

  saa.tutkain.satelliteImages = ['meteosat:msg_eview', 'meteosat:msg_fog']
  saa.tutkain.selectedSatelliteProduct = localStorage.getItem('satelliteProduct') ? localStorage.getItem('satelliteProduct') : 0

  var toggleAnimation = 'off'
  var isRunning = false

  if(saa.tutkain.showSatellite == true || saa.tutkain.showSatellite == 'true') {
    saa.tutkain.lightningIntervalStart = 15
    saa.tutkain.lightningTimestep = 15
  }

  var geoLocationGroup = L.layerGroup()

  var latitude   = localStorage.getItem('latitude')   ? localStorage.getItem('latitude')   : 60.630556
  var longitude = localStorage.getItem('longitude') ? localStorage.getItem('longitude') : 24.859726
  var zoomlevel  = localStorage.getItem('zoomlevel')  ? localStorage.getItem('zoomlevel')  : 8

  // observation update interval in ms
  var interval = 60000
  saa.tutkain.radarTimeLayer
  saa.tutkain.flashTimeLayer
  saa.tutkain.satelliteTimeLayer

  // if (L.Browser.mobile) {
  //   timeSlider = false
  // }

  function debug(string) {
    if (useDebug) {
      console.log(string)
    }
  }

  //callback that remap fields name
  function formatJSON(rawjson) {
    var json = {},
        key,
        loc,
        disp = [];

    for(var i in rawjson) {

      disp = rawjson[i].display_name
      // if mobile and str length > 52, cut the tail out
      if (L.Browser.mobile === true && disp.length > 52) {
        disp = shortenString(rawjson[i].display_name)
      }

      key = disp
      loc = L.latLng( rawjson[i].lat, rawjson[i].lon )
      json[ key ] = loc	//key,value format
    }
    return json;
  }

  function shortenString (string) {
    var shortString = ''
    var shortStringArray = string.split(', ')
    for (var i=0; i<shortStringArray.length; i++) {
      if ((shortString + shortStringArray[i]).length < 52) {
        shortString = shortString + shortStringArray[i] + ', '
      } else {
        break
      }
    }
    result = shortString.substr(0, shortString.length-2)
    return result
  }

  tutkain.getTimeData = function (type) {
    var wmsEndPoint = geosrvWMS
    layerName = 'suomi_dbz_eureffin'
    if (saa.tutkain.showSatellite == true || saa.tutkain.showSatellite == 'true') {
      layerName = 'meteosat:msg_eview_3995'
      wmsEndPoint = eumetsatWMS
    }

    if (type == 'reload') {
      saa.tutkain.map.spin(true, {
        lines: 14,
        length: 25,
        width: 27,
        radius: 80,
        scale: 0.35,
        corners: 1,
        speed: 1.4,
        animation: 'spinner-line-fade-quick',
        color: '#b1b1b1'
      })
      $.ajax({
        dataType: 'json',
        url: 'php/dataparser.php',
        data: {
          name: layerName,
          server: wmsEndPoint
        },
        error: function (request, status, error) {
          saa.tutkain.map.spin(false)
          console.log(request.responseText);
        },
        success: function (data) {
          saa.tutkain.map.spin(false)
          saa.tutkain.dataString = data
          tutkain.reloadTimedimension(data['dimension'])
          saa.lightning.init(saa.tutkain.dataString['dimension'], saa.tutkain.timeInterval)
        }
      })
    } else {
      saa.tutkain.map.spin(true, {
        lines: 14,
        length: 25,
        width: 27,
        radius: 80,
        scale: 0.35,
        corners: 1,
        speed: 1.4,
        animation: 'spinner-line-fade-quick',
        color: '#b1b1b1'
      })
      $.ajax({
        dataType: 'json',
        url: 'php/dataparser.php',
        data: {
          name: layerName,
          server: wmsEndPoint
        },
        error: function (request, status, error) {
          console.log(request.responseText);
        },
        success: function (data) {
          saa.tutkain.dataString = data
          tutkain.updateTimedimension(data)
          saa.lightning.init(saa.tutkain.dataString['dimension'], saa.tutkain.timeInterval)
        },
        complete: function() {
          saa.tutkain.map.spin(false)
        }
        
      })
    }
  }

  tutkain.initMap = function () {
    self.map = L.map('map', {
      center: [latitude, longitude],
      zoom: zoomlevel,
      minZoom: 5
    })

    self.map.doubleClickZoom.disable(); 

    // remove default zoomcontrol and add a new one with custom titles
    self.map.zoomControl.remove()
    L.control.zoom({zoomInTitle: 'Lähennä', zoomOutTitle: 'Loitonna'}).addTo(self.map)

    // if theres no location info in localstorage, use latlon bounds
    if(localStorage.getItem('latitude') === null) {
      var southWest = new L.LatLng(59.32, 18.29)
      var northEast = new L.LatLng(70.51, 32.35)
      var bounds = new L.LatLngBounds(southWest, northEast)
      self.map.fitBounds(bounds)
    }

    var CartoDB = L.tileLayer('https://api.mapbox.com/styles/v1/nakkim/ck016yx4h2cbx1cmh1i5uf4ia/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibmFra2ltIiwiYSI6ImNqNWYzNzVvaDB3YmUyeHBuOWdwZnM0bHMifQ.QZCKhwf3ET5ujEeZ6_8X_Q', {
      // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(self.map)

    saa.tutkain.map = self.map

    // build satellite data controller button,
    // map open/collapse map control button
    // and map controls
    saa.tutkainControl.buildSatelliteControl()
    saa.tutkainControl.buildLightningControl()
    saa.tutkainControl.buildControl()
    saa.tutkainControl.buildInfo()
    saa.tutkainControl.buildReload()        
    
    document.getElementById('force-reload').onclick = function() {
      $('#reload-image').addClass('active');
      setTimeout(function() {
        $('#reload-image').removeClass('active');
      }, 1000);
    }

    saa.tutkain.map.on('move', function () {
      var lat = map.getCenter().lat
      var lon = map.getCenter().lng
      zoomlevel = map.getZoom()
      localStorage.setItem('latitude', lat)
      localStorage.setItem('longitude', lon)
      localStorage.setItem('zoomlevel', zoomlevel)
    })

    // add geolocation control and build all map control buttons
    // saa.tutkainControl.buildGeoLocation()
    L.control.locate({
      drawCircle: false,
      showCompass: false,
      locateOptions: {
        maxZoom: 9,
        enableHighAccuracy: true
      },
      showPopup: false,
      strings: {
        title: 'Paikanna käyttäjä'
      }}).addTo(saa.tutkain.map);
    saa.tutkainControl.buildMapControl()
    tutkain.getTimeData()

    saa.tutkain.map.on('click', function(e) {
      var ctrlDiv = document.getElementById('map-control-container')
      ctrlDiv.style = 'display:none'
      saa.tutkain.collapseOptions = false
      localStorage.setItem('collapseOptions', false)
    })
  }

  saa.tutkain.updateTimedimension = function (data) {

    // if (L.Browser.mobile) {
    //   timeSlider = true
    // }

    // if timedimensioncontrol already exists, remove it and all layers first
    if(timeDimensionControl !== undefined) {
      self.map.removeControl(timeDimensionControl)
      saa.tutkain.map.removeLayer(saa.tutkain.radarTimeLayer)
      saa.tutkain.map.removeLayer(saa.tutkain.flashTimeLayer)
      saa.tutkain.map.removeLayer(saa.tutkain.satelliteTimeLayer)
    }

    var timeArray = data['dimension'].split('/')
    var endTime = moment.utc(timeArray[1]).toISOString()
    var startTime = moment.utc(endTime).subtract(saa.tutkain.timeInterval, 'hours').toISOString()
    var period = timeArray[2]

    var timeDimension = new L.TimeDimension({
      timeInterval: `${startTime}/${endTime}`,
      period: period
    });
    saa.tutkain.map.timeDimension = timeDimension;

    var player = new L.TimeDimension.Player({
      transitionTime: saa.tutkain.animFrameRate,
      loop: true,
      startOver: true
    },
      timeDimension
    );
    saa.tutkain.player = player

    saa.tutkain.map.on('click', function(){
      if(saa.tutkain.player.isPlaying()) {
        saa.tutkain.player.stop()
      } else {
        saa.tutkain.player.start()
        isRunning = true
      }
    })

    if(saa.tutkain.timeSlider == 'true') saa.tutkain.timeSlider = true
    if(saa.tutkain.timeSlider == 'false') saa.tutkain.timeSlider = false    

    var autoPlay = false
    // if (isRunning == true) autoPlay = true 

    var timeDimensionControlOptions = {
      player: player,
      timeDimension: timeDimension,
      position: 'bottomright',
      autoPlay: autoPlay,
      timeSlider: saa.tutkain.timeSlider,
      speedSlider: false,
      timeZones: ['Local'],
      timeSliderDragUpdate: true
    };

    L.Control.TimeDimensionCustom = L.Control.TimeDimension.extend({
      _getDisplayDateFormat: function (date) {
        return moment(date).format('DD.MM.YYYY, H:mm');
      }
    })

    timeDimensionControl = new L.Control.TimeDimensionCustom(
      timeDimensionControlOptions
    )
    self.map.addControl(timeDimensionControl);
    if (saa.tutkain.showSatellite === true) {
      var interval_start = 15
      var timestep = 15
    }

    var radar = L.tileLayer.wms(geosrvWMS, {
      layers: 'suomi_dbz_eureffin',
      format: 'image/png',
      tileSize: 512,
      transparent: true,
      opacity: saa.tutkain.radarOpacity/100,
      version: '1.3.0',
      crs: L.CRS.EPSG3857
      // bounds: L.latLngBounds(L.latLng(59.96,16.88),L.latLng(69.51,31.59))
    })

    var satellite = L.tileLayer.wms(eumetsatWMS, {
      layers: saa.tutkain.satelliteImages[saa.tutkain.selectedSatelliteProduct]+',overlay:ne_10m_admin_0_boundary_lines_land', // meteosat:msg_dust, meteosat:msg_ash, meteosat:msg_airmass
      format: 'image/png',
      tileSize: 512,
      transparent: true,
      opacity: saa.tutkain.satOpacity/100,
      version: '1.3.0',
      crs: L.CRS.EPSG3857
    })

    saa.tutkain.radarTimeLayer = L.timeDimension.layer.wms(radar, {
      updateTimeDimension: false,
      updateTimeDimensionMode: 'replace',
      wmsVersion: '1.3.0'
    })

    saa.tutkain.satelliteTimeLayer = L.timeDimension.layer.wms(satellite, {
      updateTimeDimension: false,
      updateTimeDimensionMode: 'replace',
      wmsVersion: '1.3.0'
    })

    saa.tutkain.radarTimeLayer._availableTimes = []
    saa.tutkain.satelliteTimeLayer._availableTimes = []

    // because of local storage
    if (saa.tutkain.showSatellite == true || saa.tutkain.showSatellite == 'true') { saa.tutkain.satelliteTimeLayer.addTo(self.map) }
    saa.tutkain.radarTimeLayer.addTo(self.map)

    // set latest timestamp and pause animation
    saa.tutkain.map.timeDimension.prepareNextTimes(1, 12, true);
    // saa.tutkain.map.timeDimension.setCurrentTime(new Date().getTime())
  }

  tutkain.reloadTimedimension = function (data) {
    var timeArray = data.split('/')
    var endTime = moment.utc(timeArray[1]).toISOString()
    var startTime = moment.utc(endTime).subtract(saa.tutkain.timeInterval, 'hours').toISOString()
    var period = timeArray[2]

    self.map.timeDimension.setAvailableTimes(`${startTime}/${endTime}/${period}`, 'replace')
    saa.tutkain.radarTimeLayer._availableTimes = []
    saa.tutkain.satelliteTimeLayer._availableTimes = []
  }


  setInterval(function () {
    saa.tutkain.getTimeData('reload')
  }, interval)
}(saa.tutkain = saa.tutkain || {}))
