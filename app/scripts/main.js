$(function () {

  var Map = (function () {
    var config = {
          zoom: 12,
          mapTypeId: google.maps.MapTypeId.HYBRID
        },
        mapEl = $('#map_canvas')[0],
        mapOn = google.maps.event.addListener,
        map, marker;

    function getCurrentPosition() {
      var d = $.Deferred();

      navigator.geolocation.getCurrentPosition(function (position) {
        var coords = {
          lat: position.coords.latitude,
          long: position.coords.longitude
        };
        d.resolve(coords);
      });

      return d.promise();
    }

    function createMap(coords){
      config.center =  new google.maps.LatLng(coords.lat, coords.long);
      map = new google.maps.Map(mapEl, config);
    }

    function createMarker(){
      marker = new google.maps.Marker({
        map: map,
        position: map.getCenter(),
        title: "click to zoom"
      })
    }

    function attachEvents(){
      var center_changed_timeout_ID;

      mapOn(map, 'center_changed', function () {
        if(!center_changed_timeout_ID){
          center_changed_timeout_ID = setTimeout(function () {
            center_changed_timeout_ID = undefined
            map.panTo(marker.getPosition());
          }, 2e3)
        }
      });
      mapOn(marker, 'click', function () {
        config.zoom += 2;
        map.setZoom(config.zoom);
        map.setCenter(marker.getPosition());
      });

      mapOn(map, 'click', function(data){
        console.log(data.latLng.k, data.latLng.D)

        new google.maps.Marker({
          map: map,
          position: data.latLng,
        })
      })
    }

    function initialize() {
      getCurrentPosition()
        .done(function (coords) {
          createMap(coords);
          createMarker();
          attachEvents()
        });
    }

    return {
      getCoords: getCurrentPosition,
      init: initialize
    }

  })();

  //Map.init()
});
