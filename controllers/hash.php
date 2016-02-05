<?php
function getHash() {
	$hash = exec('git rev-parse HEAD', $output, $returncode);
	if ($returncode == 0) {
		return '0-'.trim($hash);
	}
	// No git for php?
	return 'static-version-sorry-no-auto-detect-of-changes';
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

