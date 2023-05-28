/* MagicMirror²
 * AnimateCSS System from https://animate.style/
 * by @bugsounet
 * for Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

/* enumeration of animations in Array **/
const _AnimateCSSIn = [
	null, // 0 not used (default MM animation)
	// Attention seekers
	"bounce", // 1
	"flash", // 2
	"pulse", // 3
	"rubberBand", // 4
	"shakeX", // 5
	"shakeY", // 6
	"headShake", // 7
	"swing", // 8
	"tada", // 9
	"wobble", // 10
	"jello", // 11
	"heartBeat", // 12
	// Back entrances
	"backInDown", // 13
	"backInLeft", // 14
	"backInRight", // 15
	"backInUp", // 16
	// Bouncing entrances
	"bounceIn", // 17
	"bounceInDown", // 18
	"bounceInLeft", // 19
	"bounceInRight", // 20
	"bounceInUp", // 21
	// Fading entrances
	"fadeIn", // 22
	"fadeInDown", // 23
	"fadeInDownBig", // 24
	"fadeInLeft", // 25
	"fadeInLeftBig", // 26
	"fadeInRight", // 27
	"fadeInRightBig", // 28
	"fadeInUp", // 29
	"fadeInUpBig", // 30
	"fadeInTopLeft", // 31
	"fadeInTopRight", // 32
	"fadeInBottomLeft", // 33
	"fadeInBottomRight", // 34
	// Flippers
	"flip", // 35
	"flipInX", // 36
	"flipInY", // 37
	// Lightspeed
	"lightSpeedInRight", // 38
	"lightSpeedInLeft", // 39
	// Rotating entrances
	"rotateIn", // 40
	"rotateInDownLeft", // 41
	"rotateInDownRight", // 42
	"rotateInUpLeft", // 43
	"rotateInUpRight", // 44
	// Specials
	"jackInTheBox", // 45
	"rollIn", // 46
	// Zooming entrances
	"zoomIn", // 47
	"zoomInDown", // 48
	"zoomInLeft", // 49
	"zoomInRight", // 50
	"zoomInUp", // 51
	// Sliding entrances
	"slideInDown", // 52
	"slideInLeft", // 53
	"slideInRight", // 54
	"slideInUp" // 55
];

const _AnimateCSSOut = [
	null, // 0 not used (default MM animation)
	"backOutDown", // 1
	"backOutLeft", // 2
	"backOutRight", // 3
	"backOutUp", // 4
	// Bouncing exits
	"bounceOut", // 5
	"bounceOutDown", // 6
	"bounceOutLeft", // 7
	"bounceOutRight", // 8
	"bounceOutUp", // 9
	// Fading exits
	"fadeOut", // 10
	"fadeOutDown", // 11
	"fadeOutDownBig", // 12
	"fadeOutLeft", // 13
	"fadeOutLeftBig", // 14
	"fadeOutRight", // 15
	"fadeOutRightBig", // 16
	"fadeOutUp", // 17
	"fadeOutUpBig", // 18
	"fadeOutTopLeft", // 19
	"fadeOutTopRight", // 20
	"fadeOutBottomRight", // 21
	"fadeOutBottomLeft", // 22
	// Flippers
	"flipOutX", // 23
	"flipOutY", // 24
	// Lightspeed
	"lightSpeedOutRight", // 25
	"lightSpeedOutLeft", // 26
	// Rotating exits
	"rotateOut", // 27
	"rotateOutDownLeft", // 28
	"rotateOutDownRight", // 29
	"rotateOutUpLeft", // 30
	"rotateOutUpRight", // 31
	// Specials
	"hinge", // 32
	"rollOut", // 33
	// Zooming exits
	"zoomOut", // 34
	"zoomOutDown", // 35
	"zoomOutLeft", // 36
	"zoomOutRight", // 37
	"zoomOutUp", // 38
	// Sliding exits
	"slideOutDown", // 39
	"slideOutLeft", // 40
	"slideOutRight", // 41
	"slideOutUp" // 42
];

/**
 * Create an animation with Animate CSS
 * resolved as Promise when done
 * @param {string} div element to animate.
 * @param {string} animation name.
 * @param {number} animation duration.
 */
function AnimateCSS(element, animation, animationTime) {
	/* We create a Promise and return it */
	return new Promise((resolve) => {
		const animationName = "animate__" + animation;
		const node = document.getElementById(element);
		if (!node) return Log.warn(`node not found for`, element);
		node.style.setProperty("--animate-duration", animationTime + "s");
		node.classList.add("animate__animated", animationName);

		/* When the animation ends, we clean the classes and resolve the Promise */
		function handleAnimationEnd(event) {
			node.classList.remove("animate__animated", animationName);
			event.stopPropagation();
			resolve();
		}

		node.addEventListener("animationend", handleAnimationEnd, { once: true });
	});
}
