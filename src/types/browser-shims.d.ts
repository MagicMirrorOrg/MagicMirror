/*
 * Browser-project-only ambient shims.
 *
 * The browser tsconfig sets "types": [] so @types/node globals do NOT leak into
 * browser scope. But several dual-world browser files (class, defaults, logger,
 * vendor, ...) keep a CommonJS export guard so they remain require()-able by the
 * Node test suite:
 *
 *     if (typeof module !== "undefined") { module.exports = X; }
 *
 * Declare the minimum here so that guard type-checks under strict mode without
 * pulling in the full Node types. NOT included by the server project.
 */

declare const module: { exports: any };

/*
 * js/logger.js and js/defaults.js are dual-world: loaded as browser <script>s but
 * also require()-d in Node. They reference Node globals behind `typeof module`
 * guards. Declare them loosely so the browser project (which excludes @types/node)
 * still type-checks; the real Node types apply in the server project.
 */
declare const process: any;
declare function require (id: string): any;
