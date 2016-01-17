<?php
	/*
	 * @function get_url
	 * @purpose To fetch GZipped web content.
	 * @author Michael Teeuw
	*/
	function get_url($url) {
		/*
		 * @array
		 * Prepare the options that we need for our GZip request.
		*/
	    $opts = array(
	        "http" => array(
	            "method" => "GET",
	            "header" => "Accept-Language: en-US,en;q=0.8rn" . "Accept-Encoding: gzip,deflate,sdchrn" . "Accept-Charset:UTF-8,*;q=0.5rn" . "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:19.0) Gecko/20100101 Firefox/19.0 FirePHP/0.4rn",
				"ignore_errors" => true
	        ),
	        /*
	         * @array
	         * Put a Band-Aid over some SSL issues.
	        */
			"ssl" => array(
				"verify_peer" => false,
				"verify_peer_name" => false
			)
	    );
	    $context = stream_context_create($opts);
	    $content = file_get_contents($url, false, $context);
	    /*
	     * @note If http response header mentions that content is gzipped, then uncompress it.
	    */
	    foreach($http_response_header as $c => $h) {
	        if(stristr($h, "content-encoding") and stristr($h, "gzip")) {
	            /*
	             * @note Now, let's begin the actual purpose of this function:
	            */
	            $content = gzinflate(substr($content, 10, -8));
	        }
	    }
	    return $content;
	}
?>
