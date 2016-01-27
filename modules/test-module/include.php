<?php
//Local files starting without http or https will be loaded from the root of the module folder. If you have a file called test.js in your module just add test.js if you have the same file but in a folder called js inside your module folder add js/test.js. Same is valid for css files. Remote files will be loaded normally from the remote host, no need to specify anything.
return array(
	'js_files' => array(
		//"http://spiegel.local:1234/socket.io/socket.io.js",
		//"js/somefile.js"
	),
	'css_files' => array(
		//"css/randomfile.css",
		//"https://example.com/test.css"
	)
);
?>