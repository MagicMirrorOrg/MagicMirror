<html>
<head>
	<title>Magic Mirror</title>
	<style type="text/css">
		<?php include('css/main.css') ?>
	</style>
	<link rel="stylesheet" type="text/css" href="css/weather-icons.css">
	<script type="text/javascript">
		var gitHash = '<?php echo trim(`git rev-parse HEAD`) ?>';
	</script>
	<meta name="google" value="notranslate" />
	<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
</head>
<body>
	<!--<canvas id="canvas"></canvas>   <!--//Temporarily removed until the Pi graphics driver improves-->
	<div class="top left"><div class="date small dimmed"></div><div class="time light"></div><div class="traffic xsmall dimmed"></div><div class="calendar"></div></div>
	<div class="top right"><div class="windsun small dimmed"></div><div class="temp light"></div><div class="feelsliketemp"></div><div class="forecast small dimmed"></div></div>
	<div class="center-ver center-hor"></div>
	<div class="lower-third center-hor"><div class="compliment light"></div></div>
	<div class="bottom center-hor"><div class="news medium"></div></div>

</div>

<script src="js/jquery.js"></script>
<script src="js/jquery.feedToJSON.js"></script>
<script src="js/ical_parser.js"></script>
<script src="js/moment-with-locales.min.js"></script>
<script src="js/config.js"></script>
<script src="js/keys.js"></script>
<script src="js/rrule.js"></script>
<script src="http://maps.google.com/maps/api/js" type="text/javascript"></script>
<script src="js/version/version.js" type="text/javascript"></script>
<script src="js/calendar/calendar.js" type="text/javascript"></script>
<script src="js/compliments/compliments.js" type="text/javascript"></script>
<script src="js/weather/weather.js" type="text/javascript"></script>
<script src="js/time/time.js" type="text/javascript"></script>
<script src="js/traffic/traffic.js" type="text/javascript"></script>
<script src="js/news/news.js" type="text/javascript"></script>
<script src="js/main.js?nocache=<?php echo md5(microtime()) ?>"></script>

</body>
</html>
