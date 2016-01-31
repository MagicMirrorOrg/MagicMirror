<?php
	$modules_folder = 'modules/';
	
	// Store modules in array for use in index.php
	$all_modules = array();
	foreach (glob($modules_folder."*", GLOB_ONLYDIR) as $module) {
		$name = substr($module, strlen($modules_folder));
		// Only add module if a include.php exists
		if (file_exists($module."/include.php")) {
			$all_modules[$name] = array();
			
			//Load files to include
			$include_files = include($module."/include.php");
			//Add Javascript and css files 
			foreach (array('js', 'css') as $type) {
				foreach ($include_files[$type."_files"] as $file) {
					//Check if file is hosted on a remote server
					if (preg_match('#^https?://#i', $file) === 1) {
						$all_modules[$name][] = array('type' => $type, 'url' => $file);
					}
					//add local path to module folder
					else{
						$all_modules[$name][] = array(
							'type' => $type, 
							'url' => sprintf('modules/%s/%s', $name, $file)
						);
					}
				}
			}
			if (file_exists($module."/elements.html")) {
				$all_modules[$name][] = array (
					'type' => 'elements',
					'data' => str_replace("[module]",$module ,file_get_contents($module.'/elements.html')),
				);
			}
		}
	}
	
	$elements = '';
	$scripts = '';
	$css = '';
	foreach($all_modules as $name => $module_data) {
		foreach($module_data as $data) {
			switch ($data['type']) {
				case 'js':
					$scripts .= sprintf("\t".'<script src="%s" type="text/javascript"></script>'."\n", $data['url']);
					break;
				case 'css':
					$css .= sprintf("\t".'<link rel="stylesheet" type="text/css" href="%s" />'."\n", $data['url']);
					break;
				case 'elements':
					$elements .= sprintf('<div id="%s">%s</div>'."\n", $name, $data['data']);
					break;
				default:
					break;
			}
		}
	}