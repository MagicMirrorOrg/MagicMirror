<html>
<head>
	<title>Magic Mirror</title>
	<link rel="stylesheet" type="text/css" href="css/main.css?nocache=<?php echo md5(microtime()) ?>">
	<link rel="stylesheet" type="text/css" href="css/weather-icons.css">
	<script type="text/javascript">
		var gitHash = '<?php echo trim(`git rev-parse HEAD`) ?>';
	</script>
</head>
<body>

	<div class="top left"><div class="date xsmall dimmed"></div><div class="time"></div></div>
	<div class="top right"><div class="forecast xsmall dimmed"></div><div class="temp"></div></div>
	<div class="center-ver center-hor"><div class="compliment"></div></div>
	<div class="bottom center-hor"><div class="news small"></div></div>

</div>

<script src="js/jquery.js"></script>
<script src="js/jquery.feedToJSON.js"></script>
<script src="js/main.js?nocache=<?php echo md5(microtime()) ?>"></script>

</body>
</html>