const _AnimateCSSIn = {
	// Attention seekers
	1: "bounce",
	2: "flash",
	3: "pulse",
	4: "rubberBand",
	5: "shakeX",
	6: "shakeY",
	7: "headShake",
	8: "swing",
	9: "tada",
	10: "wobble",
	11: "jello",
	12: "heartBeat",
	// Back entrances
	13: "backInDown",
	14: "backInLeft",
	15: "backInRight",
	16: "backInUp",
	// Bouncing entrances
	17: "bounceIn",
	18: "bounceInDown",
	19: "bounceInLeft",
	20: "bounceInRight",
	21: "bounceInUp",
	// Fading entrances
	22: "fadeIn",
	23: "fadeInDown",
	24: "fadeInDownBig",
	25: "fadeInLeft",
	26: "fadeInLeftBig",
	27: "fadeInRight",
	28: "fadeInRightBig",
	29: "fadeInUp",
	30: "fadeInUpBig",
	31: "fadeInTopLeft",
	32: "fadeInTopRight",
	33: "fadeInBottomLeft",
	34: "fadeInBottomRight",
	// Flippers
	35: "flip",
	36: "flipInX",
	37: "flipInY",
	// Lightspeed
	38: "lightSpeedInRight",
	39: "lightSpeedInLeft",
	// Rotating entrances
	40: "rotateIn",
	41: "rotateInDownLeft",
	42: "rotateInDownRight",
	43: "rotateInUpLeft",
	44: "rotateInUpRight",
	// Specials
	45: "jackInTheBox",
	46: "rollIn",
	// Zooming entrances
	47: "zoomIn",
	48: "zoomInDown",
	49: "zoomInLeft",
	50: "zoomInRight",
	51: "zoomInUp",
	// Sliding entrances
	52: "slideInDown",
	53: "slideInLeft",
	54: "slideInRight",
	55: "slideInUp"
};

const _AnimateCSSOut = {
	// Back exits
	1: "backOutDown",
	2: "backOutLeft",
	3: "backOutRight",
	4: "backOutUp",
	// Bouncing exits
	5: "bounceOut",
	6: "bounceOutDown",
	7: "bounceOutLeft",
	8: "bounceOutRight",
	9: "bounceOutUp",
	// Fading exits
	10: "fadeOut",
	11: "fadeOutDown",
	12: "fadeOutDownBig",
	13: "fadeOutLeft",
	14: "fadeOutLeftBig",
	15: "fadeOutRight",
	16: "fadeOutRightBig",
	17: "fadeOutUp",
	18: "fadeOutUpBig",
	19: "fadeOutTopLeft",
	20: "fadeOutTopRight",
	21: "fadeOutBottomRight",
	22: "fadeOutBottomLeft",
	// Flippers
	23: "flipOutX",
	24: "flipOutY",
	// Lightspeed
	25: "lightSpeedOutRight",
	26: "lightSpeedOutLeft",
	// Rotating exits
	27: "rotateOut",
	28: "rotateOutDownLeft",
	29: "rotateOutDownRight",
	30: "rotateOutUpLeft",
	31: "rotateOutUpRight",
	// Specials
	32: "hinge",
	33: "rollOut",
	// Zooming exits
	34: "zoomOut",
	35: "zoomOutDown",
	36: "zoomOutLeft",
	37: "zoomOutRight",
	38: "zoomOutUp",
	// Sliding exits
	39: "slideOutDown",
	40: "slideOutLeft",
	41: "slideOutRight",
	42: "slideOutUp"
};

function AnimateCSS(element, animation, animationTime) {
	// We create a Promise and return it
	return new Promise((resolve) => {
		const animationName = "animate__" + animation;
		const node = document.getElementById(element);
		if (!node) return Log.warn(`[Pages] node not found for`, element);
		node.style.setProperty("--animate-duration", animationTime + "s");
		node.classList.add("animate__animated", animationName);

		// When the animation ends, we clean the classes and resolve the Promise
		function handleAnimationEnd(event) {
			node.classList.remove("animate__animated", animationName);
			event.stopPropagation();
			resolve();
		}

		node.addEventListener("animationend", handleAnimationEnd, { once: true });
	});
}
