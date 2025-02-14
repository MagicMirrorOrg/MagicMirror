function initMap(mapElement, location) {
    const map = new google.maps.Map(mapElement, {
        zoom: location.zoom,
        center: { lat: location.latitude, lng: location.longitude },
        mapTypeId: 'roadmap',
        streetViewControl: false,
        navigationControl: false,
        mapTypeControl: false,
        scaleControl: false,
        zoomControl: false,
        draggable: false,
        scrollwheel: false,
        styles: location.styles
    });

    if (location.showTraffic) {
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
    }
}

function waitForElement(selector) {
    return new Promise(resolve => {
		if (document.querySelector(selector)) {
		    return resolve(document.querySelector(selector));
		}

		const observer = new MutationObserver(mutations => {
		    if (document.querySelector(selector)) {
		        observer.disconnect();
		        resolve(document.querySelector(selector));
		    }
		});

		// If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
		observer.observe(document.body, {
		    childList: true,
		    subtree: true
		});
    });
}

function initMapRoutine() {
    const trafficStyles = [
        {
            featureType: "landscape.man_made",
            elementType: "geometry",
            stylers: [{ color: "#f0f0f0" }],
        },
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
        {
            featureType: "water",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
    ]

    const foodStyles = [
        {
            featureType: "landscape.man_made",
            elementType: "geometry",
            stylers: [{ color: "#f0f0f0" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
        {
            featureType: "water",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
        },
    ]
    
    const brussels = {
        latitude: 50.8477,
        longitude: 4.3572,
        zoom: 11,
        styles: trafficStyles,
        showTraffic: true
    };

    const charleroi = {
        latitude: 50.4081,
        longitude: 4.4476,
        zoom: 11,
        styles: trafficStyles,
        showTraffic: true
    };

    const liege = {
        latitude: 50.6402,
        longitude: 5.5689,
        zoom: 12,
        styles: trafficStyles,
        showTraffic: true
    };

    const belgium = {
        latitude: 50.5039,
        longitude: 4.4699,
        zoom: 8,
        styles: trafficStyles,
        showTraffic: true

    };

    const ayes = {
        latitude: 50.82909981139743,
        longitude: 4.36146805513083,
        zoom: 15,
        styles: foodStyles,
        showTraffic: false
    };

    const commonLocations = [ brussels, charleroi, liege, belgium ];
    const midDayLocations = [ brussels, charleroi, liege, belgium, ayes ];

    var startDate = new Date();
    startDate.setHours(11);
    startDate.setMinutes(30);
    
    var endDate = new Date();
    endDate.setHours(12);
    endDate.setMinutes(15);

    waitForElement('#map').then((mapElement) => {
		initMap(mapElement, commonLocations[0]);

		var i = 0;

		window.setInterval(function() {
		    const currentDate = new Date();

		    if (startDate < currentDate && endDate > currentDate) {
		        i = (i + 1) % midDayLocations.length;
		        initMap(mapElement, midDayLocations[i]);
		    } else {
		        i = (i + 1) % commonLocations.length;
		        initMap(mapElement, commonLocations[i]);
		    }
		}, 10000);
	});
}

Module.register("streetmap", {
	defaults: { },
  
	start: function() {
		this.sendNotification("SHOW_ALERT", {
		    type: "notification",
		    title: "Street Map!",
		    message: "Module is loaded!"
		});

		initMapRoutine();
	},
  
	getStyles() {
		return ["streetmap.css"];
	},

	getScripts() {
		return [];
	},

	getTemplate() {
		return "streetmap.html";
	}
});