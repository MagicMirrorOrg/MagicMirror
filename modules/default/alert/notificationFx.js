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
 */
(function (window) {
	/**
	 * Extend one object with another one
	 *
	 * @param {object} a The object to extend
	 * @param {object} b The object which extends the other, overwrites existing keys
	 * @returns {object} The merged object
	 */
	function extend(a, b) {
		for (var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = b[key];
			}
		}
		return a;
	}

	/**
	 * NotificationFx constructor
	 *
	 * @param {object} options The configuration options
	 * @class
	 */
	function NotificationFx(options) {
		this.options = extend({}, this.options);
		extend(this.options, options);
		this._init();
	}

	/**
	 * NotificationFx options
	 */
	NotificationFx.prototype.options = {
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
		// if the user doesn´t close the notification then we remove it
		// after the following time
		ttl: 6000,
		al_no: "ns-box",
		// callbacks
		onClose: function () {
			return false;
		},
		onOpen: function () {
			return false;
		}
	};

	/**
	 * Initialize and cache some vars
	 */
	NotificationFx.prototype._init = function () {
		// create HTML structure
		this.ntf = document.createElement("div");
		this.ntf.className = this.options.al_no + " ns-" + this.options.layout + " ns-effect-" + this.options.effect + " ns-type-" + this.options.type;
		var strinner = '<div class="ns-box-inner">';
		strinner += this.options.message;
		strinner += "</div>";
		this.ntf.innerHTML = strinner;

		// append to body or the element specified in options.wrapper
		this.options.wrapper.insertBefore(this.ntf, this.options.wrapper.nextSibling);

		// dismiss after [options.ttl]ms
		if (this.options.ttl) {
			var self = this;
			this.dismissttl = setTimeout(function () {
				if (self.active) {
					self.dismiss();
				}
			}, this.options.ttl);
		}

		// init events
		this._initEvents();
	};

	/**
	 * Init events
	 */
	NotificationFx.prototype._initEvents = function () {
		// dismiss notification by tapping on it if someone has a touchscreen
		var self = this;
		this.ntf.querySelector(".ns-box-inner").addEventListener("click", function () {
			self.dismiss();
		});
	};

	/**
	 * Show the notification
	 */
	NotificationFx.prototype.show = function () {
		this.active = true;
		this.ntf.classList.remove("ns-hide");
		this.ntf.classList.add("ns-show");
		this.options.onOpen();
	};

	/**
	 * Dismiss the notification
	 */
	NotificationFx.prototype.dismiss = function () {
		this.active = false;
		clearTimeout(this.dismissttl);
		this.ntf.classList.remove("ns-show");
		var self = this;
		setTimeout(function () {
			self.ntf.classList.add("ns-hide");

			// callback
			self.options.onClose();
		}, 25);

		// after animation ends remove ntf from the DOM
		const onEndAnimationFn = function (ev) {
			if (ev.target !== self.ntf) {
				return false;
			}
			self.ntf.removeEventListener("animationend", onEndAnimationFn);

			if (ev.target.parentNode === self.options.wrapper) {
				self.options.wrapper.removeChild(self.ntf);
			}
		};

		this.ntf.addEventListener("animationend", onEndAnimationFn);
	};

	/**
	 * Add to global namespace
	 */
	window.NotificationFx = NotificationFx;
})(window);
