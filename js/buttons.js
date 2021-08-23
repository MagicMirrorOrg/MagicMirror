/* global Class, cloneObject, Loader, MMSocket, nunjucks, Translator */

var Buttons = new (Class.extend({
	curModuleIndex: 0,

	init: function () {
		return;
	},
	/**
	 * This function gets called from init in main.js.
	 * It just maps the keyboard buttons to our virtual
	 * buttons.
	 */
	mapButtons: function () {
		this._mapContextButtons();
		this._mapNavButtons();
		this.mapMouseButtons();
	},
	_mapContextButtons: function () {
		const btnMappings = config.buttons.mappings;
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
			if (curModule.subToButtons) {
				curModule.subToButtons(buttonPressed);
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
	mapMouseButtons: function () {
		/**
		 * Add on mouse enter functionality as alternate
		 * interfacing option for
		 */
		setTimeout(() => {
			const moduleElements = document.getElementsByClassName("module");
			for (const mod of moduleElements) {
				mod.addEventListener("mouseenter", (e) => {
					const idx = this._getOrderedModules().findIndex((m) => m.data.identifier === e.target.id);
					if (idx !== -1) {
						this.curModuleIndex = idx;
						mod.classList.add("active-module");
					}
				});
			}
			for (const mod of moduleElements) {
				mod.addEventListener("mouseleave", (e) => {
					const idx = this._getOrderedModules().findIndex((m) => m.data.identifier === e.target.id);
					if (idx !== -1) {
						this.curModuleIndex = idx;
						mod.classList.remove("active-module");
					}
				});
			}
		}, 3000);
	},
	_getActiveModuleElement: function () {
		const idName = this._getOrderedModules()[this.curModuleIndex].data.identifier;
		return document.getElementById(idName);
	},
	_getOrderedModules: function () {
		let modules = MM.getModules();
		let orderedModules = [];
		orderedModules.push(...modules.filter((m) => m.data.position === "top_bar"));
		orderedModules.push(...modules.filter((m) => m.data.position === "top_left"));
		orderedModules.push(...modules.filter((m) => m.data.position === "top_center"));
		orderedModules.push(...modules.filter((m) => m.data.position === "top_right"));
		orderedModules.push(...modules.filter((m) => m.data.position === "upper_third"));
		orderedModules.push(...modules.filter((m) => m.data.position === "middle_center"));
		orderedModules.push(...modules.filter((m) => m.data.position === "bottom_right"));
		orderedModules.push(...modules.filter((m) => m.data.position === "bottom_left"));
		orderedModules.push(...modules.filter((m) => m.data.position === "bottom_bar"));
		orderedModules.push(...modules.filter((m) => m.data.position === "lower_third"));
		return orderedModules;
	},
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
