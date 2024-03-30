This document describes how collaborators of this repository should work together.

## Pull Requests

- never merge your own PR's
- never merge without someone having approved (approving and merging from same person is allowed)
- wait for all approvals requested (or the author decides something different in the comments)
- merge to `master` only for releases or other urgent issues (update notification is only triggered by tags)
- merges to master should be tagged with the "mastermerge" label so that the test runs through

## Issues

- "real" Issues are closed if the problem is solved and the fix is released
- unrelated Issues (e.g. related to a foreign module) are closed immediately with a comment to open an issue in the module repository or to discuss this further in the forum or discord

## Releases

Are done by @rejas or @khassel.

### Deployment steps

- pull latest `develop` branch
- update `package.json` to reflect correct version number
- run `npm install` to generate new `package-lock.json`
- test `develop` branch
- update `CHANGELOG.md` (don't forget to add all contributor names)
- commit and push all changes
- after successful test run via github actions: create pull request to `master` branch
- after PR tests run without issues, merge PR
- create new release with corresponding version tag
- publish release notes with link to github release on forum in new locked topic

### Draft new development release

- checkout `develop` branch
- update `package.json` to reflect correct version number `2.xx.0-develop`
- draft new section in `CHANGELOG.md`
- commit and publish `develop` branch
