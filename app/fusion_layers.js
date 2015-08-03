var POLYGONS = {
  'cantons': {
    'table_id': '812449',
    'kml_field_id': 'KANTONSNR',
    'entries': {
      'id_19': {'name': 'Aargau', 'bounds': '7.7136_47.6211_8.4551_47.1375'},
      'id_15': {'name': 'Appenzell Ausserrhoden', 'bounds': '9.1913_47.469_9.631_47.247'},
      'id_16': {'name': 'Appenzell Innerrhoden', 'bounds': '9.3098_47.3871_9.5031_47.234'},
      'id_13': {'name': 'Basel-Landschaft', 'bounds': '7.3759_47.5644_7.9618_47.338'},
      'id_12': {'name': 'Basel-Stadt', 'bounds': '7.5546_47.6009_7.6937_47.5193'},
      'id_2': {'name': 'Bern', 'bounds': '6.8615_47.3224_8.4551_46.3265'},
      'id_10': {'name': 'Fribourg', 'bounds': '6.7949_47.0069_7.3803_46.4379'},
      'id_25': {'name': 'Genève', 'bounds': '5.9559_46.3175_6.3103_46.1285'},
      'id_8': {'name': 'Glarus', 'bounds': '8.8712_47.1739_9.2526_46.7965'},
      'id_18': {'name': 'Graubünden', 'bounds': '8.6511_47.0651_10.492_46.1692'},
      'id_26': {'name': 'Jura', 'bounds': '6.8408_47.5045_7.5583_47.1504'},
      'id_0': {'name': 'Liechtenstein', 'bounds': '9.4717_47.2706_9.6356_47.0484'},
      'id_3': {'name': 'Luzern', 'bounds': '7.8365_47.2872_8.514_46.775'},
      'id_24': {'name': 'Neuchâtel', 'bounds': '6.4326_47.1657_7.0877_46.8465'},
      'id_7': {'name': 'Nidwalden', 'bounds': '8.2182_47.02_8.5749_46.7715'},
      'id_6': {'name': 'Obwalden', 'bounds': '8.0423_46.9804_8.3689_46.7532'},
      'id_14': {'name': 'Schaffhausen', 'bounds': '8.4047_47.8085_8.7414_47.6384'},
      'id_5': {'name': 'Schwyz', 'bounds': '8.3889_47.2226_9.0048_46.8853'},
      'id_11': {'name': 'Solothurn', 'bounds': '7.3404_47.4968_8.0312_47.0743'},
      'id_17': {'name': 'St. Gallen', 'bounds': '8.7956_47.5472_9.6741_46.8729'},
      'id_20': {'name': 'Thurgau', 'bounds': '8.668_47.6955_9.5028_47.3758'},
      'id_21': {'name': 'Ticino', 'bounds': '8.382_46.6325_9.1597_45.818'},
      'id_4': {'name': 'Uri', 'bounds': '8.3973_46.9934_8.9579_46.5276'},
      'id_23': {'name': 'Valais', 'bounds': '6.7706_46.6541_8.4786_45.8583'},
      'id_22': {'name': 'Vaud', 'bounds': '6.0638_46.9361_7.2492_46.187'},
      'id_9': {'name': 'Zug', 'bounds': '8.3948_47.2484_8.7012_47.0811'},
      'id_1': {'name': 'Zürich', 'bounds': '8.3577_47.6945_8.985_47.1594'}
    }
  }
};

var FusionLayerMap = (function(){
  var bgOpacityHover = 0.55;
  var bgOpacity = 0.2;
  var strokeColor = "#4E4E4E";
  var fillColor = "#565656";
  var settings = {
    selectStr: "name, col5, code, KANTONSNR",
    tableId: "1MlTyWeXOjM3l90dxRt-dPeHOzVS6CfuRPilLKcnV",
    key: "AIzaSyB8xrVR4l0tVj0-_9rEhYi-8DH3zt_HJNk"
  };
  var polygons = [];
  var map;

  function init() {
    var myOptions = {
      zoom: 8,
      center: new google.maps.LatLng(46.82243442740395, 7.8662471904297036),
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('googft-mapCanvas'), myOptions);

    getTable();

    // gray background for all areas except of Switzerland
    var layer = new google.maps.FusionTablesLayer(812706, {
      suppressInfoWindows: true,
      clickable: false,
      map: map
    });
  }
  function drawFussionMap(data) {
    var rows = data['rows'];

    var polygonOpts = {
      strokeColor: strokeColor,
      strokeOpacity: 1,
      strokeWeight: 0.5,
      fillColor: fillColor,
      fillOpacity: bgOpacity
    };
    var lastClick = {
      id: ""
    };

    if (rows && rows.length) {
      for (var i in rows) {
        var newCoordinates = [];
        var geometries = rows[i][1]['geometries'];

        if (geometries) {
          for (var j in geometries) {
            newCoordinates.push(constructNewCoordinates(geometries[j]));
          }
        } else {
          newCoordinates = constructNewCoordinates(rows[i][1]['geometry']);
        }

        polygonOpts.paths = newCoordinates;
        var region = new google.maps.Polygon(polygonOpts);
        polygons.push(region);

        (function(x){
          google.maps.event.addListener(region, 'mouseout', function () {
            triggerMouseOverOut(rows, lastClick, x, this, true);
          });

          google.maps.event.addListener(region, 'mouseover', function () {
            triggerMouseOverOut(rows, lastClick, x, this, false);
          });

          google.maps.event.addListener(region, 'click', function () {
            onClick(rows,lastClick, x, this)
          });
        })(i);
        region.setMap(map)
      } // end for loop
    }
  }
  function triggerMouseOverOut(rows,lastClick, x, context, flag){
    if(rows[x][3] === lastClick.id){
      return
    }
    context.setOptions({fillOpacity: flag ? bgOpacity : bgOpacityHover});
  }
  function onClick(rows,lastClick,x, context){
    if(polygons[lastClick.id]){
      polygons[lastClick.id].setOptions({fillOpacity: bgOpacity, strokeWeight: 0.5})
    }

    lastClick.id = rows[x][3];
    var bp = POLYGONS['cantons']['entries']["id_"+rows[x][3]]['bounds'].split('_');
    var bounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(parseFloat(bp[3]), parseFloat(bp[0])),
      new google.maps.LatLng(parseFloat(bp[1]), parseFloat(bp[2]))
    );
    context.setOptions({fillOpacity: 0, strokeWeight: 1.25});
    map.fitBounds(bounds);
  }
  function constructNewCoordinates(polygon) {
    var newCoordinates = [];
    var coordinates = polygon['coordinates'][0];
    for (var i in coordinates) {
      newCoordinates.push(
        new google.maps.LatLng(coordinates[i][1], coordinates[i][0]));
    }
    return newCoordinates;
  }
  function generateUrl(){
    var url = ['https://www.googleapis.com/fusiontables/v1/query?'];
    var query = 'SELECT ' + settings.selectStr + ' FROM ' + settings.tableId;
    var encodedQuery = encodeURIComponent(query);
    url.push('sql=');
    url.push(encodedQuery);
    url.push('&key=' + settings.key);
    return url.join('')
  }
  function getTable(){
    $.ajax({
      type: "GET",
      url: generateUrl(),
      async: true,
      cache: true,
      dataType: "jsonp",
      jsonpCallback: "jsonCallback",
      success: drawFussionMap,
      error: function(err){
        console.log(err);
      }
    })
  }

  return {
    init: function(){
      google.maps.event.addDomListener(window, 'load', init);
    }
  }

})();

FusionLayerMap.init();
