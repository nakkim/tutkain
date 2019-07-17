/* */

var saa = saa || {};

(function (tutkain, undefined) {
  // 'use strict'   ooooor dont.

  var useDebug = true
  saa.tutkain.map

  var dataString
  var timeDimensionControl
  var mobileUser = false

  // var dataWMS = '//data.fmi.fi/fmi-apikey/apikey/wms'
  var geosrvWMS = '//openwms.fmi.fi/geoserver/Radar/wms'
  var eumetsatWMS = '//eumetview.eumetsat.int/geoserver/wms'

  var timeInterval     = localStorage.getItem('timeInterval')     ? localStorage.getItem('timeInterval')    : 1
  var showSatellite    = localStorage.getItem('showSatellite')    ? localStorage.getItem('showSatellite')   : false
  var showFlash        = localStorage.getItem('showFlash')        ? localStorage.getItem('showFlash')       : true  
  var animFrameRate    = localStorage.getItem('animFrameRate')    ? localStorage.getItem('animFrameRate')   : 1000
  var collapseOptions  = localStorage.getItem('collapseOptions')  ? localStorage.getItem('collapseOptions') : false
  var radarOpacity     = localStorage.getItem('radarOpacity')     ? localStorage.getItem('radarOpacity')    : 50
  var satOpacity       = localStorage.getItem('satOpacity')       ? localStorage.getItem('satOpacity')      : 40

  var timeSlider = true

  var layerName = 'suomi_dbz_eureffin'
  var lightningIntervalStart = 5
  var lightningTimestep = 5

  if(showSatellite == 'true') {
    lightningIntervalStart = 15
    lightningTimestep = 15
  }

  var geoLocationGroup = L.layerGroup()

  var latitude   = localStorage.getItem('latitude')   ? localStorage.getItem('latitude')   : 60.630556
  var longtitude = localStorage.getItem('longtitude') ? localStorage.getItem('longtitude') : 24.859726
  var zoomlevel  = localStorage.getItem('zoomlevel')  ? localStorage.getItem('zoomlevel')  : 8

  // observation update interval in ms
  var interval = 60000
  saa.tutkain.radarTimeLayer
  saa.tutkain.flashTimeLayer
  saa.tutkain.satelliteTimeLayer

  if (L.Browser.mobile) {
    timeSlider = false
  }

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

      // if(rawjson[i].address.neighbourhood !== undefined) {
        
      // }

      disp = rawjson[i].display_name;
      key = disp
      loc = L.latLng( rawjson[i].lat, rawjson[i].lon );
      json[ key ] = loc;	//key,value format
    }
    return json;
  }

  tutkain.locate = function() {
    saa.tutkain.map.locate({ setView: false, maxZoom: 10 })
    saa.tutkain.map.on('locationfound', onLocationFound)
    saa.tutkain.map.on('locationerror', onLocationError)
  }

  function onLocationFound (e) {
    var icon = L.icon({
      iconUrl: 'img/blue-pushpin.png',
      iconSize: [32, 32],
      iconAnchor: [10, 32],
      popupAnchor: [0, 0]
    })
    // remove old layers
    geoLocationGroup.clearLayers()

    L.marker(e.latlng, { icon: icon }).addTo(geoLocationGroup)
    geoLocationGroup.addTo(saa.tutkain.map)
    saa.tutkain.map.setView(e.latlng, parseInt(zoomlevel), { animation: false })
  }

  function onLocationError (e) {
    console.log('Error: The Geolocation service failed.')
  }

  tutkain.getTimeData = function (type) {
    var wmsEndPoint = geosrvWMS
    layerName = 'suomi_dbz_eureffin'
    if (showSatellite === true) {
      layerName = 'meteosat:msg_eview_3995'
      wmsEndPoint = eumetsatWMS
    }

    if (type == 'reload') {
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
          dataString = data
          tutkain.reloadTimedimension(data['dimension'])
          saa.lightning.init(dataString['dimension'], timeInterval)
        }
      })
    } else {
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
          dataString = data
          tutkain.updateTimedimension(data)
          saa.lightning.init(dataString['dimension'], timeInterval)
        }
      })
    }
  }


  tutkain.initMap = function () {
    var lat = parseFloat(latitude)
    var lon = parseFloat(longtitude)
    var zoom = parseInt(zoomlevel)

    self.map = L.map('map', {
      center: [lat, lon],
      zoom: zoom
    })

    // remove default zoomcontrol and add a new one with custom titles
    self.map.zoomControl.remove()
    L.control.zoom({zoomInTitle: 'Lähennä', zoomOutTitle: 'Loitonna'}).addTo(self.map)

    // if theres no location info in localstorage, use latlon bounds
    if(localStorage.getItem('latitude') == null) {
      var southWest = new L.LatLng(59.32, 18.29)
      var northEast = new L.LatLng(70.51, 32.35)
      var bounds = new L.LatLngBounds(southWest, northEast)
      self.map.fitBounds(bounds)
    }

    var CartoDB = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(self.map)
    var CartoDB_labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(self.map)

    saa.tutkain.map = self.map

    // build satellite data controller button, 
    // map open/collapse map control button
    // and map controls 
    tutkain.buildSatelliteControl()
    tutkain.buildLightningControl()
    tutkain.buildControl()

    var icon = L.icon({
      iconUrl: 'img/blue-pushpin.png',
      iconSize:     [32, 32],
      iconAnchor:   [16, 32]
    });

    saa.tutkain.map.on('move', function () {
      var lat = map.getCenter().lat
      var lon = map.getCenter().lng
      var zoom = map.getZoom()
      localStorage.setItem('latitude', lat)
      localStorage.setItem('longitude', lon)
      localStorage.setItem('zoomlevel', zoom)
    })

    saa.tutkain.map.addControl( new L.Control.Search({
      url: '//nominatim.openstreetmap.org/search?format=json&q={s},finland',
			jsonpParam: 'json_callback',
			formatData: formatJSON,
      minLength: 2,
      textPlaceholder: 'Hae...',
      autoType: false,
      autoCollapse: false,
			marker: new L.Marker([0,0],{
        icon: icon
      })
    }));

    // add geolocation control and build all map control buttons
    tutkain.buildGeoLocation()
    tutkain.buildMapControl()
    tutkain.getTimeData()
  }


  saa.tutkain.updateTimedimension = function (data) {

    if (L.Browser.mobile) {
      timeSlider = false
      $('.leaflet-bar-timecontrol').css('height','30px')
    }

    // if timedimensioncontrol already exists, remove it and all layers first
    if(timeDimensionControl !== undefined) {
      self.map.removeControl(timeDimensionControl)
      saa.tutkain.map.removeLayer(saa.tutkain.radarTimeLayer)
      saa.tutkain.map.removeLayer(saa.tutkain.flashTimeLayer)
      saa.tutkain.map.removeLayer(saa.tutkain.satelliteTimeLayer)
    }

    var timeArray = data['dimension'].split('/')
    var endTime = moment.utc(timeArray[1]).toISOString()
    var startTime = moment.utc(endTime).subtract(timeInterval, 'hours').toISOString()
    var period = timeArray[2]

    var timeDimension = new L.TimeDimension({
      timeInterval: `${startTime}/${endTime}`,
      period: period
    });
    saa.tutkain.map.timeDimension = timeDimension;
    var player = new L.TimeDimension.Player({
      transitionTime: animFrameRate,
      loop: true,
      startOver: true
    },
      timeDimension
    );

    var timeDimensionControlOptions = {
      player: player,
      timeDimension: timeDimension,
      position: 'bottomright',
      autoPlay: true,
      timeSlider: timeSlider,
      speedSlider: false,
      timeZones: ['Local', 'UTC']
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
    if (showSatellite === true) {
      var interval_start = 15
      var timestep = 15
    }

    var radar = L.tileLayer.wms(geosrvWMS, {
      layers: 'suomi_dbz_eureffin',
      format: 'image/png',
      tileSize: 512,
      transparent: true,
      opacity: radarOpacity/100,
      version: '1.3.0',
      crs: L.CRS.EPSG3857
    })

    // var flash5min = L.tileLayer.wms(dataWMS, {
    //   layers: 'fmi:observation:flashicon',
    //   format: 'image/png',
    //   tileSize: 512,
    //   transparent: true,
    //   opacity: flashOpacity/100,
    //   version: '1.3.0',
    //   crs: L.CRS.EPSG3857,
    //   interval_start: lightningIntervalStart,
    //   timestep: lightningTimestep
    // })

    var satellite = L.tileLayer.wms(eumetsatWMS, {
      layers: 'meteosat:msg_eview',
      format: 'image/png',
      tileSize: 512,
      transparent: true,
      opacity: satOpacity/100,
      version: '1.3.0',
      crs: L.CRS.EPSG3857
    })

    saa.tutkain.radarTimeLayer = L.timeDimension.layer.wms(radar, {
      updateTimeDimension: false,
      updateTimeDimensionMode: 'replace',
      wmsVersion: '1.3.0'
    })

    // saa.tutkain.flashTimeLayer = L.timeDimension.layer.wms(flash5min, {
    //   updateTimeDimension: false,
    //   updateTimeDimensionMode: 'replace',
    //   wmsVersion: '1.3.0'
    // })

    saa.tutkain.satelliteTimeLayer = L.timeDimension.layer.wms(satellite, {
      updateTimeDimension: false,
      updateTimeDimensionMode: 'replace',
      wmsVersion: '1.3.0'
    })

    saa.tutkain.radarTimeLayer._availableTimes = []
    saa.tutkain.satelliteTimeLayer._availableTimes = []

    if (showSatellite == true) { saa.tutkain.satelliteTimeLayer.addTo(self.map) }
    saa.tutkain.radarTimeLayer.addTo(self.map)
    // saa.tutkain.flashTimeLayer.addTo(self.map)
  }

  tutkain.reloadTimedimension = function (data) {
    var timeArray = data.split('/')
    var endTime = moment.utc(timeArray[1]).toISOString()
    var startTime = moment.utc(endTime).subtract(timeInterval, 'hours').toISOString()
    var period = timeArray[2]

    self.map.timeDimension.setAvailableTimes(`${startTime}/${endTime}/${period}`, 'replace')
    saa.tutkain.radarTimeLayer._availableTimes = []
    saa.tutkain.satelliteTimeLayer._availableTimes = []
  }

  // build satellite data toggle button
  tutkain.buildSatelliteControl = function () {
    L.Control.MapController = L.Control.extend({
      onAdd: function (map) {
        var container = L.DomUtil.create(
          'div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-select-source-sat'
        )
        container.id = 'toggle-satellite-data'
        container.title = 'Satelliittikuvat'
        L.DomEvent.disableClickPropagation(container)

        return container
      },
      onRemove: function (map) { }
    })
    L.control.MapController = function (opts) {
      return new L.Control.MapController(opts);
    }
    L.control.MapController({ position: 'topleft' }).addTo(map)
  }

  // build lightning data toggle button
  tutkain.buildLightningControl = function () {
    L.Control.MapController = L.Control.extend({
      onAdd: function (map) {
        var container = L.DomUtil.create(
          'div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-select-source-flash'
        )
        container.id = 'toggle-lightning-data'
        container.title = 'Salamahavainnot'
        L.DomEvent.disableClickPropagation(container)

        return container
      },
      onRemove: function (map) { }
    })
    L.control.MapController = function (opts) {
      return new L.Control.MapController(opts);
    }
    L.control.MapController({ position: 'topleft' }).addTo(map)
  }

  // build geolocation button
  tutkain.buildGeoLocation = function () {
    L.Control.MapController = L.Control.extend({
      onAdd: function (map) {
        var container = L.DomUtil.create(
          'div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-select-source-geo'
        )
        container.id = 'toggle-geolocation'
        container.title = 'Näytä käyttäjän sijainti'
        L.DomEvent.disableClickPropagation(container)

        return container
      },
      onRemove: function (map) { }
    })
    L.control.MapController = function (opts) {
      return new L.Control.MapController(opts);
    }
    L.control.MapController({ position: 'topleft' }).addTo(map)
  }

  // build open/collapse button
  tutkain.buildControl = function () {
    L.Control.MapController = L.Control.extend({
      onAdd: function (map) {
        var div = L.DomUtil.create('button', 'map-control-container-settings')
        div.id = 'map-control'
        div.title = 'Näytä animaatioasetukset'
        div.draggable = 'false'
        L.DomEvent.disableClickPropagation(div)        

        var img = L.DomUtil.create('img', 'img-collapse', div)
        img.src = 'img/settings.png'

        return div
      },
      onRemove: function (map) { }
    })
    L.control.MapController = function (opts) {
      return new L.Control.MapController(opts);
    }
    L.control.MapController({ position: 'topright' }).addTo(map)
  }

  // build animation settings control container
  tutkain.buildMapControl = function () {
    L.Control.MapController = L.Control.extend({
      onAdd: function (map) {
        var div = L.DomUtil.create('div', 'map-control-container')
        div.id = 'map-control-container'
        if(collapseOptions == 'false') {
          div.style = 'display:none'
        }

        L.DomEvent.disableClickPropagation(div)

        var header = L.DomUtil.create('div', 'map-control-container-controller-settings', div)
        var speed = L.DomUtil.create('div', 'map-control-container-controller-settings', div)
        var opacityDiv = L.DomUtil.create('div', 'map-control-container-controller-settings', div)
        var interval = L.DomUtil.create('div', 'map-control-container-controller-settings', div)
        var satellite = L.DomUtil.create('div', 'map-control-container-controller-settings', div)

        // header
        var headerContent = L.DomUtil.create('p', 'map-control-container-controller-settings-content header', header)
        headerContent.textContent = 'Animaatioasetukset'

        // animation interval
        var timeContent = L.DomUtil.create('div', 'map-control-container-controller-settings-content', interval)
        timeContent.textContent = 'Animaationopeus: '
        var speedSelect = L.DomUtil.create('select', 'content-select', timeContent)
        speedSelect.id = 'animation-speed-select'

        speedSelectors = []
        for (var i = 0; i < 4; i++) {
          speedSelectors.push(L.DomUtil.create('option', '', speedSelect))
        }

        speedSelectorText = ['Todella hidas', 'Hidas', 'Tavallinen', 'Nopea']
        speedSelectorValue = ['5000', '2000', '1000', '500']
        for (var i = 0; i < 4; i++) {
          speedSelectors[i].textContent = speedSelectorText[i]
          speedSelectors[i].value = speedSelectorValue[i]
        }

        speedSelect.value = animFrameRate

        // opacity
        var transparency = L.DomUtil.create('div', 'map-control-container-controller-settings-content', opacityDiv)
        var transparencyContent = L.DomUtil.create('div', 'map-control-container-controller-settings-content', opacityDiv)
        transparencyContent.id = 'content-select-transparency-radar'
        transparencyContent.textContent = 'Tutkakuva:'
        var transparencySlider = L.DomUtil.create('div', 'map-control-container-controller-settings-speedslider', transparency)
        var opacityRange = L.DomUtil.create('input', 'map-control-container-controller-settings-speedslider', transparencySlider)
        opacityRange.id = 'map-control-container-controller-opacity-range-radar'
        opacityRange.type = 'range'
        opacityRange.min = '1'
        opacityRange.max = '100'
        opacityRange.value = radarOpacity

        var transparency = L.DomUtil.create('div', 'map-control-container-controller-settings-content', opacityDiv)
        var transparencyContent = L.DomUtil.create('div', 'map-control-container-controller-settings-content', opacityDiv)
        transparencyContent.id = 'content-select-transparency-flash'
        transparencyContent.textContent = 'Satelliitti:'
        var transparencySlider = L.DomUtil.create('div', 'map-control-container-controller-settings-speedslider', transparency)
        var opacityRange = L.DomUtil.create('input', 'map-control-container-controller-settings-speedslider', transparencySlider)
        opacityRange.id = 'map-control-container-controller-opacity-range-satellite'
        opacityRange.type = 'range'
        opacityRange.min = '1'
        opacityRange.max = '100'
        opacityRange.value = satOpacity

        // time intervall
        var timeContent = L.DomUtil.create('div', 'map-control-container-controller-settings-content', interval)
        timeContent.textContent = 'Aikaikkuna: '
        var intervalSelect = L.DomUtil.create('select', 'content-select', timeContent)
        intervalSelect.id = 'animation-interval-select'

        intervalSelectors = []
        for (var i = 0; i < 5; i++) {
          intervalSelectors.push(L.DomUtil.create('option', '', intervalSelect))
        }

        intervalSelectorText = ['1 tunti', '2 tuntia', '3 tuntia', '4 tuntia', '5 tuntia']
        intervalSelectorValue = ['1', '2', '3', '4', '5']
        for (var i = 0; i < 5; i++) {
          intervalSelectors[i].textContent = intervalSelectorText[i]
          intervalSelectors[i].value = intervalSelectorValue[i]
        }

        intervalSelect.value = timeInterval

        return div;
      },
      onRemove: function (map) { }
    });
    L.control.MapController = function (opts) {
      return new L.Control.MapController(opts);
    }
    L.control.MapController({ position: 'topright' }).addTo(map)

    // Update the current slider value (each time one drags the slider handle)
    var slider = document.getElementById("map-control-container-controller-opacity-range-radar");
    slider.oninput = function() {
      radarOpacity = this.value;
      saa.tutkain.radarTimeLayer.setOpacity(this.value/100);
      localStorage.setItem('radarOpacity', radarOpacity)
    }
    var slider2 = document.getElementById("map-control-container-controller-opacity-range-satellite");
    slider2.oninput = function() {
      satOpacity = this.value;
      saa.tutkain.satelliteTimeLayer.setOpacity(this.value/100);
      localStorage.setItem('satOpacity', satOpacity)
    }

    // timeinterval select
    var timeInteralSelect = document.getElementById("animation-interval-select");
    timeInteralSelect.addEventListener("change", function() {
      timeInterval = this.value
      localStorage.setItem('timeInterval', timeInterval)
      saa.tutkain.getTimeData()
    });

    // animation speed select
    var timeInteralSelect = document.getElementById("animation-speed-select");
    timeInteralSelect.addEventListener("change", function() {
      animFrameRate = this.value
      localStorage.setItem('animFrameRate', animFrameRate)
      saa.tutkain.getTimeData()
    });

    // show/hide satellite data layer
    var satButton = document.getElementById("toggle-satellite-data");
    satButton.addEventListener("click", function () {
      //check to see if the layer is already on the map
      //and add/remove as needed
      if (saa.tutkain.map.hasLayer(saa.tutkain.satelliteTimeLayer) == true) {
        saa.tutkain.satelliteTimeLayer.remove(saa.tutkain.map);
        showSatellite = false
        localStorage.setItem('showSatellite',false)
        lightningIntervalStart = 5
        lightningTimestep = 5
        satButton.style = 'background-image: url(img/satellite.png);'
        saa.tutkain.getTimeData()
      } else {
        saa.tutkain.satelliteTimeLayer.addTo(saa.tutkain.map);
        showSatellite = true
        localStorage.setItem('showSatellite',true)
        lightningIntervalStart = 15
        lightningTimestep = 15
        satButton.style = 'background-image: url(img/satellite-blue.png);'
        saa.tutkain.getTimeData()
      }
    });

    // show/hide lightning observations
    var flashButton = document.getElementById("toggle-lightning-data");
    flashButton.addEventListener("click", function () {
      if(map.hasLayer(saa.lightning.geoLayer)) {
        map.removeLayer(saa.lightning.geoLayer);
        flashButton.style = 'background-image: url(img/flash.png);'
      } else {
        map.addLayer(saa.lightning.geoLayer);
        flashButton.style = 'background-image: url(img/flash-blue.png);'
     }
    });

    // use geolocation
    var geolocationButton = document.getElementById("toggle-geolocation");
    geolocationButton.addEventListener("click", function () {
      geolocationButton.style = 'background-image: url(img/locate-blue.png);'
      tutkain.locate()
    });

    // show/hide control options
    var ctrlButton = document.getElementById("map-control");
    ctrlButton.addEventListener("click", function () {

      if(collapseOptions == 'true') collapseOptions = true

      var ctrlDiv = document.getElementById('map-control-container')
      if (collapseOptions == true) {
        ctrlDiv.style = 'display:none'
        collapseOptions = false
        localStorage.setItem('collapseOptions', false)
      } else {
        ctrlDiv.style = 'display:inline'
        collapseOptions = true
        localStorage.setItem('collapseOptions', true)
      }
    });
  }


  setInterval(function () {
    saa.tutkain.getTimeData('reload')
  }, interval)
}(saa.tutkain = saa.tutkain || {}))
