/*
 * Browser globals defined by sibling projects but consumed by the client core:
 * defaultModules (modules/defaultmodules.ts) and translations (translations/translations.ts).
 * NOT included by those defining projects.
 */
declare const defaultModules: string[];
declare const translations: Record<string, string>;
