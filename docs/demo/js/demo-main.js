/* MagicMirror² Demo - Main Application
 * Initializes the demo with real MagicMirror modules
 */

(function () {
	"use strict";

	console.log("MagicMirror² Demo starting...");

	// Position mapping (convert underscores to spaces for CSS classes)
	const positionMap = {
		top_bar: "top bar",
		top_left: "top left",
		top_center: "top center",
		top_right: "top right",
		upper_third: "upper third",
		middle_center: "middle center",
		lower_third: "lower third",
		bottom_bar: "bottom bar",
		bottom_left: "bottom left",
		bottom_center: "bottom center",
		bottom_right: "bottom right",
		fullscreen_above: "fullscreen above",
		fullscreen_below: "fullscreen below"
	};

	// Helper: Get container element for position
	/**
	 *
	 * @param position
	 */
	function getContainer (position) {
		const mappedPosition = positionMap[position] || position;
		const classes = mappedPosition.replace(/_/g, " ");
		const regions = document.querySelectorAll(".region");

		for (const region of regions) {
			if (region.className.includes(classes)) {
				const container = region.querySelector(".container");
				if (container) return container;
			}
		}

		console.warn(`Container not found for position: ${position}`);
		return null;
	}

	// Helper: Create module DOM wrapper
	/**
	 *
	 * @param module
	 */
	function createModuleWrapper (module) {
		const wrapper = document.createElement("div");
		wrapper.id = module.identifier;
		wrapper.className = `module ${module.name}`;

		if (module.data.classes) {
			wrapper.className += ` ${module.data.classes}`;
		}

		// Add header
		const header = document.createElement("header");
		header.className = "module-header";
		wrapper.appendChild(header);

		// Add content
		const content = document.createElement("div");
		content.className = "module-content";
		wrapper.appendChild(content);

		return wrapper;
	}

	// Helper: Update module DOM
	/**
	 *
	 * @param module
	 */
	async function updateModuleDom (module) {
		const wrapper = document.getElementById(module.identifier);
		if (!wrapper) return;

		const content = wrapper.querySelector(".module-content");
		const header = wrapper.querySelector(".module-header");

		// Update header
		if (typeof module.getHeader === "function") {
			const headerText = module.getHeader();
			header.innerHTML = headerText || "";
			header.style.display = headerText ? "block" : "none";
		}

		// Update content
		try {
			const dom = await module.getDom();
			content.innerHTML = "";
			content.appendChild(dom);
		} catch (error) {
			console.error(`Error updating module ${module.name}:`, error);
		}
	}

	// Initialize modules
	/**
	 *
	 */
	async function initModules () {
		console.log("Initializing modules from config...");

		const moduleInstances = [];
		let moduleId = 0;

		for (const moduleConfig of config.modules) {
			const moduleName = moduleConfig.module;
			const moduleData = {
				...moduleConfig,
				name: moduleName,
				identifier: `module_${moduleId}_${moduleName}`,
				hidden: false,
				index: moduleId,
				classes: moduleConfig.classes || `${moduleName}`
			};

			console.log(`Creating module: ${moduleName}`);

			// Check if module is registered
			if (typeof Module === "undefined" || !Module.definitions || !Module.definitions[moduleName]) {
				console.warn(`Module ${moduleName} not registered yet, skipping for now`);
				continue;
			}

			// Create module instance (Module.create already returns an instance, not a class!)
			const instance = Module.create(moduleName);
			if (!instance) {
				console.error(`Failed to create module: ${moduleName}`);
				continue;
			}

			instance.setData(moduleData);
			instance.setConfig(moduleConfig.config || {});

			// Store instance
			moduleInstances.push(instance);
			MM.modules.push(instance);

			// Create and insert DOM
			const container = getContainer(moduleConfig.position);
			if (container) {
				const wrapper = createModuleWrapper(instance);
				container.appendChild(wrapper);

				// Override updateDom for this instance
				instance.updateDom = function (speed) {
					updateModuleDom(instance);
				};
			}

			moduleId++;
		}

		// Start all modules
		console.log("Starting modules...");
		for (const module of moduleInstances) {
			try {
				if (typeof module.start === "function") {
					await module.start();
				}
				await updateModuleDom(module);
			} catch (error) {
				console.error(`Error starting module ${module.name}:`, error);
			}
		}

		console.log("MagicMirror² Demo ready! ✨");
	}

	// Start when DOM is ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			// Wait a bit for all modules to register
			setTimeout(initModules, 100);
		});
	} else {
		setTimeout(initModules, 100);
	}

	// Keyboard shortcuts
	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			const banner = document.getElementById("demo-banner");
			if (banner) {
				banner.style.display = banner.style.display === "none" ? "flex" : "none";
			}
		}
	});

}());
