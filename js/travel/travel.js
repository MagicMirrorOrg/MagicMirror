var travel = {
    origin: config.travel.params.origin || 'Arnold, MD',
    destinations: {},
    fadeInterval: config.travel.params.fadeInterval || 1000
}

// Get Travel Time by adding up duration of all legs
travel.getTravelTime = function (directionResult) {
    var legs = directionResult.routes[0].legs;
    var totalTimeInSeconds = 0;
    for (var i = 0; i < legs.length; i++) {
        totalTimeInSeconds = totalTimeInSeconds + legs[i].duration.value;
    }
    return moment.duration(totalTimeInSeconds, "seconds").humanize();
}

travel.createTravelTimesTable = function() {
    var _opacity = 1;
    console.log("updating travel table");
    console.dir(travel.destinations);
    tableHtml = '<table class="travel-table">';
    for (var key in travel.destinations) {
        if (!travel.destinations.hasOwnProperty(key)) {
            continue;
        }
        if (travel.destinations[key]) {
            tableHtml = tableHtml + '<tr style="opacity:' + _opacity + '">';
            tableHtml = tableHtml + '<td>' + key + ':</td>';
            tableHtml = tableHtml + '<td>' + travel.destinations[key] + '</td>';
            tableHtml = tableHtml + '</tr>';
            _opacity -= 0.155;
        }
    }
    tableHtml = tableHtml + '</table>';
    $('.travel').updateWithText(tableHtml, this.fadeInterval);
}

travel.init = function () {
    this.createTravelTimesTable(travel.destinations);
    // Initialize the travel.destinations associative array to have undefined travel times
    for (var i = 0; i < config.travel.params.destinations.length; i++) {
        travel.destinations[config.travel.params.destinations[i]] = undefined;
    }
    console.log(travel.destinations);
    $.getScript('https://maps.googleapis.com/maps/api/js?key=' + config.travel.api.key, getTravelTimes);
}

function getTravelTimes() {
    // createTravelTimesTable(travel.destinations);
    var directionsService = new google.maps.DirectionsService;
    for (var key in travel.destinations) {
        if (!travel.destinations.hasOwnProperty(key)) {
            continue;
        }
        console.log("setting up request for " + key);
        directionsService.route({
            origin: travel.origin,
            destination: key,
            travelMode: google.maps.TravelMode.DRIVING
        }, function(response, status) {
            dest = response.request.destination;
            console.log("in callback for " + dest);
            console.dir(response);
            if (status === google.maps.DirectionsStatus.OK) {
                travel.destinations[dest] = travel.getTravelTime(response);
                travel.createTravelTimesTable();
            }
        });
    }
}
