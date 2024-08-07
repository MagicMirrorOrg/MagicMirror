Module.register("helloworld", {
	defaults: {
	  text: "Say YES to <span class='highlight-a'>A</span>YES!",
	  imagePath: "modules/default/helloworld/AYES_Icon.png",
	  imageWidth: "60%",
	  imageHeight: "60%"
	},
  
	start: function() {
	  this.sendNotification("SHOW_ALERT", {
		type: "notification",
		title: "Hello World!",
		message: "Module is loaded!"
	  });
	},
  
	getStyles: function() {
	  return ["helloworld.css"];
	},
  
	getDom: function() {
	  var wrapper = document.createElement("div");
	  wrapper.className = "helloworld-container";
  
	  if (this.config.imagePath) {
		var img = document.createElement("img");
		img.src = this.config.imagePath;
		img.style.width = this.config.imageWidth;
		img.style.height = this.config.imageHeight;
		img.className = "helloworld-image";
		wrapper.appendChild(img);
	  }
  
	  var text = document.createElement("div");
	  text.innerHTML = this.config.text;
	  text.className = "helloworld-text";
	  wrapper.appendChild(text);
  
	  return wrapper;
	}
  });