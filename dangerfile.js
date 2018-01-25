import { message, danger } from "danger"

// Add a CHANGELOG entry for app changes
const hasChangelog = includes(danger.git.modified_files, "CHANGELOG.md")
const isTrivial = contains((danger.github.pr.body + danger.github.pr.title), "#trivial")

if (!hasChangelog && !isTrivial) {
    warn("Please add a `CHANGELOG.md` entry for your changes.")
}