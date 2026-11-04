/*
 * Default Modules List
 * Modules listed below can be loaded without the 'default/' prefix. Omitting the default folder name.
 */
const defaultModules = ["alert", "calendar", "clock", "compliments", "helloworld", "newsfeed", "updatenotification", "weather"];

globalThis.defaultModules = defaultModules;

export { defaultModules as default };
