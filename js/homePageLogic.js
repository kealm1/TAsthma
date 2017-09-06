/*
V2.2
Author: team IRIS
Date: 03/09/17

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
*
* V1.5.1
* -fixed load location
*
* V2.0
* - algorithm finished
* - search bar bug fixed (only return results in VIC)
* - infoWindow auto pop out after searching
* - layout change (customized icon)
*
* V2.1
* -box risk visualisation
*
* v2.2
* -refine the popup window
* -header banner added
*
* -bug fixed
*   -hide scrollbar of box
*
*   v2.1.1
*       -faster loading
*
*   v2.2.2
*      - bugfixed (infoWindow)
*
* */

//reference the customized icon location
var mapMarkers = {
    'LOW': 'https://image.ibb.co/msomxQ/l.png',
    'MEDIUM': 'https://image.ibb.co/mQ1Lrk/m.png',
    'HIGH': 'https://image.ibb.co/mOhRWk/h.png',
    'EXTREME': 'https://image.ibb.co/k6h4HQ/e.png'
};

var geoJSON = {
    type: "FeatureCollection",
    features: []
};

var map; //google map api
var infoWindow; //google infoWindow, popup

var rating; // store a location risk results (rating, desc, colour code)


var openWeatherMapKey = "7814dd27bd44184ffe859c64f61f28e1";
var openWeatherCurByCoordBase="https://api.openweathermap.org/data/2.5/weather?";

//severe weather codes for TA, provided by openWeatherMap
var severeWeatherCode = [200,201,202,210,211,212,221,230,231,232,502,503,504];

//grassland points with radius for algorithm grassland index calculation.
var grasslands = [
    {
        lat: -38.19987,
        lon:145.06141,
        radius: 8.16
    },
    {
        lat:-38.253,
        lon:145.1723,
        radius: 6.14
    },
    {
        lat: -38.06836,
        lon: 145.28577,
        radius: 11.8
    },
    {
        lat: -37.89781,
        lon: 145.07696,
        radius: 6.65
    },
    {
        lat: -37.93378,
        lon: 145.17739,
        radius: 5.06
    },
    {
        lat: -37.90697,
        lon: 144.6725,
        radius: 3.65
    },
];

//bias the search to VIC
var searchBound;

//places service for manual text search
var searchService;

var autoCom; //google autocomplete

var marker; //mark search result

var input; //search bar

var placeSearched; //contains location with valid search

//convert day format
var dayParam = [
    'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'
]
//convertmonth format
var monthParam = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

var pm10Measures;
//store the hourly pm10 measurements


//base function when the page is loaded
function initialize() {
    infoWindow = new google.maps.InfoWindow();

    /*
 * infoWindow customization, referenced from:
 * http://en.marnoto.com/2014/09/5-formas-de-personalizar-infowindow.html
 */
    google.maps.event.addListener(infoWindow, 'domready', function() {

        // Reference to the DIV which receives the contents of the infowindow using jQuery
        var iwOuter = $('.gm-style-iw');

        var iwBackground = iwOuter.prev();

        // Remove the background shadow DIV
        iwBackground.children(':nth-child(2)').css({'display' : 'none'});

        // Remove the white background DIV
        iwBackground.children(':nth-child(4)').css({'display' : 'none'});

// Moves the arrow 70px to the left margin
        iwBackground.children(':nth-child(3)').attr('style', function(i,s){ return s + 'left: 70px !important; bottom: 5px !important;'});

        iwBackground.children(':nth-child(3)').find('div').children().css({'z-index' : '1',
            'border': '5px solid ' + rating.colour});
        iwOuter.css({'max-width': '160px', 'width':'160px', 'border': '5px solid ' + rating.colour});

        var iwCloseBtn = iwOuter.next();

// Reposition the button
        iwCloseBtn.css({
            opacity: '1', // by default the close button has an opacity of 0.7
            right: '20px', top: '20px', // button repositioning
        });
    });

 console.log(pm10Measures);
  //  initialize map
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

    //restrict the search and autocomplete to VIC
    searchBound = new google.maps.LatLngBounds(
        new google.maps.LatLng(-39, 141),
        new google.maps.LatLng(-34,150)
    );
    var option = {
        bounds: searchBound,
        strictBounds: true
    }
    autoCom = new google.maps.places.Autocomplete(input, option);

    searchService = new google.maps.places.PlacesService(map); //init manual search service

    //perform auto search function, results automatically show if choose suggested location, or hit enter to do the search
   autoCom.addListener('place_changed', function() {
        placeSearched = autoCom.getPlace();
        if (!placeSearched || !placeSearched.geometry) {
            manualLookUp();
        } else {
            getCurrentInfo(placeSearched.geometry.location.lat(),placeSearched.geometry.location.lng());
        }
    })


//request data
    $.ajax({
        url: 'scripts/pm10Request.php',
        type: 'GET',
        async: false
    }).done(function(res) {
        pm10Measures =  res;
    }).fail(function() {
        alert('Sorry, the request has failed');
        pm10Measures = '[]';
    });

    displayDefault(); //function to display the default locations when loading the page
    initLocate(); //function to location user current location when loading the page

    //add listener for user to click to view default location info from pop up and info box
    map.data.addListener('click', function(event) {
        displayInfoInBox(event.feature.getProperty("city"), event.feature.getProperty("riskScore"));
        infoWindow.setContent(
            setInfoWindowContent(event.feature.getProperty("city"),
                event.feature.getProperty("temp"),
                event.feature.getProperty("weather"),
                event.feature.getProperty("riskScore"))
        );
        infoWindow.setOptions({
            position:{
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            },
            pixelOffset: {
                width: -13,
                height: -20
            }
        });
        infoWindow.open(map);
    });
}

/*This function rquest default locations weather info and process the results*/
function displayDefault(){
    var requestString = "https://api.openweathermap.org/data/2.5/group?id=2158177,2148876,2155718,2166370,7932638,2165171,2144095,2156878,2174360&units=metric"
        + "&APPID=" + openWeatherMapKey;
    request = new XMLHttpRequest();
    request.onload = processResults;
    request.open("get", requestString, true);
    request.send();
}

/*create map data (geoJSON) based on weather request result*/
function processResults() {
    var results = JSON.parse(this.responseText);
    if (results.list.length > 0) {
        for (var i = 0; i < results.list.length; i++) {
            geoJSON.features.push(convertToGeoJson(results.list[i]));
        }
        map.data.addGeoJson(geoJSON);
    }
}

/*helper function for processing the default locations, this function retrieve weather info, wind, and coords from
* the response, request pm10 values and calculate risk score and pass it to feature object*/
function convertToGeoJson(data) {
    var lat = data.coord.lat;
    var lon = data.coord.lon;
    var pm10Value = getPM10Value(pm10Measures,lat,lon);

    var pm10Index = getPM10Index(pm10Value);
    var windIndex = getWindIndex(data.wind.speed);
    var grasslandIndex = getGrasslandIndex(lat, lon);
    var weatherIndex = getWeatherIndex(data.weather[0].id);

    var score = pm10Index + windIndex + grasslandIndex + weatherIndex;
    var riskRating = getRiskRating(score).rating;
    var feature = {
        type: "Feature",
        properties: {
            city: data.name,
            temp: data.main.temp,
            weather: data.weather[0].main,
            windSpeed: data.wind.speed,
            pm10: pm10Value,
            riskScore: score,
            riskRating: riskRating,
            icon: mapMarkers[riskRating],
            coordinates: [lon, lat]
        },
        geometry: {
            type: "Point",
            coordinates: [lon, lat]
        }
    };
    // Set the custom marker icon
    map.data.setStyle(function(feature) {
        return {
            icon: {
                url: feature.getProperty('icon'),
                anchor: new google.maps.Point(25, 25),
                scaledSize: new google.maps.Size(30,30)
            }
        };
    });
    // returns object
    return feature;
}

//perform places text search to find location
function manualLookUp() {
    var text = input.value;
    if (text == null || text.trim().length == 0) {
        alert('please type in location information (address, postcode, etc.')
    } else {
        var req = {
            bounds: searchBound,
            query: text
        }
        searchService.textSearch(req, callback);
    }
}

//process text search result
function callback(results,status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        var priRes = results[0];
        var lat = priRes.geometry.location.lat();
        var lon = priRes.geometry.location.lng();
        if (getDistance(-37.8141,144.9633,lat,lon) > 300) { //results not in melb region
            alert('No place found in VIC area');
            return;
        }
        getCurrentInfo(priRes.geometry.location.lat(), priRes.geometry.location.lng());
    } else {
        alert('cannot find place you are searching');
    }
}


/*function to place markers, and display risk info in popup and info box*/
function getCurrentInfo(lat, lon) {
    var req = createWeatherReq(lat, lon);
    req.onload = function() {
        if (marker != undefined) {
        marker.setMap(null);}
        var res = JSON.parse(this.responseText);

        map.setCenter(new google.maps.LatLng(lat, lon));

        marker = new google.maps.Marker({
            position: {
                lat: lat,
                lng: lon
            },
            map: map
        });
        var pm10Value = getPM10Value(pm10Measures,lat,lon);

        var windIndex = getWindIndex(res.wind.speed);
        var weatherIndex = getWeatherIndex(res.weather[0].id);
        var pm10Index = getPM10Index(pm10Value);
        var grassLandIndex = getGrasslandIndex(lat,lon)
        var riskScore = windIndex + weatherIndex + pm10Index + grassLandIndex;

        markerInfoWindow(res.name, res.main.temp, res.weather[0].main, riskScore);

        marker.addListener('click', function() {
            markerInfoWindow(res.name, res.main.temp, res.weather[0].main, riskScore);
        });
    };
    req.send();
}

function markerInfoWindow(name,temp,weather,score) {
    displayInfoInBox(name, score);
    infoWindow.setContent(
        setInfoWindowContent(name, temp, weather, score)
    );
    infoWindow.setOptions({
        pixelOffset: {
            width: 0,
            height: 0
        }
    });
    infoWindow.open(map,marker);
    map.setZoom(13);
}

/*new Async OpenWeatherMap request based on coordinates*/
function createWeatherReq(lat, lon) {
    var link = openWeatherCurByCoordBase + 'lat=' + lat + '&lon=' + lon + '&APPID=' + openWeatherMapKey + "&units=metric";
    var newRequest = new XMLHttpRequest();
    newRequest.open('get',link,true);
    return newRequest;
}

//find users current location
function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            getCurrentInfo(position.coords.latitude, position.coords.longitude);
        }, function() {
            alert('Sorry, the service has failed.');
            var ele = document.getElementById('infoBox');
        });
    } else {
        alert('Sorry, your browser doesn\'t support this function');
    }
}

//init function to locate user when loading the page
function initLocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            indexSum(lat,lon);
        }, function() {
            alert('Sorry, cannot find your current location');
            indexSum(-37.8141,144.9633);
            //locating unavailable, using CBD
        });
    } else {
        alert('Sorry, your browser doesn\'t support this function');
        indexSum(-37.8141,144.9633);
        //locating unavailable, using CBD
    }
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

//helper math function
function degToRad(deg) {
    return deg * (Math.PI/180);
}


//calculate risk score and display risk info in box for a given location (using coords)
 function indexSum(lat, lon) {
     var req = createWeatherReq(lat,lon);
     req.onload = function() {
         var res = JSON.parse(req.responseText);

         var name = res.name;

         var windIndex = getWindIndex(res.wind.speed);
         var weatherIndex = getWeatherIndex(res.weather[0].id);
         var pm10Index = getPM10Index(getPM10Value(pm10Measures,lat,lon));
         var grasslandIndex = getGrasslandIndex(lat,lon);

         var score = windIndex + weatherIndex + pm10Index + grasslandIndex;

         displayInfoInBox(name, score);

     }
     req.send()
 }

 //index for wind factors
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
         return 0;
     }
}

//index for weather factor
function getWeatherIndex(code) {
     if ($.inArray(code,severeWeatherCode) != -1) {
         return 1;
     } else {
         return 0;
     }
}

/*pm10 measures based on distance between location and sites
* assumption:
*   -nearest site measurement is the location pm10 level*/
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

//index for pm10 factor
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

/*/!*ajax call to a php script to request data from EPA API
* NOTE: current logic cannot do the async request, THIS NEEDED TO BE FIXED*!/
function getPM10Measure() {
    $.ajax({
        url: 'scripts/pm10Request.php',
        type: 'GET',
        async: false
    }).done(function(res) {
       pm10Mesures =  res;
    }).fail(function() {
        alert('Sorry, the request has failed');
        pm10Mesures = '[]';
    });
}*/

//get the risk info (rating, one sentence desc, and colour code.
function getRiskRating(score) {
    var res = {};
    if (score >= 9) {
        res['rating'] = 'EXTREME';
        res ['desc'] = 'You need to prepare for a potential Thunderstorm Asthma outbreak.';
        res ['colour'] = '#ff0000';
    } else if (score >= 6 && score < 9) {
        res['rating'] = 'HIGH';
        res ['desc'] = 'You can chill at home.';
        res['colour'] = '#ff9900'
    } else if (score >= 4 && score < 6) {
        res['rating'] = 'MEDIUM';
        res ['desc'] = 'You can go outside but remember to take your pills.';
        res['colour'] = '#ffff33'
    } else if (score >= 0 && score < 4) {
        res['rating'] = 'LOW';
        res ['desc'] = 'You can go outside to get your tan.';
        res['colour'] = '#00ff33'
    } else {
        res['rating'] = 'Error';
        res ['desc'] = 'oops, nothing to show';
        res['colour'] = '#ff0000'
    }
    return res;
}

/*
* index for grassland factor
* assumption:
*   -within a grassland radius will be considered as high risk, score 1 */
function getGrasslandIndex(lat,lon) {
    var index = 0;
    for (var i = 0; i < grasslands.length; i++) {
        var land = grasslands[i];
        var distance = getDistance(lat,lon, land.lat, land.lon);
        if (distance <= land.radius) {
            index++;
        }
    }
    return index;
}

//display the infomation to the side box dynamically
function displayInfoInBox(name,score) {

    var rating = getRiskRating(score);
    var newDate = new Date();
    var day = dayParam[newDate.getDay()];
    var date = newDate.getDate();
    var month = monthParam[newDate.getMonth()];
    var dateString = day + ', ' + date + ' ' + month;

     var box = document.getElementById('infoBox');
    box.style.backgroundColor = rating.colour;
    document.getElementById('dateDiv').innerText = dateString;
    document.getElementById('regionDiv').innerText = name + ', VIC';
    document.getElementById('riskRate').innerText = rating.rating;
    document.getElementById('descDiv').innerText = rating.desc;
    box.style.visibility = 'visible';
}

//set the content in info window
function setInfoWindowContent(city, degree, condition, score) {
    rating = getRiskRating(score);
    var content = "<div id='windowContainer'>" +
                            "<br /><strong>" + city + "</strong>" +
                            "<br />" + degree + "&deg;C" +
                            "<br/>" + condition +
                            "<br />" + "Risk Level:" + "<strong>" + rating.rating + "</strong>"
                    "</div>";
     return content;
}



