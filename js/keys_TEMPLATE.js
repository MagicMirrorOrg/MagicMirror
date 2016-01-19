var keys = {
    weather: {
        //change weather params here:
        //units: metric or imperial
        params: {
            id: 'YOUR_CITY_ID',
            units: 'imperial',
            // if you want a different lang for the weather that what is set above, change it here
            lang: 'en',
            APPID: 'YOUR_OPENWEATHER_API_KEY'
        }
    },
	traffic: {
		params: {
			origin: 'place_id:YOUR_STARTING_PLACE_ID',
			destination: 'place_id:YOUR_ENDING_PLACE_ID',
			departure_time: 'now',
			key: 'YOUR_GOOGLE_MAPS_API_KEY'
		}
	},
	calendar: {
        maximumEntries: 10,
        url: "CALENDAR.ics ADDRESS"
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
