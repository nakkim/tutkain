var saa = saa || {};

(function (tutkainControl, undefined) {

  tutkainControl.reloadTimedimension = function (data) {
    var timeArray = data.split('/')
    var endTime = moment.utc(timeArray[1]).toISOString()
    var startTime = moment.utc(endTime).subtract(timeInterval, 'hours').toISOString()
    var period = timeArray[2]

    self.map.timeDimension.setAvailableTimes(`${startTime}/${endTime}/${period}`, 'replace')
    saa.tutkain.radarTimeLayer._availableTimes = []
    saa.tutkain.satelliteTimeLayer._availableTimes = []
  }

  // build satellite data toggle button
  // tutkainControl.buildSatelliteControl = function () {
  //   L.Control.MapController = L.Control.extend({
  //     onAdd: function (map) {
  //       var container = L.DomUtil.create(
  //         'div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-select-source-sat'
  //       )
  //       container.id = 'toggle-satellite-data'
  //       if(saa.tutkain.showSatellite == 'true') container.style = 'background-image: url(img/satellite-blue.png);'
  //       container.title = 'Satelliittikuvat'
  //       L.DomEvent.disableClickPropagation(container)

  //       return container
  //     },
  //     onRemove: function (map) { }
  //   })
  //   L.control.MapController = function (opts) {
  //     return new L.Control.MapController(opts);
  //   }
  //   L.control.MapController({ position: 'topleft' }).addTo(map)
  // }

  // build lightning data toggle button
  tutkainControl.buildLightningControl = function () {
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

  // build information box toggle button
  tutkainControl.buildInfo = function () {
    var infoControl = L.Control.extend({
      options: {
        position: 'topleft'
      },
      onAdd: function (map) {
        var container = L.DomUtil.create(
          'div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-toggle-info'
        )

        var sidebar = L.control.sidebar('sidebar', {
          position: 'left',
          closeButton: true
        });
        
        map.addControl(sidebar);

        container.onclick = function(){
          sidebar.toggle();
        }
        container.title = 'Lisätietoja palvelusta'
        return container
      }
    })
    map.addControl(new infoControl());
  }

  // build force reload button
  tutkainControl.buildReload = function () {
    L.Control.MapController = L.Control.extend({
      onAdd: function (map) {
        var container = L.DomUtil.create(
          'div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-force-reload'
        )
        container.id = 'force-reload'
        container.title = 'Päivitä havainnot'
        L.DomEvent.disableClickPropagation(container)

        var image = L.DomUtil.create('div', 'reload-image', container)
        image.id = 'reload-image'

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
  tutkainControl.buildControl = function () {
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
  tutkainControl.buildMapControl = function () {
    L.Control.MapController = L.Control.extend({
      onAdd: function (map) {
        var div = L.DomUtil.create('div', 'map-control-container')
        div.id = 'map-control-container'
        if(saa.tutkain.collapseOptions == 'false') {
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
        for (var i = 0; i < 5; i++) {
          speedSelectors.push(L.DomUtil.create('option', '', speedSelect))
        }

        speedSelectorText = ['Todella hidas', 'Hidas', 'Tavallinen', 'Nopea', 'Todella nopea']
        speedSelectorValue = ['5000', '2000', '1000', '500', '100']
        for (var i = 0; i < 5; i++) {
          speedSelectors[i].textContent = speedSelectorText[i]
          speedSelectors[i].value = speedSelectorValue[i]
        }

        speedSelect.value = saa.tutkain.animFrameRate

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
        opacityRange.value = saa.tutkain.radarOpacity

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
        opacityRange.value = saa.tutkain.satOpacity

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

        intervalSelect.value = saa.tutkain.timeInterval

        // toggle speedSlider
        var slider = L.DomUtil.create('div', 'map-control-container-controller-settings-content', div)
        slider.textContent = 'Aikavalitsin: '
        var wrapper = L.DomUtil.create('div', 'content-select', slider)
        var input = L.DomUtil.create('input', '', wrapper)
        input.id = 'animation-speedslider-select'
        input.type = 'checkbox'
        input.style = 'width:auto; margin-left:0;'
        if(saa.tutkain.timeSlider == true || saa.tutkain.timeSlider == 'true') {
          input.value = '1'
          input.setAttribute('checked', 'checked');
        } else { 
          input.value = '0'
          input.removeAttribute('checked');
        }

        // satellite image
        var satelliteContent = L.DomUtil.create('div', 'map-control-container-controller-settings-content', div)
        satelliteContent.textContent = 'Satelliittikuva: '
        var productSelect = L.DomUtil.create('select', 'content-select', satelliteContent)
        productSelect.id = 'satelite-product-select',
        productSelect.value = saa.tutkain.selectedSatelliteProduct

        var satelliteImages = []
        for (var i = 0; i < 2; i++) {
          satelliteImages.push(L.DomUtil.create('option', '', productSelect))
        }

        var satelliteSelectorText = ['HRV RGB (näkyvä valo)', 'Low Clouds RGB (infrapuna)']
        var satelliteSelectorValue = ['0', '1', '2', '3']
        for (var i = 0; i < 2; i++) {
          satelliteImages[i].textContent = satelliteSelectorText[i]
          satelliteImages[i].value = satelliteSelectorValue[i]
        }

        productSelect.value = saa.tutkain.selectedSatelliteProduct

        productSelect.addEventListener("change", function() {
          saa.tutkain.selectedSatelliteProduct = this.value
          localStorage.setItem('satelliteProduct', saa.tutkain.selectedSatelliteProduct)
          saa.tutkain.getTimeData()
        });

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
      saa.tutkain.radarOpacity = this.value;
      saa.tutkain.radarTimeLayer.setOpacity(this.value/100);
      localStorage.setItem('radarOpacity', saa.tutkain.radarOpacity)
    }
    var slider2 = document.getElementById("map-control-container-controller-opacity-range-satellite");
    slider2.oninput = function() {
      saa.tutkain.satOpacity = this.value;
      saa.tutkain.satelliteTimeLayer.setOpacity(this.value/100);
      localStorage.setItem('satOpacity', saa.tutkain.satOpacity)
    }

    // timeinterval select
    var timeInteralSelect = document.getElementById("animation-interval-select");
    timeInteralSelect.addEventListener("change", function() {
      saa.tutkain.timeInterval = this.value
      localStorage.setItem('timeInterval', saa.tutkain.timeInterval)
      saa.tutkain.getTimeData()
    });

    // animation speed select
    var timeInteralSelect = document.getElementById("animation-speed-select");
    timeInteralSelect.addEventListener("change", function() {
      saa.tutkain.animFrameRate = this.value
      localStorage.setItem('animFrameRate', saa.tutkain.animFrameRate)
      saa.tutkain.getTimeData()
    });

    // show/hide satellite data layer
    // var satButton = document.getElementById("toggle-satellite-data");
    // satButton.addEventListener("click", function () {
    //   //check to see if the layer is already on the map
    //   //and add/remove as needed
    //   if (saa.tutkain.map.hasLayer(saa.tutkain.satelliteTimeLayer) == true) {
    //     saa.tutkain.satelliteTimeLayer.remove(saa.tutkain.map);
    //     saa.tutkain.showSatellite = false
    //     localStorage.setItem('showSatellite',false)
    //     saa.tutkain.lightningIntervalStart = 5
    //     saa.tutkain.lightningTimestep = 5
    //     satButton.style = 'background-image: url(img/satellite.png);'
    //     saa.tutkain.getTimeData()
    //   } else {
    //     saa.tutkain.satelliteTimeLayer.addTo(saa.tutkain.map);
    //     saa.tutkain.showSatellite = true
    //     localStorage.setItem('showSatellite',true)
    //     saa.tutkain.lightningIntervalStart = 15
    //     saa.tutkain.lightningTimestep = 15
    //     satButton.style = 'background-image: url(img/satellite-blue.png);'
    //     saa.tutkain.getTimeData()
    //   }
    // });

    // reload observations
    var reloadButton = document.getElementById("force-reload");
    reloadButton.addEventListener("click", function () {
      if(typeof saa.tutkain.dataString !== 'undefined') {
        var last = (saa.tutkain.dataString['dimension'].split('/'))[1]
        last = moment(last)
        var diff = moment().diff(last, "minutes")
        // add check to prevent unnecessary getcapabilities polling
        if(diff > 10 && (saa.tutkain.dataString['dimension'].split('/'))[2] === 'PT5M')
        saa.tutkain.getTimeData('reload')
        if(diff > 20 && (saa.tutkain.dataString['dimension'].split('/'))[1] === 'PT15M')
        saa.tutkain.getTimeData('reload')
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

    // show/hide control options
    var ctrlButton = document.getElementById("map-control");
    ctrlButton.addEventListener("click", function () {

      if(saa.tutkain.collapseOptions === 'true') saa.tutkain.collapseOptions = true
      var ctrlDiv = document.getElementById('map-control-container')
      if (saa.tutkain.collapseOptions === true) {
        ctrlDiv.style = 'display:none'
        saa.tutkain.collapseOptions = false
        localStorage.setItem('collapseOptions', false)
      } else {
        ctrlDiv.style = 'display:inline'
        saa.tutkain.collapseOptions = true
        localStorage.setItem('collapseOptions', true)
      }
    });

    var checkbox = document.getElementById('animation-speedslider-select')
    checkbox.addEventListener('change', function() {
      if(this.checked) {
        saa.tutkain.timeSlider = true
        localStorage.setItem('timeSlider',true)
        saa.tutkain.getTimeData()
      } else {
        saa.tutkain.timeSlider = false
        localStorage.setItem('timeSlider',false)
        saa.tutkain.getTimeData()      
      }
    })
  }

}(saa.tutkainControl = saa.tutkainControls || {}))