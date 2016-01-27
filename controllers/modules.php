<?php
	$modules = array_filter(glob('modules/*'), 'is_dir');
	foreach ($modules as &$module) {
		//Add JS file of module
		print_r('<script src="'.$module.'/main.js" type="text/javascript"></script>'."\xA");
		//Add CSS file of module
		print_r('<link rel="stylesheet" type="text/css" href="'.$module.'/style.css">'."\xA");
		//Get and add HTML Elements
		print_r(file_get_contents($module.'/elements.html'));
	}
?>