/*
V1.5
Author: team IRIS
Date: 30/08/17

V1.1
* Add if condition to prevent accuweather api ran out of call and destroy all weather info display
* update if into try catch to handle exception
*
* V1.2 updates
* adding google auto complete
*
* V1.3
* -removed accuweather API (pollen count is always zero, useless)
* -add search bar to search location
*   integrate google auto complete to search bar (search constrain to au only)
*   display current weather fo searched location
* add locate me function using browser's geolocation
*
* V1.4
* -bug fixed for search bar
* -user can both hit enter or click button to do the search
* -add places service to allow user do manual search (input text then search instead of select suggested location first
* -basic score calculation based on weather and wind
*
* V1.5
* -add pm10 factors to alg
* */
var map;
var infoWindow;
var geoJSON = {
    type: "FeatureCollection",
        features: []
};
var request;
var openWeatherMapKey = "7814dd27bd44184ffe859c64f61f28e1";
var openWeatherCurByCoordBase="https://api.openweathermap.org/data/2.5/weather?";

var severeWeatherCode = [200,201,202,210,211,212,221,230,231,232,502,503,504];


var searchService;
var placeLimit = '&location=-37.8136,144.9631&radius=100000'; //bias the place search to melbourne region
var autoCom; //help search
var marker; //mark search result
var input; //search bar
var placeSearched; //contains location with valid search
//var typedInPat; //text place searc


//base function when the page is loaded
function initialize() {
    infoWindow = new google.maps.InfoWindow();
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(-37.8141,144.9633),
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false
    };
    map = new google.maps.Map(document.getElementById('mapDemo'),
        mapOptions);

    //configure search bar
    input = document.getElementById('search');

    autoCom = new google.maps.places.Autocomplete(input);
    autoCom.setComponentRestrictions({country: 'au'});

    searchService = new google.maps.places.PlacesService(map);
   autoCom.addListener('place_changed', function() {
        placeSearched = autoCom.getPlace();
        if (!placeSearched || !placeSearched.geometry) {
            manualLookUp();
        } else {
            getCurrentWeather(placeSearched.geometry.location.lat(),placeSearched.geometry.location.lng());
        }
    })
    //displayHeatMap();

    getWeathers();

    map.data.addListener('click', function(event) {
        infoWindow.setContent(
           // "<img src=" + event.feature.getProperty("icon") + ">" +
            "<br /><strong>" + event.feature.getProperty("city") + "</strong>"
            + "<br />" + event.feature.getProperty("temperature") + "&deg;C"
            + "<br />" + event.feature.getProperty("weather")
            + "<br />Pollen count: Not yet available"
            + "<br />Air quality: Not yet available"
        );
        infoWindow.setOptions({
            position:{
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            },
            pixelOffset: {
                width: 0,
                height: -15
            }
        });
        infoWindow.open(map);

    });

    initLocate();

    //getPM10Measures();

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
            geoJSON.features.push(jsonToGeoJson(results.list[i]));
        }
        drawIcons(geoJSON);
    }
};


// For each result that comes back, convert the data to geoJSON
function jsonToGeoJson(weatherItem) {

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
            icon: "https://openweathermap.org/img/w/"
            + weatherItem.weather[0].icon  + ".png",
            coordinates: [weatherItem.coord.lon, weatherItem.coord.lat]
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

/*function searchLocation() {
    var place = autoCom.getPlace();
    if (!place || !place.geometry) {
        alert('Please select a suggested address')
    } else {
        getCurrentWeather(place.geometry.location.lat(), place.geometry.location.lng());
    }
}*/
//dup
function manualLookUp() {
    var text = input.value;
    if (text == null || text.trim().length == 0) {
        alert('please type in location information (address, postcode, etc.')
    } else {
        var req = {
            location: new google.maps.LatLng(-37.8136,144.9631),
            radius:100000,
            query: text
        }
        searchService.textSearch(req, callback);
    }
}

function callback(results,status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        var priRes = results[0];
        getCurrentWeather(priRes.geometry.location.lat(), priRes.geometry.location.lng());
    } else {
        alert('cannot find place you are searching');
    }
}


//request current weather info
function getCurrentWeather(lat, lon) {
    var req = createWeatherReq(lat, lon);
    req.onload = function() {
        if (marker != undefined) {
        marker.setMap(null);
        }
        var res = JSON.parse(this.responseText);

        map.setCenter(new google.maps.LatLng(lat, lon));

        marker = new google.maps.Marker({
            position: {
                lat: lat,
                lng: lon
            },
            map: map
        });
        var pm10Value = getPM10Measure(lat,lon);
        var riskScore =  getWeatherIndex(res.weather[0].id) + getWindIndex(res.wind.speed) + getPM10Index(pm10Value);

        marker.addListener('click', function() {
            infoWindow.setContent(
                /*"<img src=" + "https://openweathermap.org/img/w/"
                + res.weather[0].icon  + ".png", + ">"*/
                "<br /><strong>" + res.name + "</strong>"
                + "<br />" + res.main.temp + "&deg;C"
                + "<br />" + res.weather[0].main
                + "<br />" + res.wind.speed + ' km/h'
                + "<br />" + res.main.humidity + '%'
                + "<br />" + 'pm10: ' + pm10Value
                + "<br />" + 'risk score: ' + riskScore
            );
            infoWindow.open(map,marker);
        });
    };
    req.send();
}

function createWeatherReq(lat, lon) {
    var link = openWeatherCurByCoordBase + 'lat=' + lat + '&lon=' + lon + '&APPID=' + openWeatherMapKey + "&units=metric";
    var newRequest = new XMLHttpRequest();
    newRequest.open('get',link,true);
    return newRequest;
}

function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            getCurrentWeather(position.coords.latitude, position.coords.longitude);
        }, function() {
            alert('Sorry, the service has failed.');
            var ele = document.getElementById('infoBox');
        });
    } else {
        alert('Sorry, your browser doesn\'t support this function');
    }
}

function initLocate() {
    var ele = document.getElementById('infoBox');
    var score = getWindSpeedAndWeatherSum(-37.8141,144.9633);
    //locating unavailable, using CBD
    var text = document.createTextNode('the risk score for Melbourne CBD is ' + score);
    ele.appendChild(text);
    /*var link = 'https://cors-anywhere.herokuapp.com/http://sciwebsvc.epa.vic.gov.au/aqapi/Sites?monitoringPurpose=1010&format=json&fromDate=20100101&toDate=20170808';
    var request = new XMLHttpRequest();

    request.open('get',link, false);
    request.send();
    var text = document.createTextNode(request.responseText);
    ele.appendChild(text);*/


   /* var ele = document.getElementById('infoBox');
    var text;
    var score;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            score = getWindSpeedAndWeatherSum(position.coords.latitude, position.coords.longitude);
           text = document.createTextNode('the score for your area is ' + score);
        }, function() {
            alert('Sorry, cannot find your current location');
            score = getWindSpeedAndWeatherSum(-37.8141,144.9633);
            //locating unavailable, using CBD
           text = document.createTextNode('the risk score for Melbourne CBD is ' + score);
        });
    } else {
        alert('Sorry, your browser doesn\'t support this function');
        score = getWindSpeedAndWeatherSum(-37.8141,144.9633);
        //locating unavailable, using CBD
       text = document.createTextNode('the risk score for Melbourne CBD is ' + score);
    }

    ele.appendChild(text);*/
}


/*
Algorithm implementation methods
 */

//helper function to calculate the distance,
// source from: https://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
function getDistance(orLat, orLon, deLat, deLon) {
    var radius = 6371;
    var dLat = degToRad(deLat - orLat);
    var dLon = degToRad(deLon - orLon);

    var a =Math.pow(Math.sin(dLat/2),2)
        + Math.cos(degToRad(orLat)) * Math.cos(degToRad(deLat)) *
        Math.pow(Math.sin(dLon/2),2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return radius * c;
}

function degToRad(deg) {
    return deg * (Math.PI/180);
}


////sections to calculate score on wind and weather condition
 function getWindSpeedAndWeatherSum(lat, lon) {
     var req = createWeatherReq();
     req.onload = function() {
         var res = JSON.parse(req.responseText);

         var windIndex = getWindIndex(res.wind.speed);
         var weatherIndex = getWeatherIndex(res.weather[0].id);

        return windIndex + weatherIndex;

     }
 }

function getWindIndex(windSpeed) {
     if (windSpeed >= 90) {
         return 4;
     } else if (windSpeed >= 65 && windSpeed < 90) {
         return 3;
     } else if (windSpeed >= 45 && windSpeed < 65) {
         return 2;
     } else if (windSpeed >0 && windSpeed < 45) {
         return 1;
     } else {
         return -1;
     }
}

function getWeatherIndex(code) {
     if ($.inArray(code,severeWeatherCode) != -1) {
         return 1;
     } else {
         return 0;
     }
}

/////pm10 measures based on distance between location and sites, chose the shortest
function getPM10Value(res,lat, lon) {
    var shortest = 100000;
    var value = 0;
    if (res == '[]') {
        return -1;
    } else {
        var data = JSON.parse(res);
        for (var i = 0; i < data.length; i ++) {
            var site = data[i];
            var distance = getDistance(site.lat, site.lon, lat, lon);
            if (distance <= shortest) {
                value = site.value;
                shortest = distance;
            }
        }
        return value;
    }
}

function getPM10Index(value) {
    if (value >= 75) { //extremely high
        return 4;
    } else if (value >= 50 && value < 75) { //high
        return 3;
    }else if (value >=33 && value < 50) { //medium
        return 2;
    } else if (value >=0 && value < 33) { //low
        return 1;
    } else {
        return 0;
    }
}

function getPM10Measure(lat,lon) {
    var value;
    $.ajax({
        url: 'scripts/pm10Request.php',
        type: 'GET',
        async: false
    }).done(function(res) {
        value = getPM10Value(res,lat,lon);
    }).fail(function() {
        alert('Sorry, the request has failed');
        value = -1;

    });
    return value;
}



