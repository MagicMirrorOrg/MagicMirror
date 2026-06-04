/*
 * Ambient stubs for npm packages that ship no type declarations (and have no
 * @types package installed). Importing them yields `any`. Included by the server
 * tsconfig so `import x from "pkg"` type-checks under strict/noImplicitAny.
 */

declare module "express";
declare module "suncalc";
declare module "feedme";
declare module "html-to-text";
