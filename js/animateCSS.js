/* enumeration of animations in Array **/
const AnimateCSSIn = [
	// Attention seekers
	"bounce",
	"flash",
	"pulse",
	"rubberBand",
	"shakeX",
	"shakeY",
	"headShake",
	"swing",
	"tada",
	"wobble",
	"jello",
	"heartBeat",
	// Back entrances
	"backInDown",
	"backInLeft",
	"backInRight",
	"backInUp",
	// Bouncing entrances
	"bounceIn",
	"bounceInDown",
	"bounceInLeft",
	"bounceInRight",
	"bounceInUp",
	// Fading entrances
	"fadeIn",
	"fadeInDown",
	"fadeInDownBig",
	"fadeInLeft",
	"fadeInLeftBig",
	"fadeInRight",
	"fadeInRightBig",
	"fadeInUp",
	"fadeInUpBig",
	"fadeInTopLeft",
	"fadeInTopRight",
	"fadeInBottomLeft",
	"fadeInBottomRight",
	// Flippers
	"flip",
	"flipInX",
	"flipInY",
	// Lightspeed
	"lightSpeedInRight",
	"lightSpeedInLeft",
	// Rotating entrances
	"rotateIn",
	"rotateInDownLeft",
	"rotateInDownRight",
	"rotateInUpLeft",
	"rotateInUpRight",
	// Specials
	"jackInTheBox",
	"rollIn",
	// Zooming entrances
	"zoomIn",
	"zoomInDown",
	"zoomInLeft",
	"zoomInRight",
	"zoomInUp",
	// Sliding entrances
	"slideInDown",
	"slideInLeft",
	"slideInRight",
	"slideInUp"
];

const AnimateCSSOut = [
	// Back exits
	"backOutDown",
	"backOutLeft",
	"backOutRight",
	"backOutUp",
	// Bouncing exits
	"bounceOut",
	"bounceOutDown",
	"bounceOutLeft",
	"bounceOutRight",
	"bounceOutUp",
	// Fading exits
	"fadeOut",
	"fadeOutDown",
	"fadeOutDownBig",
	"fadeOutLeft",
	"fadeOutLeftBig",
	"fadeOutRight",
	"fadeOutRightBig",
	"fadeOutUp",
	"fadeOutUpBig",
	"fadeOutTopLeft",
	"fadeOutTopRight",
	"fadeOutBottomRight",
	"fadeOutBottomLeft",
	// Flippers
	"flipOutX",
	"flipOutY",
	// Lightspeed
	"lightSpeedOutRight",
	"lightSpeedOutLeft",
	// Rotating exits
	"rotateOut",
	"rotateOutDownLeft",
	"rotateOutDownRight",
	"rotateOutUpLeft",
	"rotateOutUpRight",
	// Specials
	"hinge",
	"rollOut",
	// Zooming exits
	"zoomOut",
	"zoomOutDown",
	"zoomOutLeft",
	"zoomOutRight",
	"zoomOutUp",
	// Sliding exits
	"slideOutDown",
	"slideOutLeft",
	"slideOutRight",
	"slideOutUp"
];

/**
 * Create an animation with Animate CSS
 * @param {string} [element] div element to animate.
 * @param {string} [animation] animation name.
 * @param {number} [animationTime] animation duration.
 */
function addAnimateCSS (element, animation, animationTime) {
	const animationName = `animate__${animation}`;
	const node = document.getElementById(element);
	if (!node) {
		// don't execute animate: we don't find div
		Log.warn("addAnimateCSS: node not found for", element);
		return;
	}
	node.style.setProperty("--animate-duration", `${animationTime}s`);
	node.classList.add("animate__animated", animationName);
}

/**
 * Remove an animation with Animate CSS
 * @param {string} [element] div element to animate.
 * @param {string} [animation] animation name.
 */
function removeAnimateCSS (element, animation) {
	const animationName = `animate__${animation}`;
	const node = document.getElementById(element);
	if (!node) {
		// don't execute animate: we don't find div
		Log.warn("removeAnimateCSS: node not found for", element);
		return;
	}
	node.classList.remove("animate__animated", animationName);
	node.style.removeProperty("--animate-duration");
}
if (typeof window === "undefined") module.exports = { AnimateCSSIn, AnimateCSSOut };
