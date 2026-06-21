/*
 * Bridge for SunCalc v2 (ESM-only entry):
 * default modules still expect a global `SunCalc` from getScripts()/vendor loading.
 * Keep this as a tiny compatibility shim until the module loader is fully ESM-first.
 */
import * as SunCalc from "../node_modules/suncalc/index.js";

globalThis.SunCalc = SunCalc;
