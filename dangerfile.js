import { danger, fail, warn } from "danger"

// Check if the CHANGELOG.md file has been edited
// Fail the build and post a comment reminding submitters to do so if it wasn't changed
if (!danger.git.modified_files.includes("CHANGELOG.md")) {
	warn("Please include an updated `CHANGELOG.md` file.<br>This way we can keep track of all the contributions.")
}

// Check if the PR request is send to the master branch.
// This should only be done by MichMich.
if (danger.github.pr.base.ref === "master" && danger.github.pr.user.login !== "MichMich") {
	// Check if the PR body or title includes the text: #accepted.
	// If not, the PR will fail.
	if ((danger.github.pr.body + danger.github.pr.title).includes("#accepted")) {
		fail("Please send all your pull requests to the `develop` branch.<br>Pull requests on the `master` branch will not be accepted.")
	}
}