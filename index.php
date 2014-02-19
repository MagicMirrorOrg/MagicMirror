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

	<div class="TopLeft time"></div>
	<div class="TopRight temp"></div>
	<div class="Center compliment"></div>
	<div class="Bottom">

</div>

<script src="js/jquery.js"></script>
<script src="js/jquery.feedToJSON.js"></script>
<script src="js/main.js?nocache=<?php echo md5(microtime()) ?>"></script>

</body>
</html>