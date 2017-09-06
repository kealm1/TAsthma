/*
V1.0

display the heat map logic
 */

var heatMap;
var heatmap;

function init() {
    var mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(-37.8141,144.9633),
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: false

    };
    heatMap = new google.maps.Map(document.getElementById('heat'),
        mapOptions);

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
        map: heatMap
    });
}