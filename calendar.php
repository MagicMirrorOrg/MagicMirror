<?php
	
	// Set the url of the calendar feed.
	$url = 'https://p01-calendarws.icloud.com/ca/subscribe/1/n6x7Farxpt7m9S8bHg1TGArSj7J6kanm_2KEoJPL5YIAk3y70FpRo4GyWwO-6QfHSY5mXtHcRGVxYZUf7U3HPDOTG5x0qYnno1Zr_VuKH2M';

	// Initialize the curl request.
	$ch = curl_init();

	// Set the CURL url.
	curl_setopt ($ch, CURLOPT_URL, $url);

	// Make sure redirects are followed.
	curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, true);

	// Decode the response. Apple seems to use a encoded feed since the end of November 2014.
	curl_setopt ($ch, CURLOPT_ENCODING, true);

	// Execute the request and echo the response.
	echo curl_exec($ch);

	// Close the CURL request.
	curl_close($ch);
