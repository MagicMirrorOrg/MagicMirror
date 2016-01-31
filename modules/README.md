MagicMirror
===========

##Modules
A module has to contain one file: `include.php`. Other files can be loaded from within this. You can add modules by hand by simply copying the folder with the module in this directory. You can also work with [git submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules). To load the test-module as a subdir run these two commands:
```
git submodule init
git submodule update
```

### include.php
If you happen to need any other css or js file from remote host or a local file you can add it in `include.php`. The files will be included in the order you specify in `include.php`. If you're `main.js` needs to go last, add it last!

It will be loaded before the module's main javascript, the module's css and the module's elements.

Local files starting without `http` or `https` will be loaded from the `root` of the module folder. 
If you have a file called `test.js` in your module just add `test.js` if you have the same file but in a folder called `js` inside your module folder add `js/test.js`. Same is valid for css files. Remote files will be loaded normally from the remote host, no need to specify anything.

### elements.html
Put your custom divs and other html elements in this file (don't include any body or header tags). Any refrence of `[module]` will be replaced with the path to the module's root. `[module]/img/test.png` for example becomes `modules/name_of_module/img/test.png`.

### main.js
Your plugin's JavaScript. If you want to use this file you have to include it in `include.php`.

### style.css
CSS for your HTML elements. All module elements get loaded into a `div`. The `id` is the name of the module's folder, which acts as the module's name. If you want to use this file you have to include it in `include.php`.