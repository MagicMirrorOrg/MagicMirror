const config = require('../config/config.js');const fs=require('fs');
for(let m of config.modules){
	if(!(m.disabled || false)){
	 try {	
		 let f=fs.statSync(m.module); 
		 if(f.isDirectory()){ 
			 f1=fs.statSync(m.module+'/package.json');
			 if (f1.isFile()){
				console.log(m.module);
			 }
		 }
	 }
	 catch (ex) {}
  } 
}