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
</head>
<body>

	<div class="top left"><div class="date small dimmed"></div><div class="time"></div><div class="calendar xsmall"></div></div>
	<div class="top right"><div class="sun small dimmed"></div><div class="temp"></div><div class="forecast small dimmed"></div></div>
	<div class="lower-third center-hor"><div class="compliment light"></div></div>
	<div class="bottom center-hor"><div class="news medium"></div></div>

</div>

<script src="js/jquery.js"></script>
<script src="js/jquery.feedToJSON.js"></script>
<script src="js/ical_parser.js"></script>
<script src="js/moment-with-langs.min.js"></script>
<script src="js/main.js?nocache=<?php echo md5(microtime()) ?>"></script>

</body>
</html>