/* MagicMirror²
 * AnimateCSS System from https://animate.style/
 * by @bugsounet
 * for Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */

/* enumeration of animations in Array **/
const _AnimateCSSIn = [
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

const _AnimateCSSOut = [
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
 * resolved as Promise when done
 * @param {string} [element] div element to animate.
 * @param {string} [animation] animation name.
 * @param {number} [animationTime] animation duration.
 */
function AnimateCSS(element, animation, animationTime) {
	/* We create a Promise and return it */
	return new Promise((resolve) => {
		const animationName = `animate__${animation}`;
		const node = document.getElementById(element);
		if (!node) {
			// don't execute animate and resolve
			Log.warn(`AnimateCSS: node not found for`, element);
			resolve();
			return;
		}
		node.style.setProperty("--animate-duration", `${animationTime}s`);
		node.classList.add("animate__animated", animationName);

		/**
		 * When the animation ends, we clean the classes and resolve the Promise
		 * @param {object} event object
		 */
		function handleAnimationEnd(event) {
			node.classList.remove("animate__animated", animationName);
			node.style.removeProperty("--animate-duration", `${animationTime}s`);
			event.stopPropagation();
			resolve();
		}

		node.addEventListener("animationend", handleAnimationEnd, { once: true });
	});
}
