<?php
	echo json_encode(
	  array(
	    "gitHash" => trim(`git rev-parse HEAD`)
	  )
	);
?>
