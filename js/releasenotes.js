/* eslint no-console: "off" */
const util = require("node:util");
const exec = util.promisify(require("node:child_process").exec);
const fs = require("node:fs");

const createReleaseNotes = async () => {
	let repoName = "MagicMirrorOrg/MagicMirror";
	if (process.env.GITHUB_REPOSITORY) {
		repoName = process.env.GITHUB_REPOSITORY;
	}
	const baseUrl = `https://api.github.com/repos/${repoName}`;

	const getOptions = (type) => {
		if (process.env.GITHUB_TOKEN) {
			return { method: `${type}`, headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } };
		} else {
			return { method: `${type}` };
		}
	};

	const execShell = async (command) => {
		const { stdout = "", stderr = "" } = await exec(command);
		if (stderr) console.error(`Error in execShell executing command ${command}: ${stderr}`);
		return stdout;
	};

	// Check Draft Release
	const draftReleases = [];
	const jsonReleases = await fetch(`${baseUrl}/releases`, getOptions("GET")).then((res) => res.json());
	for (const rel of jsonReleases) {
		if (rel.draft && rel.tag_name === "" && rel.published_at === null && rel.name === "unreleased") draftReleases.push(rel);
	}

	let draftReleaseId = 0;
	if (draftReleases.length > 1) {
		throw new Error("More than one draft release found, exiting.");
	} else {
		if (draftReleases[0]) draftReleaseId = draftReleases[0].id;
	}

	// Get last Git Tag
	const gitTag = await execShell("git describe --tags `git rev-list --tags --max-count=1`");
	const lastTag = gitTag.toString().replaceAll("\n", "");
	console.info(`latest tag is ${lastTag}`);

	// Get Git Commits
	const gitOut = await execShell(`git log develop --pretty=format:"%H --- %s" --after="$(git log -1 --format=%aI ${lastTag})"`);
	console.info(gitOut);
	const commits = gitOut.toString().split("\n");

	// Get Node engine version from package.json
	const nodeVersion = JSON.parse(fs.readFileSync("package.json")).engines.node;

	// Search strings
	const labelArr = ["alert", "calendar", "clock", "compliments", "helloworld", "newsfeed", "updatenotification", "weather", "envcanada", "openmeteo", "openweathermap", "smhi", "ukmetoffice", "yr", "eslint", "bump", "dependencies", "deps", "logg", "translation", "test", "ci"];

	// Map search strings to categories
	const getFirstLabel = (text) => {
		let res;
		labelArr.every((item) => {
			const labelIncl = text.includes(item);
			if (labelIncl) {
				switch (item) {
					case "ci":
					case "test":
						res = "testing";
						break;
					case "logg":
						res = "logging";
						break;
					case "eslint":
					case "bump":
					case "deps":
						res = "dependencies";
						break;
					case "envcanada":
					case "openmeteo":
					case "openweathermap":
					case "smhi":
					case "ukmetoffice":
					case "yr":
					case "weather":
						res = "modules/weather";
						break;
					case "alert":
						res = "modules/alert";
						break;
					case "calendar":
						res = "modules/calendar";
						break;
					case "clock":
						res = "modules/clock";
						break;
					case "compliments":
						res = "modules/compliments";
						break;
					case "helloworld":
						res = "modules/helloworld";
						break;
					case "newsfeed":
						res = "modules/newsfeed";
						break;
					case "updatenotification":
						res = "modules/updatenotification";
						break;
					default:
						res = item;
						break;
				}
				return false;
			} else {
				return true;
			}
		});
		if (!res) res = "core";
		return res;
	};

	const grouped = {};
	const contrib = [];
	const sha = [];

	// Loop through each Commit
	for (const item of commits) {

		const cm = item.trim();
		// ignore `prepare release` line
		if (cm.length > 0 && !cm.match(/^.* --- prepare .*-develop$/gi)) {

			const [ref, title] = cm.split(" --- ");

			const groupTitle = getFirstLabel(title.toLowerCase());

			if (!grouped[groupTitle]) {
				grouped[groupTitle] = [];
			}

			grouped[groupTitle].push(`- ${title}`);

			sha.push(ref);
		}
	}

	// function to remove duplicates
	const sortedArr = (arr) => {
		return arr.filter((item,
			index) => (arr.indexOf(item) === index && item !== "@dependabot[bot]")).sort(function (a, b) {
			return a.toLowerCase().localeCompare(b.toLowerCase());
		});
	};

	// Get Contributors logins
	for (const ref of sha) {
		const jsonRes = await fetch(`${baseUrl}/commits/${ref}`, getOptions("GET")).then((res) => res.json());

		if (jsonRes && jsonRes.author && jsonRes.author.login) contrib.push(`@${jsonRes.author.login}`);
	}

	// Build Markdown content
	let markdown = "## Release Notes\n";

	markdown += `Thanks to: ${sortedArr(contrib).join(", ")}\n`;
	markdown += `> ⚠️ This release needs nodejs version ${nodeVersion}\n`;
	markdown += "\n";
	markdown += `[Compare to previous Release ${lastTag}](https://github.com/${repoName}/compare/${lastTag}...develop)\n\n`;

	const sorted = Object.keys(grouped)
		.sort() // Sort the keys alphabetically
		.reduce((obj, key) => {
			obj[key] = grouped[key]; // Rebuild the object with sorted keys
			return obj;
		}, {});

	for (const group in sorted) {
		markdown += `\n### [${group}]\n`;
		markdown += `${sorted[group].join("\n")}\n`;
	}

	console.info(markdown);

	// Create Github Release
	if (process.env.GITHUB_TOKEN) {
		if (draftReleaseId > 0) {
			// delete release
			await fetch(`${baseUrl}/releases/${draftReleaseId}`, getOptions("DELETE"));
			console.info(`Old Release with id ${draftReleaseId} deleted.`);
		}

		const relContent = getOptions("POST");
		relContent.body = JSON.stringify(
			{ tag_name: "", name: "unreleased", body: `${markdown}`, draft: true }
		);
		const createRelease = await fetch(`${baseUrl}/releases`, relContent).then((res) => res.json());
		console.info(`New release created with id ${createRelease.id}, GitHub-Url: ${createRelease.html_url}`);
	}
};

createReleaseNotes();
