/*
 * `Module` is defined by client/module.ts (compiled as a separate tsc project).
 * Default-module browser entries (this project) call Module.register(...), so declare
 * it here. NOT included by the client project (which defines it).
 */
declare const Module: ModuleConstructor;
