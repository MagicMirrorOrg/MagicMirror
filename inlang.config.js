// https://inlang.com/documentation

export async function defineConfig(env) {
    const plugin = await env.$import(
        "https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js"
    );

    const pluginConfig = {
        pathPattern: "./translations/{language}.json",
    };

    return {
        referenceLanguage: "en",
        languages: await getLanguages(),
        readResources: (args) =>
            plugin.readResources({ ...args, ...env, pluginConfig }),
        writeResources: (args) =>
            plugin.writeResources({ ...args, ...env, pluginConfig }),
    };
}

/**
 * Automatically derives the languages in this repository.
 */
async function getLanguages(env) {
    const files = await env.$fs.readdir("./translations");
    // files that end with .json
    // remove the .json extension to only get language name
    const languages = files
        .filter((name) => name.endsWith(".json"))
        .map((name) => name.replace(".json", ""));
    return languages;
}