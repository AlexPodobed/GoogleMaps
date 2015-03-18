function Map(cfg) {
  this.config = {
    zoom: cfg.zoom || 10,
    mapTypeId: google.maps.MapTypeId[cfg.mapTypeId || "HYBRID"]
  };
  this.el = document.querySelector(cfg.el);
  this.map = undefined;
  this.$$on = google.maps.event.addListener;
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

Map.prototype.init = function (cb) {
  this.getCurrentPosition()
    .done(function (coords) {
      console.log(coords)
      this.createMap(coords);
      this.attachEvents();
      cb()
    }.bind(this))
};

Map.prototype.attachEvents = function () {
  var $$on;

  /** $$on google.maps.event.addListener */


  this.$$on(this.map, 'center_changed', function () {
    console.log('changed center');
  });

  this.$$on(this.map, 'click', function (location) {
    console.log(location)
    var marker = new Marker({
      map: this.map,
      position: location.latLng
    });
    marker.init();

  }.bind(this));
};

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
Marker.prototype.create = function () {
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

  this.$$on(this.markerInstance, 'click', function () {
    this.map.setCenter(this.config.position)
  }.bind(this))

  this.$$on(this.markerInstance, 'mouseover', function () {
    if (!this.infoWindow) {
      this.createInfoWindow();
    }
    this.infoWindow.open(this.map, this.markerInstance);

  }.bind(this))
  this.$$on(this.markerInstance, 'mouseout', function () {
    //this.infoWindow.close();
  }.bind(this))

};
Marker.prototype.init = function () {
  this.create();
  this.attachEvents();
};


var forecastAPI = (function () {
  var API_URL = "http://api.openweathermap.org/data/2.5/weather?"; //lat=50.08605&lon=19.98041699999
  function getWeather(coords) {
    console.log(coords);
    return $.get(API_URL + "lat=" + coords.k + "&lon=" + coords.D)
  }

  return {
    getWeather: getWeather
  }
})();


var map = new Map({zoom: 14, el: "#map_canvas"});

map.init(function () {
  var marker = new Marker({map: map.map, position: map.map.getCenter()});
  marker.init();
});


