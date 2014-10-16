<?php
	echo json_encode(array('ontime'=>trim(`cat /tmp/mirror.txt`)));