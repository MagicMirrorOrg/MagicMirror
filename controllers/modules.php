<?php
	$modules_folder = 'modules/';
	$modules = array_filter(glob($modules_folder."*"), 'is_dir');
	foreach ($modules as $module) {
		//Add container arround module
		print_r( '<div id="'.substr($module, strlen($modules_folder)).'">' );
		
		//Load files to include
		$include_files = include($module."/include.php");
		//Add Javascript files
		foreach ($include_files["js_files"] as $file) {
			//Check if js file is hosted on a remote server
			if (preg_match('#^https?://#i', $file) === 1) {
				print_r('<script src="'.$file.'"></script>'."\xA");
			}
			//add local path to module folder
			else{
				print_r('<script src="modules/'.$module.'/'.$file.'"></script>'."\xA");
			}
		};
		//Add CSS files
		foreach ($include_files["css_files"] as $file) {
			//Check if css file is hosted on a remote server
			if (preg_match('#^https?://#i', $file) === 1) {
				print_r('<link rel="stylesheet" type="text/css" href="'.$file.'">'."\xA");
			}
			//add local path to module folder
			else{
				print_r('<link rel="stylesheet" type="text/css" href="/modules/'.$module.'/'.$file.'">'."\xA");
			}
		};
	
		//Add the modules JS file
		print_r('<script src="'.$module.'/main.js" type="text/javascript"></script>'."\xA");
		//Add the modules CSS file
		print_r('<link rel="stylesheet" type="text/css" href="'.$module.'/style.css">'."\xA");
		//Get and add HTML Elements
		print_r(str_replace("[module]",$module ,file_get_contents($module.'/elements.html')));
		
		//Close module container
		print_r("</div>");
	}
?>