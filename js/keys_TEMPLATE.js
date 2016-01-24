//rename this file to keys.js after you fill in the relevant information to enable functionality

var keys = {
    weather: {
        //change weather params here:
        //units: metric or imperial
        params: {
            id: 'YOUR_CITY_ID',
            // Search for your city at http://openweathermap.org/find, and the City ID is the number at the end of the URL you're directed to
            units: 'imperial',
            // if you want a different lang for the weather that what is set above, change it here
            lang: 'en',
            APPID: 'YOUR_OPENWEATHER_API_KEY'
            // To get your OpenWeather API key, go to http://www.openweathermap.org/news/post/get-api-key-access-weather-api/
        }
    },
	traffic: {
		params: {
			origin: 'place_id:YOUR_STARTING_PLACE_ID',
			destination: 'place_id:YOUR_ENDING_PLACE_ID',
            // Use the PlaceID Finder: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
			departure_time: 'now',
			key: 'YOUR_GOOGLE_MAPS_API_KEY'
            // Go here to get your Google Maps API key: https://developers.google.com/maps/documentation/directions/
		}
	},
	calendar: {
        maximumEntries: 10,
        url: "CALENDAR.ics ADDRESS"
        // For Google Calendar, it's the 'Private Address' under Calendar Settings when viewing your Calendar
    },
	birthdays: [
		{
			day:DAY_OF_FIRST_BIRTHDAY,
			month:MONTH_OF_FIRST_BIRTHDAY,
			name:'NAME_OF_PERSON_WITH_FIRST_BIRTHDAY'
		},{
			day:DAY_OF_SECOND_BIRTHDAY,
			month:MONTH_OF_SECOND_BIRTHDAY,
			name:'NAME_OF_PERSON_WITH_SECOND_BIRTHDAY'
		}
	]
}
