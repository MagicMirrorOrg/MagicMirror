<?php

// set HTTP header
$headers = array(
    'Content-Type: application/json',
);

if (isset($_GET['key'])) {
    $key = $_GET['key'];
}
if (isset($_GET['origin'])) {
    $origin = $_GET['origin'];
}
if (isset($_GET['destination'])) {
    $destination = $_GET['destination'];
}
if (isset($_GET['departure_time'])) {
    $departure_time = $_GET['departure_time'];
}
if (isset($_GET['arrivel_time'])) {
    $departure_time = $_GET['arrival_time'];
}

// query string
$fields = array(
    'key' => $key,
    'origin' => $origin,
	'destination' => $destination,
	'departure_time' => $departure_time
);

$url = 'https://maps.googleapis.com/maps/api/directions/json?' . http_build_query($fields);

// Open connection
$ch = curl_init();

// Set the url, number of GET vars, GET data
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true );

curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Execute request
$result = curl_exec($ch);

// Close connection
curl_close($ch);

// get the result and parse to JSON
$result_arr = json_decode($result, true);

echo($result);
/*
 *  output:
 *  Array
 *  (
 *      [statusCode] => "OK",
 *      [statusMessage] => "",
 *      [ipAddress] => "123.13.123.12",
 *      [countryCode] => "MY",
 *      [countryName] => "MALAYSIA",
 *  )
 */
 ?>