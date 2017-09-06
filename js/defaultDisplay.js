/*
V1.3
Author: team IRIS
Date: 27/08/17

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
* -add places service to allow user do manual search (input text then search instead of select suggested location first
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


var autoCom; //help search
var marker; //mark search result
var placeService; //google places services
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

    //add places services for manual look up location
    placeService = new google.maps.places.PlacesService(map);

    //configure search bar
    input = document.getElementById('search');

    autoCom = new google.maps.places.Autocomplete(input);
    autoCom.setComponentRestrictions({country: 'au'});

   /* autoCom.addListener('place_changed', function() {
        placeSearched = autoCom.getPlace();
        if (!placeSearched) {
            alert('Please select a suggested address');
        } else if (!placeSearched.geometry) {
            placeSearched = manualLookUp();
        } else {
            getCurrentWeather(placeSearched.geometry.location.lat(),placeSearched.geometry.location.lng());
        }
    })*/
    displayHeatMap();

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

function searchLocation() {
    var place = autoCom.getPlace();
    if (!place || !place.geometry) {
        alert('Please select a suggested address')
    } else {
        getCurrentWeather(place.geometry.location.lat(), place.geometry.location.lng());
    }
}
//dup
function manualLookUp() {
    var text = input.val();
    var placeToLook = {
        query: text
    };
    placeService.textSearch(placeToLook, function() {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            var firstR = res[0]; //get first result from the list
            var detailsReq = {
                reference: firstR.reference
            };
            placeService.getDetails(detailsReq, function() {
                if (status == google.maps.places.PlacesServiceStatus.OK) {
                     placeSearched = firstR;
                     getCurrentWeather(placeSearched.geometry.location.lat(),placeSearched.geometry.location.lng());
                } else {
                    alert('something has gone wrong');
                }
            });
        } else {
            alert ('cannot process request');
        }
    });
}

//request current weather info
function getCurrentWeather(lat, lon) {
    var link = openWeatherCurByCoordBase + 'lat=' + lat + '&lon=' + lon + '&APPID=' + openWeatherMapKey + "&units=metric";
    var newRequest = new XMLHttpRequest();
    newRequest.open('get',link,true);
    newRequest.send();

    newRequest.onload = function() {
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
        marker.addListener('click', function() {
            infoWindow.setContent(
                /*"<img src=" + "https://openweathermap.org/img/w/"
                + res.weather[0].icon  + ".png", + ">"*/
                "<br /><strong>" + res.name + "</strong>"
                + "<br />" + res.main.temp + "&deg;C"
                + "<br />" + res.weather[0].main
                + "<br />" + res.wind.speed + 'km/h'
                + "<br />" + res.main.humidity + '%'
            );
            infoWindow.open(map,marker);
        });
    };
}

function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            getCurrentWeather(position.coords.latitude, position.coords.longitude);
        }, function() {
            alert('Sorry, the service has failed.')
        });
    } else {
        alert('Sorry, your browser doesn\'t support this function');
    }
}

/*function validateSearch() {
    var text = input.val();
    if (text.trim() == '' || text == null) {
        alert('please type in information (location, address, postcode, etc.)');
        return false;
    } else if (placeSearched && text == typedInPat) {
        getCurrentWeather(placeSearched.geometry.location.lat(), placeSearched.geometry.location.lng());
        placeSearched = null;
        typedInPat = '';
        input.val('');
        return false;
    } else {
        var placeToLook = {
            query: text
        };
        placeService.textSearch(placeToLook, function() {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var firstR = res[0]; //get first result from the list
                var detailsReq = {
                    reference: firstR.reference
                };
                placeService.getDetails(detailsReq, function() {
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        placeSearched = firstR;
                        typedInPat = input.val();
                        document.getElementById('searchForm').submit();
                    } else {
                        alert('something has gone wrong');
                    }
                });
            } else {
                alert ('cannot process request');
            }
        });
        return false;
    }
}*/







