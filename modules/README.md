MagicMirror
===========

##Modules
A module has to contain four files: main.js, style.css, elements.html and include.php
Other files can be loaded from within those.

### include.php
If you happen to need any other css or js file from remote host or a local file you can add it in include.php.
It will be loaded before the plugins main javascript, the plugins css and the plugins elements.

Local files starting without http or https will be loaded from the root of the module folder. 
If you have a file called test.js in your module just add test.js if you have the same file but in a folder called js inside your module folder add js/test.js. Same is valid for css files. Remote files will be loaded normally from the remote host, no need to specify anything.

### elements.html
Put your custom divs and other html elements in this file (don't include any body or header tags)

### main.js
Your plugins JavaScript.

### style.css
CSS for your HTML elements.