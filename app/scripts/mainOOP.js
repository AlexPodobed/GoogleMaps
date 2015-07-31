;(function () {

  /*
  *    MAP Constructor
  * */
  function Map(cfg) {
    this.config = {
      zoom: cfg.zoom || 10,
      mapTypeId: google.maps.MapTypeId[cfg.mapTypeId || "HYBRID"]
    };
    this.el = document.querySelector(cfg.el);
    this.map = undefined;
    this.$$on = google.maps.event.addListener;
    this.$$one = google.maps.event.addListenerOnce;
    this.markers = [];
    this.overlay = null;
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
    this.$$on(this.map, 'click', this.events.createByClick.bind(this));
    this.$$on(this.map, 'dragstart', this.events.removeLayer.bind(this));
    this.$$on(this.map, 'zoom_changed', this.events.removeLayer.bind(this));
    //this.$$on(this.map, 'dragend', this.events.addLayer.bind(this));
    this.$$on(this.map, 'idle', this.events.addLayer.bind(this));
  };
  Map.prototype.events = {
    createByClick: function (location) {
      console.log(location)
      this.createMarker(location.latLng)
    },

    removeLayer: function () {
      if(this.overlay){
        console.log('remove')
        this.overlay.setMap(null);
        this.overlay = null;
      }
    },
    addLayer: function () {
      var bounds = this.map.getBounds();

      this.overlay = new Overlay(bounds,this.map);
      this.overlay.addLayer();

    }
  };
  Map.prototype.init = function (cb) {
    this.getCurrentPosition()
      .done(function (coords) {
        this.createMap(coords);
        this.attachEvents();
        this.createMarker(this.map.getCenter());
        if(typeof cb === 'function') cb();
      }.bind(this));
  };



  /*
  *   OVERLAY Constructor
  * */

  function Overlay(bounds, map){
    this.bounds = bounds;
    this.map = map;
    this.image = null;
    this.div = null;

    //this.setMap(map);
  }

  Overlay.prototype = new google.maps.OverlayView();
  Overlay.prototype.onAdd = function () {
    console.log('onAdd')
    var div = document.createElement('div');
    div.style.borderStyle = "none";
    div.id = "ovlay"
    div.style.borderStyle = "0px";
    div.style.position = "absolute";

    var img = document.createElement('img');
    img.src = this.image;
    img.style.width = "100%";
    img.style.height = "100%";
    //img.style.opacity = 0.7;

    img.style.position = "absolute";
    div.appendChild(img);

    this.div = div;

    var panes = this.getPanes();
    panes.overlayLayer.appendChild(div);
  };
  Overlay.prototype.draw = function () {
    console.log('draw')

    var overlayProjection = this.getProjection();
    var sw = overlayProjection.fromLatLngToDivPixel(this.bounds.getSouthWest());
    var ne = overlayProjection.fromLatLngToDivPixel(this.bounds.getNorthEast());

    var div = this.div;
    div.style.left = sw.x + "px";
    div.style.top = ne.y + "px";
    div.style.width = ( ne.x - sw.x ) + "px";
    div.style.height = ( sw.y - ne.y ) + "px";
  };
  Overlay.prototype.onRemove = function () {
    console.log('removed')
    if(this.div){
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  };
  Overlay.prototype.createRequestParams = function(bbox, zoom, dim) {
    var params = "";
    params += "&REQUEST=GetMap";
    params += "&SERVICE=WMS";
    params += "&VERSION=1.1.1";
    params += "&STYLES=default";
    params += "&FORMAT=image/png";
    params += "&BGCOLOR=0xffffff";
    params += "&TRANSPARENT=TRUE";
    params += "&SRS=EPSG:54004";
    params += "&BBOX=" + bbox;
    params += "&WIDTH=" + dim.width;
    params += "&HEIGHT=" + dim.height;
    params += "&gzoom=" + (zoom-1);
    return params;
  };
  Overlay.prototype.exdd2MercMetersLat = function(latitude) {
    //Google Maps V3 is in EPSG:3857, but we use EPSG:4326 maps
    var WGS84_SEMI_MAJOR_AXIS = 6378137.0;
    var WGS84_ECCENTRICITY = 0.0818191913108718138;

    if (latitude == -90)
      latitude = -89.999;
    var rads = latitude * Math.PI / 180.0;

    var returner = WGS84_SEMI_MAJOR_AXIS * Math.log(Math.tan((rads + Math.PI / 2) / 2) * Math.pow(((1 - WGS84_ECCENTRICITY * Math.sin(rads)) / (1 + WGS84_ECCENTRICITY * Math.sin(rads))), WGS84_ECCENTRICITY / 2));
    return returner;
  };
  Overlay.prototype.exdd2MercMetersLng = function(longitude) {
    var WGS84_SEMI_MAJOR_AXIS = 6378137.0;
    return WGS84_SEMI_MAJOR_AXIS * (longitude * Math.PI / 180.0);
  };
  Overlay.prototype.getBoundingBox = function() {

    var mapSW = this.bounds.getSouthWest();
    var mapNE = this.bounds.getNorthEast();
    var north = mapNE.lat();
    var south = mapSW.lat();
    var east = mapNE.lng();
    var west = mapSW.lng();


    //for 54004 projection
    return Math.round(this.exdd2MercMetersLng(west)) + "," + Math.round(this.exdd2MercMetersLat(south)) + "," + Math.round(this.exdd2MercMetersLng(east)) + "," + Math.round(this.exdd2MercMetersLat(north));

  };
  Overlay.prototype.getDim = function(el) {
    return {
      "height": jQuery(el).height(),
      "width": jQuery(el).width()
    }
  };
  Overlay.prototype.addLayer = function () {
    var url = "http://mapserver.routeguard.eu/release_3_0_3/mapfiles/scripts/createlayers.php?MAP=%2Fvar%2Fwww%2Fmapserver%2Frouteguard%2Frelease_3_0_3%2Fmapfiles%2Frg_mapfile.map&LAYERS=tt_atm%3B75%24false&fp=0&mdate=2015-05-10&mhour=12&date=2015-05-10&hour=12";
    var bbox = this.getBoundingBox();
    var zoom = this.map.getZoom();
    var dim = this.getDim("#map_canvas");
    var req = this.createRequestParams(bbox, zoom, dim);

    this.image = url + req;
    this.setMap(this.map);
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
    this.$$on(this.markerInstance, 'dblclick', this.events.removeMarker.bind(this));
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
    },
    removeMarker: function () {
      console.log('remove', this)
      this.markerInstance.setMap(null);
    }
  };
  Marker.prototype.init = function () {
    this.createInstance();
    //this.attachEvents();
    //this.events.openWindow.call(this);
  };


  /*
  *     FORECAST API FACADE
  * */
  var forecastAPI = (function () {
    var API_URL = "http://api.openweathermap.org/data/2.5/weather?"; //lat=50.08605&lon=19.98041699999

    function getWeather(coords) {
      return $.get(API_URL + "lat=" + coords.k + "&lon=" + coords.D)
    }

    return {
      getWeather: getWeather
    }
  })();


  window.loadMaps = function (){
    console.log('loaded');
    var map = new Map({zoom: 3, el: "#map_canvas"});
    map.init();
  };
  /*    USAGE */
  $(function () {
    var map = new Map({zoom: 3, el: "#map_canvas"});
    map.init();
    //for debugging
    window.map = map;

    /*&language=ja*/
    function loadAPI() {
      var script = document.createElement("script");
      script.src = "http://www.google.com/jsapi?key=&language=ja&callback=loadMaps";
      script.type = "text/javascript";
      script.id = "map_script";
      document.getElementsByTagName("head")[0].appendChild(script);
    }

    $("#changeLang").on('click', function () {
      console.log()

      $("#map_script").remove();
      $("#map_canvas").empty();

      loadAPI()
    })
  });

})();
