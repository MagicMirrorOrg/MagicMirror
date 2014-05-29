<html>
<head>
	<title>Magic Mirror</title>
	<style type="text/css">
		body, html {
			background: #000;
			padding: 0px;
			margin: 0px;
			width:100%;
			height: 100%;


			font-family: "HelveticaNeue-Light";
			letter-spacing: -2px;
			color: #fff;
			font-size: 75px;
			 -webkit-font-smoothing: antialiased;
		}
		.wi {
			line-height: 75px;

		}

		.top
		{
			position: absolute;
			top: 50px;
		}

		.left
		{
			position: absolute;
			left: 50px;
		}
		.right
		{
			position: absolute;
			right: 50px;
			text-align: right;
		}

		.center-ver
		{
			position: absolute;
			top: 50%;
			height: 200px;
			margin-top: -100px;
			line-height: 100px;
		}

		.lower-third
		{
			position: absolute;
			top: 66.666%;
			height: 200px;
			margin-top: -100px;
			line-height: 100px;	
		}

		.center-hor
		{
			position: absolute;
			right: 50px;
			left: 50px;
			text-align: center;	
		}

		.bottom
		{
			position: absolute;
			bottom: 50px;
		}

		.xxsmall
		{
			font-size: 15px;
			letter-spacing: 0px;
			font-family: "HelveticaNeue-Medium";
		}
		.xxsmall .wi {
			line-height: 15px;
		}

		.xsmall
		{
			font-size: 20px;
			letter-spacing: 0px;
			font-family: "HelveticaNeue-Medium";
		}
		.xsmall .wi {
			line-height: 20px;
		}


		.small
		{
			font-size: 25px;
			letter-spacing: 0px;
			font-family: "HelveticaNeue-Medium";
		}
		.small .wi {
			line-height: 25px;
		}

		.medium
		{
			font-size: 35px;
			letter-spacing: -1px;
			font-family: "HelveticaNeue-Light";
		}
		.medium .wi {
			line-height: 35px;
		}

		.xdimmed
		{
			color: #666;
		} 

		.dimmed
		{
			color: #aaa;
		}

		.light
		{
			font-family: "HelveticaNeue-UltraLight";
		}

		.icon 
		{
			position: relative;
			top :-10px;
			display: inline-block;
			font-size: 45px;
			padding-right: 5px;
			font-weight: 100;
			margin-right: 10px;
		}

		.time .sec {
			font-size: 25px;
			color: #666;
			padding-left: 5px;
			position: relative;
			top: -35px;
		}

		.forecast-table {
			float: right;
			text-align: right;
			font-size: 20px;
			line-height: 20px;
		}
		.forecast-table .day, .forecast-table .temp-min, .forecast-table .temp-max  
		{
			width: 50px;
			text-align: right;
		}

		.forecast-table .temp-max 
		{
			width: 60px;
		}

		.forecast-table .day
		{
			color: #999;
		}

		.calendar-table {
			font-size: 14px;
			line-height: 20px;
			margin-top: 10px;
		}
		.calendar-table .days {
			padding-left: 20px;
			text-align: right;
		}

		.dishwasher {
			background-color: white;
			color: black;
			margin: 0 200px;	
			font-size: 60px;	
			border-radius: 1000px;
			border-radius: 1200px;
			display: none;
		}

		@font-face {
		  font-family: 'HelveticaNeue-UltraLight';
		  src: url('font/HelveticaNeue-UltraLight.eot'); /* IE9 Compat Modes */
		  src: url('font/HelveticaNeue-UltraLight.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
		       url('font/HelveticaNeue-UltraLight.woff') format('woff'), /* Modern Browsers */
		       url('font/HelveticaNeue-UltraLight.ttf')  format('truetype'), /* Safari, Android, iOS */
		       url('font/HelveticaNeue-UltraLight.svg#9453ea8da727d260bcdbfa605bdbb5d2') format('svg'); /* Legacy iOS */
		  font-style:   normal;
		  font-weight:  100;
		}



		@font-face {
		  font-family: 'HelveticaNeue-Medium';
		  src: url('font/HelveticaNeue-Medium.eot'); /* IE9 Compat Modes */
		  src: url('font/HelveticaNeue-Medium.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
		       url('font/HelveticaNeue-Medium.woff') format('woff'), /* Modern Browsers */
		       url('font/HelveticaNeue-Medium.ttf')  format('truetype'), /* Safari, Android, iOS */
		       url('font/HelveticaNeue-Medium.svg#d7af0fd9278f330eed98b60dddea7bd6') format('svg'); /* Legacy iOS */ 
		  font-style:   normal;
		  font-weight:  400;
		}

		@font-face {
		  font-family: 'HelveticaNeue-Light';
		  src: url('font/HelveticaNeue-Light.eot'); /* IE9 Compat Modes */
		  src: url('font/HelveticaNeue-Light.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
		       url('font/HelveticaNeue-Light.woff') format('woff'), /* Modern Browsers */
		       url('font/HelveticaNeue-Light.ttf')  format('truetype'), /* Safari, Android, iOS */
		       url('font/HelveticaNeue-Light.svg#7384ecabcada72f0e077cd45d8e1c705') format('svg'); /* Legacy iOS */      
		  font-style:   normal;
		  font-weight:  200;
		}
	</style>
	<link rel="stylesheet" type="text/css" href="css/weather-icons.css">
	<script type="text/javascript">
		var gitHash = '<?php echo trim(`git rev-parse HEAD`) ?>';
	</script>
	<meta name="google" value="notranslate" />
	<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
</head>
<body>

	<div class="top left">
		<div class="date small dimmed"></div>
		<div class="time"></div>
		<div class="calendar xxsmall"></div>
	</div>
	<div class="top right">
		<div class="windsun small dimmed"></div>
		<div class="temp"></div>
		<div class="forecast small dimmed"></div>
	</div>
	<div class="center-ver center-hor">
		<div class="dishwasher light">Vaatwasser is klaar!</div>
	</div>
	<div class="lower-third center-hor">
		<div class="compliment light"></div>
	</div>
	<div class="bottom center-hor">
		<div class="news medium"></div>
	</div>

	<script src="js/jquery.js"></script>
	<script src="js/jquery.feedToJSON.js"></script>
	<script src="js/ical_parser.js"></script>
	<script src="js/moment-with-langs.min.js"></script>
	<script src="js/config.js"></script>
	<script src="js/main.js?nocache=<?php echo md5(microtime()) ?>"></script>
	<script src="//cdnjs.cloudflare.com/ajax/libs/socket.io/0.9.16/socket.io.min.js"></script>

</body>
</html>
