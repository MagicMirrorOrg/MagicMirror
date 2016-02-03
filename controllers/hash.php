<?php
function getHash() {
	$hash = exec('git rev-parse HEAD', $output, $returncode);
	if ($returncode == 0) {
		return '0-'.$hash;
	}
	// No git for php? Let's try parsing git structures
	$file = dirname(str_replace('\\','/',__DIR__))."/.git/HEAD";
	if (is_file($file)) {
		$refOrCommit = file_get_contents($file);
		if ($refOrCommit !== false && $refOrCommit !== null) {
			if (strpos($refOrCommit, 'ref') !== false) {
				list($ref, $head) = explode(' ', $refOrCommit);
				$head = trim($head);
				$file = dirname(str_replace('\\','/',__DIR__))."/.git/$head";
				return '1-'.trim(file_get_contents($file));
			} else {
				return '2-'.trim($refOrCommit);
			}
		}
		return 'static-version-sorry-no-auto-detect-of-changes';
	}
}

if (str_replace('\\','/',__FILE__) == $_SERVER['SCRIPT_FILENAME']) {
	header('Content-Type: application/json');
	echo json_encode(
	  array(
		"gitHash" => getHash(),
	  )
	);
} else
	echo getHash();

