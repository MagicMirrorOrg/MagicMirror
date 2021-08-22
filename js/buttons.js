/* global Class, cloneObject, Loader, MMSocket, nunjucks, Translator */

var Buttons = new (Class.extend({
	keyEvents: {},
	buttons: ["buttonOne", "buttonTwo", "buttonThree", "buttonFour"],
	uuid: 0,
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
	},
	_mapContextButtons: function () {
		document.addEventListener("keydown", (e) => {
			let buttonPressed = "";
			switch (e.code) {
				case "KeyQ":
					buttonPressed = "buttonOne";
					break;
				case "KeyW":
					buttonPressed = "buttonTwo";
					break;
				case "KeyE":
					buttonPressed = "buttonThree";
					break;
				case "KeyR":
					buttonPressed = "buttonFour";
					break;
				default:
					return;
			}
			const curModule = MM.getModules()[this.curModuleIndex];
			if (curModule.subToButtons) {
				curModule.subToButtons(buttonPressed);
			}
		});
	},
	_mapNavButtons: function () {
		document.addEventListener("keydown", (e) => {
			this._getOrderedModules();
			let moduleLen = MM.getModules().length;

			let elem = this._getActiveModuleElement();
			if (elem) {
				elem.classList.remove("active-module");
			}
			switch (e.code) {
				case "KeyA":
					this.curModuleIndex = (((this.curModuleIndex + 1) % moduleLen) + moduleLen) % moduleLen;
					break;
				case "KeyS":
					this.curModuleIndex = (((this.curModuleIndex - 1) % moduleLen) + moduleLen) % moduleLen;
					break;
			}
			elem = this._getActiveModuleElement();
			if (elem) {
				elem.classList.add("active-module");
			}
		});
	},
	_getActiveModuleElement: function () {
		// const curModuleName = MM.getModules()[this.curModuleIndex].name;
		// if (curModule == ''
		const idName = `module_${this.curModuleIndex}_${MM.getModules()[this.curModuleIndex].name}`;
		const element = document.getElementById(idName);
		return document.getElementById(idName);
	},
	_getOrderedModules: function () {
		let modules = MM.getModules();
		let orderedModules = {};
		console.log("here");
		for (const module of modules) {
			orderedModules[module.data.position];
		}
		console.log(orderedModules);
	}
}))();
