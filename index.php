<html>
<head>
	<?php include('controllers/modules.php');?>
	<title>Magic Mirror</title>
	<style type="text/css">
		<?php include('css/main.css') ?>
	</style>
	<link rel="stylesheet" type="text/css" href="css/weather-icons.css">
	<link rel="stylesheet" type="text/css" href="css/font-awesome.css">
<?php 
	$elements = '';
	foreach($all_modules as $name => $module_data) {
		foreach($module_data as $data) {
			$print = true;
			switch ($data['type']) {
				case 'js':
					$node_template = '<script src="%s" type="text/javascript"></script>';
					break;
				case 'css':
					$node_template = '<link rel="stylesheet" type="text/css" href="%s">';
					break;
				case 'elements':
					$elements .= sprintf('<div id="%s">%s</div>', $name, $data['data']);
					$print = false;
					break;
				default:
					$node_template = '<!-- %s -->';
					break;
			}
			if ($print) {
				printf("\t".$node_template."\n", $data['url']);
			}
		}
	} ?>
	<script type="text/javascript">
		var gitHash = '<?php echo trim(`git rev-parse HEAD`) ?>';
	</script>
	<meta name="google" value="notranslate" />
	<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
</head>
<body>

	<div class="top right"><div class="windsun small dimmed"></div><div class="temp"></div><div class="forecast small dimmed"></div></div>
	<div class="top left"><div class="date small dimmed"></div><div class="time" id="time"></div><div class="calendar xxsmall"></div></div>
	<div class="center-ver center-hor"><!-- <div class="dishwasher light">Vaatwasser is klaar!</div> --></div>
	<div class="lower-third center-hor"><div class="compliment light"></div></div>
	<div class="bottom center-hor"><div class="news medium"></div></div>
	<?php echo $elements; ?>

<script src="js/jquery.js"></script>
<script src="js/jquery.feedToJSON.js"></script>
<script src="js/ical_parser.js"></script>
<script src="js/moment-with-locales.min.js"></script>
<script src="js/config.js"></script>
<script src="js/rrule.js"></script>
<script src="js/version/version.js"></script>
<script src="js/calendar/calendar.js"></script>
<script src="js/compliments/compliments.js"></script>
<script src="js/weather/weather.js"></script>
<script src="js/time/time.js"></script>
<script src="js/news/news.js"></script>
<script src="js/main.js?nocache=<?php echo md5(microtime()) ?>"></script>
<!-- <script src="js/socket.io.min.js"></script> -->

</body>
</html>
