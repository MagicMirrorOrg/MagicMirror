/**
 * Based on work by
 *
 * notificationFx.js v1.0.0
 * https://tympanus.net/codrops/
 *
 * Licensed under the MIT license.
 * https://opensource.org/licenses/mit-license.php
 *
 * Copyright 2014, Codrops
 * https://tympanus.net/codrops/
 * @param {object} window The window object
 */
(function (window) {

	/**
	 * Extend one object with another one
	 * @param {object} a The object to extend
	 * @param {object} b The object which extends the other, overwrites existing keys
	 * @returns {object} The merged object
	 */
	const extend = (a, b) => {
		for (const key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = b[key];
			}
		}
		return a;
	};

	/**
	 * Notification widget with configurable layout/effect, auto-dismiss and click-to-dismiss.
	 */
	class NotificationFx {

		/**
		 * Default options, shared across all instances unless overridden.
		 */
		static defaultOptions = {
			// element to which the notification will be appended
			// defaults to the document.body
			wrapper: document.body,
			// the message
			message: "yo!",
			// layout type: growl|attached|bar|other
			layout: "growl",
			// effects for the specified layout:
			// for growl layout: scale|slide|genie|jelly
			// for attached layout: flip|bouncyflip
			// for other layout: boxspinner|cornerexpand|loadingcircle|thumbslider
			// ...
			effect: "slide",
			// notice, warning, error, success
			// will add class ns-type-warning, ns-type-error or ns-type-success
			type: "notice",
			// if the user doesn't close the notification then we remove it
			// after the following time
			ttl: 6000,
			al_no: "ns-box",
			// callbacks
			onClose () {
				return false;
			},
			onOpen () {
				return false;
			}
		};

		/**
		 * @param {object} options The configuration options
		 */
		constructor (options) {
			this.options = extend({}, NotificationFx.defaultOptions);
			extend(this.options, options);
			this._init();
		}

		/**
		 * Initialize and cache some vars
		 */
		_init () {
			// create HTML structure
			this.ntf = document.createElement("div");
			this.ntf.className = `${this.options.al_no} ns-${this.options.layout} ns-effect-${this.options.effect} ns-type-${this.options.type}`;
			let strinner = "<div class=\"ns-box-inner\">";
			strinner += this.options.message;
			strinner += "</div>";
			this.ntf.innerHTML = strinner;

			// append to body or the element specified in options.wrapper
			this.options.wrapper.insertBefore(this.ntf, this.options.wrapper.nextSibling);

			// dismiss after [options.ttl]ms
			if (this.options.ttl) {
				this.dismissttl = setTimeout(() => {
					if (this.active) {
						this.dismiss();
					}
				}, this.options.ttl);
			}

			// init events
			this._initEvents();
		}

		/**
		 * Init events
		 */
		_initEvents () {
			// dismiss notification by tapping on it if someone has a touchscreen
			this.ntf.querySelector(".ns-box-inner").addEventListener("click", () => {
				this.dismiss();
			});
		}

		/**
		 * Show the notification
		 */
		show () {
			this.active = true;
			this.ntf.classList.remove("ns-hide");
			this.ntf.classList.add("ns-show");
			this.options.onOpen();
		}

		/**
		 * Dismiss the notification
		 * @param {boolean} [close] call the onClose callback at the end
		 */
		dismiss (close = true) {
			this.active = false;
			clearTimeout(this.dismissttl);
			this.ntf.classList.remove("ns-show");
			setTimeout(() => {
				this.ntf.classList.add("ns-hide");

				// callback
				if (close) this.options.onClose();
			}, 25);

			// after animation ends remove ntf from the DOM
			const onEndAnimationFn = (ev) => {
				if (ev.target !== this.ntf) {
					return false;
				}
				this.ntf.removeEventListener("animationend", onEndAnimationFn);

				if (ev.target.parentNode === this.options.wrapper) {
					this.options.wrapper.removeChild(this.ntf);
				}
			};

			this.ntf.addEventListener("animationend", onEndAnimationFn);
		}
	}

	/**
	 * Add to global namespace
	 */
	window.NotificationFx = NotificationFx;
}(window));
