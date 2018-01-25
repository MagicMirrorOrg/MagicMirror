import { danger, fail } from "danger"

// Check if the CHANGELOG.md file has been edited
const changelogEdited = danger.git.modified_files.includes("CHANGELOG.md")

// Fail the build and post a comment reminding submitters to do so if it wasn't changed
if (!changelogEdited) {
	fail("Please include a CHANGELOG entry. You can find it at [CHANGELOG.md](CHANGELOG.md).")
}