;(function () {
  function Map(cfg) {
    this.config = {
      zoom: cfg.zoom || 10,
      mapTypeId: google.maps.MapTypeId[cfg.mapTypeId || "HYBRID"]
    };
    this.el = document.querySelector(cfg.el);
    this.map = undefined;
    this.$$on = google.maps.event.addListener;
    this.markers = [];
  }
  Map.prototype.getCurrentPosition = function () {
    var d = $.Deferred();

    navigator.geolocation.getCurrentPosition(function (position) {
      var coords = {
        lat: position.coords.latitude,
        long: position.coords.longitude
      };
      d.resolve(coords);
    });

    return d.promise();
  };
  Map.prototype.createMap = function (coords) {
    this.config.center = new google.maps.LatLng(coords.lat, coords.long);
    this.map = new google.maps.Map(this.el, this.config);
  };
  Map.prototype.createMarker = function (position) {
    var marker = new Marker({
      map: this.map,
      position: position
    });
    marker.init();
    this.markers.push(marker);
  };
  Map.prototype.attachEvents = function () {
    this.$$on(this.map, this.events.changeCenter);

    this.$$on(this.map, 'click', this.events.createByClick.bind(this));
  };
  Map.prototype.events = {
    createByClick: function (location) {
      this.createMarker(location.latLng)
    },
    changeCenter: function () {
      console.log('Changed center');
    }
  };
  Map.prototype.init = function (cb) {
    this.getCurrentPosition()
      .done(function (coords) {
        this.createMap(coords);
        this.attachEvents();
        this.createMarker(this.map.getCenter())
        if(typeof cb === 'function') cb();
      }.bind(this));
  };

  /*
   *    MARKER Constructor:
   * */

  function Marker(cfg) {
    this.markerInstance = undefined;
    this.infoWindow = undefined;
    this.map = cfg.map;
    this.config = {
      map: this.map,
      position: cfg.position,
      title: cfg.title || "some title"
    };

    /** this.$$on -  google.maps.event.addListener */
    this.$$on = google.maps.event.addListener;

  }
  Marker.prototype.createInstance = function () {
    this.markerInstance = new google.maps.Marker(this.config);
  };
  Marker.prototype.generateTemplate = function (data) {
    var compiled = _.template($('#markerInfoTempalte').text());

    return compiled({
      temperature: (data.main.temp - 273.15).toFixed(2),
      icon: data.weather[0].icon,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      speed: data.wind.speed,
      weather: {
        main: data.weather[0].main
      }
    });

  };
  Marker.prototype.createInfoWindow = function () {
    this.infoWindow = new google.maps.InfoWindow({
      content: "loading..."
    });

    forecastAPI.getWeather(this.config.position)
      .then(function (data) {
        var template = this.generateTemplate(data);
        this.infoWindow.setContent(template);
      }.bind(this))
  };
  Marker.prototype.attachEvents = function () {
    this.$$on(this.markerInstance, 'click', this.events.centerMap.bind(this));
    this.$$on(this.markerInstance, 'mouseover', this.events.openWindow.bind(this));
    this.$$on(this.markerInstance, 'mouseout', this.events.closeWindow.bind(this));
  };
  Marker.prototype.events = {
    openWindow: function () {
      if (!this.infoWindow) {
        this.createInfoWindow();
      }
      this.infoWindow.open(this.map, this.markerInstance);
    },
    closeWindow: function () {
      this.infoWindow.close();
    },
    centerMap: function(){
      this.map.setCenter(this.config.position);
    }
  };
  Marker.prototype.init = function () {
    this.createInstance();
    this.attachEvents();
    this.events.openWindow.call(this);
  };

  var forecastAPI = (function () {
    var API_URL = "http://api.openweathermap.org/data/2.5/weather?"; //lat=50.08605&lon=19.98041699999

    function getWeather(coords) {
      return $.get(API_URL + "lat=" + coords.k + "&lon=" + coords.D)
    }

    return {
      getWeather: getWeather
    }
  })();

  $(function () {
    var map = new Map({zoom: 2, el: "#map_canvas"});
    map.init();
  });

})();
