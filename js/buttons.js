/* global Class, cloneObject, Loader, MMSocket, nunjucks, Translator */

var Buttons = new (Class.extend({
	/**
	 * The index of the current module in the ordered list
	 */
	curModuleIndex: 0,

	init: function () {},
	/**
	 * This function gets called from init in main.js.
	 * It just maps the keyboard buttons to our virtual
	 * buttons.
	 */
	mapButtons: function () {
		this._mapContextButtons();
		this._mapNavButtons();

		setTimeout(() => {
			this.mapMouseButtons();
		}, 3000);
	},
	_mapContextButtons: function () {
		document.addEventListener("keydown", (e) => {
			let buttonPressed = "";
			switch (e.code) {
				case this.getButtonMap("context1"):
					buttonPressed = "context1";
					break;
				case this.getButtonMap("context2"):
					buttonPressed = "context2";
					break;
				case this.getButtonMap("context3"):
					buttonPressed = "context3";
					break;
				case this.getButtonMap("context4"):
					buttonPressed = "context4";
					break;
				default:
					return;
			}
			const curModule = this._getOrderedModules()[this.curModuleIndex];
			if (curModule.onButtonClick) {
				curModule.onButtonClick(buttonPressed);
			}
		});
	},
	_mapNavButtons: function () {
		document.addEventListener("keydown", (e) => {
			const modules = this._getOrderedModules();
			const moduleLen = modules.length;

			let elem = this._getActiveModuleElement();
			if (elem) {
				elem.classList.remove("active-module");
			}
			switch (e.code) {
				case this.getButtonMap("navigationUp"):
					this.curModuleIndex = (((this.curModuleIndex + 1) % moduleLen) + moduleLen) % moduleLen;
					break;
				case this.getButtonMap("navigationDown"):
					this.curModuleIndex = (((this.curModuleIndex - 1) % moduleLen) + moduleLen) % moduleLen;
					break;
			}
			elem = this._getActiveModuleElement();
			if (elem) {
				elem.classList.add("active-module");
			}
		});
	},
	/**
	 * Maps the mouseenter and mouse leave events of module
	 * to selecting an active module. Binds scroll up to
	 * context1, scroll down to context2, left click to
	 * context3, and right click to context4.
	 */
	mapMouseButtons: function () {
		const mouseEneabled = config.buttons.mouseNavigation || false;
		if (!mouseEneabled) {
			return;
		}
		document.documentElement.style.cursor = "pointer";

		const moduleElements = document.getElementsByClassName("module");
		for (const mod of moduleElements) {
			mod.addEventListener("mouseenter", (e) => {
				const idx = this._getOrderedModules().findIndex((m) => m.data.identifier === e.target.id);
				if (idx !== -1) {
					this.curModuleIndex = idx;
					mod.classList.add("active-module");
				}
			});
			mod.addEventListener("mouseleave", (e) => {
				const idx = this._getOrderedModules().findIndex((m) => m.data.identifier === e.target.id);
				if (idx !== -1) {
					this.curModuleIndex = idx;
					mod.classList.remove("active-module");
				}
			});
			mod.addEventListener("click", (e) => {
				const curModule = this._getOrderedModules()[this.curModuleIndex];
				if (curModule.onButtonClick) {
					curModule.onButtonClick("context3");
				}
			});
			let prevScroll = 0;
			mod.addEventListener("wheel", (e) => {
				/**
				 * The following check is a quick way to allow for scroll sensitivity
				 */
				const sensitivity = Math.min(config.buttons.scrollSensitivity, 10);
				if (prevScroll > 0) {
					prevScroll -= sensitivity;
					return;
				}
				const scroll = e.deltaY;
				const curModule = this._getOrderedModules()[this.curModuleIndex];
				let btnPressed = "";
				if (scroll > 0) {
					btnPressed = "context1";
					prevScroll = 10;
				} else if (scroll < 0) {
					btnPressed = "context2";
					prevScroll = 10;
				}
				if (curModule.onButtonClick) {
					curModule.onButtonClick(btnPressed);
				}
			});
		}
	},
	_getActiveModuleElement: function () {
		const idName = this._getOrderedModules()[this.curModuleIndex].data.identifier;
		return document.getElementById(idName);
	},
	/**
	 * @returns All of the currently active modules sorted in a clockwise order
	 */
	_getOrderedModules: function () {
		const nonInteractiveModules = config.buttons.nonInteractiveModules;
		const modules = MM.getModules().filter((m) => !nonInteractiveModules.includes(m.name));
		return [
			...modules.filter((m) => m.data.position === "top_bar"),
			...modules.filter((m) => m.data.position === "top_center"),
			...modules.filter((m) => m.data.position === "top_right"),
			...modules.filter((m) => m.data.position === "upper_third"),
			...modules.filter((m) => m.data.position === "middle_center"),
			...modules.filter((m) => m.data.position === "bottom_right"),
			...modules.filter((m) => m.data.position === "bottom_bar"),
			...modules.filter((m) => m.data.position === "lower_third"),
			...modules.filter((m) => m.data.position === "bottom_left").reverse(),
			...modules.filter((m) => m.data.position === "top_left").reverse()
		];
	},
	/**
	 * Gets the javascript event keycode based on the button name in
	 * MM. Will return default keycodes if none are found in the config.js
	 * file
	 * @param {*} btnName The name of the button
	 * @returns The javascript keydown event button name
	 */
	getButtonMap: function (btnName) {
		const mappings = config.buttons.mappings;
		switch (btnName) {
			case "context1":
				return mappings["context1"] || "KeyQ";
			case "context2":
				return mappings["context2"] || "KeyW";
			case "context3":
				return mappings["context3"] || "KeyE";
			case "context4":
				return mappings["context4"] || "KeyR";
			case "navigationUp":
				return mappings["navigationUp"] || "KeyA";
			case "navigationDown":
				return mappings["navigationDown"] || "KeyS";
		}
	}
}))();
