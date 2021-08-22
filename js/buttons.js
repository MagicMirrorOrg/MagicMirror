/* global Class, cloneObject, Loader, MMSocket, nunjucks, Translator */

var Buttons = new (Class.extend({
	keyEvents: {},
	buttons: ["buttonOne", "buttonTwo", "buttonThree", "buttonFour"],
	uuid: 0,
	curModuleIndex: 0,

	init: function () {
		return;
	},
	mapContextButtons: function () {
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
			let funcs = this.keyEvents[buttonPressed];
			// for (const module of funcs) {
			// 	if module.name ===
			// }

			funcs.forEach(([uuid, f]) => f());
		});
	},
	mapNavButtons: function () {
		document.addEventListener("keydown", (e) => {
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
	subscribe(event, func) {
		if (!this.buttons.includes(event)) {
			throw new Error("Invalid keypress event");
		}
		let funcs = this.keyEvents[event] || [];
		let uuid = this._getUuid();
		funcs.push([uuid, func]);
		this.keyEvents[event] = funcs;
		return uuid;
	},
	unsubscribe(event, uuid) {
		for (let event in this.keyEvents) {
			const funcIdx = event.findIndex(([u, f]) => u === uuid);
			if (funcIdx !== -1) {
				event.splice(funcIdx, 1);
				return;
			}
		}
		throw new Error("Event not found with this uuid");
	},
	_getUuid() {
		return this.uuid++;
	}
}))();
