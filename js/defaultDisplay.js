var map;
var geoJSON = {
    type: "FeatureCollection",
        features: []
};
var request;
var openWeatherMapKey = "7814dd27bd44184ffe859c64f61f28e1";
var accuWeatherKey = "gT2cRQgWlT95iS6IUIzIGm0U1wGgX7E5";
var pollenRequest;
var pollenRequestBase = "https://dataservice.accuweather.com/forecasts/v1/daily/1day/"
var accuLocationIDs = [
    15581,15570,15849,15536,15609,15773,2266035,15744,15552
];


function initialize() {
    var infowindow = new google.maps.InfoWindow();
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(-37.8141,144.9633)
    };
    map = new google.maps.Map(document.getElementById('mapDemo'),
        mapOptions);

    displayHeatMap();

//comment this line when developing due to accu weather call limitation
    getWeathers();

    map.data.addListener('click', function(event) {
        infowindow.setContent(
           // "<img src=" + event.feature.getProperty("icon") + ">" +
            "<br /><strong>" + event.feature.getProperty("city") + "</strong>"
            + "<br />" + event.feature.getProperty("temperature") + "&deg;C"
            + "<br />" + event.feature.getProperty("weather")
            + "<br />Pollen count: " + event.feature.getProperty("pollenCount")
            + "<br />Air quality: " + event.feature.getProperty("airQuality")
        );
        infowindow.setOptions({
            position:{
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            },
            pixelOffset: {
                width: 0,
                height: -15
            }
        });
        infowindow.open(map);

    });

}


// Make the default weather display
function getWeathers() {
    var requestString = "https://api.openweathermap.org/data/2.5/group?id=2158177,2148876,2155718,2166370,7932638,2165171,2144095,2156878,2174360&units=metric"
        + "&APPID=" + openWeatherMapKey;
    request = new XMLHttpRequest();
    request.onload = processResults;
    request.open("get", requestString, true);
    request.send();
};
// Take the JSON results and process them
var processResults = function() {
   // console.log(this.responseText);
    var results = JSON.parse(this.responseText);
    if (results.list.length > 0) {
        //resetData();
        for (var i = 0; i < results.list.length; i++) {
            geoJSON.features.push(jsonToGeoJson(results.list[i],i));
        }
        drawIcons(geoJSON);
    }
};


// For each result that comes back, convert the data to geoJSON
function jsonToGeoJson(weatherItem, index) {
    //request pollen count
    var pollenLink = pollenRequestBase + accuLocationIDs[index] + '?apikey=' + accuWeatherKey + '&details=true';
    pollenRequest = new XMLHttpRequest();
    pollenRequest.open('get',pollenLink,false);
    pollenRequest.send();
   // console.log(pollenRequest.responseText);
    var res = JSON.parse(pollenRequest.responseText);

    var feature = {
        type: "Feature",
        properties: {
            city: weatherItem.name,
            weather: weatherItem.weather[0].main,
            temperature: weatherItem.main.temp,
            min: weatherItem.main.temp_min,
            max: weatherItem.main.temp_max,
            humidity: weatherItem.main.humidity,
            pressure: weatherItem.main.pressure,
            windSpeed: weatherItem.wind.speed,
            windDegrees: weatherItem.wind.deg,
           // windGust: weatherItem.wind.gust,
            icon: "http://openweathermap.org/img/w/"
            + weatherItem.weather[0].icon  + ".png",
            coordinates: [weatherItem.coord.lon, weatherItem.coord.lat],
            pollenCount: res.DailyForecasts[0].AirAndPollen[1].Value + res.DailyForecasts[0].AirAndPollen[2].Value + res.DailyForecasts[0].AirAndPollen[3].Value + res.DailyForecasts[0].AirAndPollen[4].Value,
            airQuality: res.DailyForecasts[0].AirAndPollen[0].Category
        },
        geometry: {
            type: "Point",
            coordinates: [weatherItem.coord.lon, weatherItem.coord.lat]
        }
    };
    // Set the custom marker icon
    map.data.setStyle(function(feature) {
        return {
            icon: {
                url: feature.getProperty('icon'),
                anchor: new google.maps.Point(25, 25)
            }
        };
    });
    // returns object
    return feature;
};
// Add the markers to the map
function drawIcons(weather) {
    map.data.addGeoJson(geoJSON);
};

// Clear data layer and geoJSON
/*var resetData = function() {
    geoJSON = {
        type: "FeatureCollection",
        features: []
    };
    map.data.forEach(function(feature) {
        map.data.remove(feature);
    });
};*/


function displayHeatMap() {
    var heatData = [
        //CBD
        {location: new google.maps.LatLng(-37.8141,144.9633), weight: 7},
        //Chadstone
        {location: new google.maps.LatLng(-37.8862,145.0830), weight: 5},
        //Craigieburn
        {location: new google.maps.LatLng(-37.599998,144.949997), weight: 18},
        //Preston
        {location: new google.maps.LatLng(-37.75,145.016663), weight: 16},
        //St Albans
        {location: new google.maps.LatLng(-37.744961,144.800491), weight: 15},
        //Hoppers Crossing
        {location: new google.maps.LatLng(-37.882641,144.700302), weight: 16},
        //Wyndham Vale
        {location: new google.maps.LatLng(-37.892799,144.635727), weight: 12},
        //South Morang
        {location: new google.maps.LatLng(-37.6333,145.0833), weight: 10},
        //Sunbury
        {location: new google.maps.LatLng(-37.5811,144.7139), weight: 8},
        //glen waverley
        {location: new google.maps.LatLng(-37.878109,145.164764), weight: 8},
        //Keysborough
        {location: new google.maps.LatLng(-37.991161,145.173843), weight: 10},
        //berwick
        {location: new google.maps.LatLng(-38.033329,145.350006), weight: 8},
        //south yarra
        {location: new google.maps.LatLng(-37.833328,144.983337), weight: 3},
        //reservoir
        {location: new google.maps.LatLng(-37.70462,145.033325), weight: 16},
        //malvern east
        {location: new google.maps.LatLng(-37.87397,145.042526), weight: 4},
        //Sunshine West
        {location: new google.maps.LatLng(-37.795,144.8160), weight: 17},
        //St kilda
        {location: new google.maps.LatLng(-37.860168,144.972198), weight: 8},
        //Dockland
        {location: new google.maps.LatLng(-37.8170,144.9460), weight: 4},
        //Footscray
        {location: new google.maps.LatLng(-37.799999,144.899994), weight: 7},
        //mornington
        {location: new google.maps.LatLng(-38.216671,145.033325), weight: 4},
        //Essendon
        {location: new google.maps.LatLng(-37.7490,144.9120), weight: 2},
        //campbellfield
        {location: new google.maps.LatLng(-37.683331,144.949997), weight: 13},




];

    heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatData,
        radius: 50,
        map: map
    });

}

//google.maps.event.addDomListener(window, 'load', initialize);

//code for forcast/current weather based on postcode

/*var reqLink = function(type, postcode) {
    return "https://api.openweathermap.org/data/2.5/" + type + "?zip=" + postcode + ",au" + "&APPID=" + openWeatherMapKey;
};
var getData = function(link) {
    request = new XMLHttpRequest();
    request.open("get", link, true);
    request.onload = displayData;
    request.send();

};

var displayData = function() {
    var results = JSON.parse(this.responseText);

    var find = document.getElementById('weatherBox');
    find.innerHTML = 'City Name: ' + results.city.name + '</br>'
                + 'condition: ' + results.list[0].weather[0].main;
}*/




