import { danger, fail } from "danger"

// Check if the CHANGELOG.md file has been edited
const changelogEdited = danger.git.modified_files.includes("CHANGELOG.md")

// Fail the build and post a comment reminding submitters to do so if it wasn't changed
if (!changelogEdited) {
	fail("Please include an updated `CHANGELOG.md` file.<br>This way we can keep track of all the contributions.<br><br>Thanks!")
}