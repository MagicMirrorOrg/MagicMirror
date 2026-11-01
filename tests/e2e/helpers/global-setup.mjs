import { createRequire } from "node:module";

// Load natively: when Vitest evaluates global-setup.js itself, app.mjs would run inside Vite's module loader.
const helpers = createRequire(import.meta.url)("./global-setup.js");

export const { getPage, startApplication, stopApplication, getDocument, fixupIndex, restoreIndex } = helpers;
