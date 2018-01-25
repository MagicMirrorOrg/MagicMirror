import { message, danger } from "danger"
import { includes } from "lodash"

// Add a CHANGELOG entry for app changes
const hasChangelog = includes(danger.git.modified_files, "CHANGELOG.md")
if (!hasChangelog) {
    warn("Please add a `CHANGELOG.md` entry for your changes.")
}