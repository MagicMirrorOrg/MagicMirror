# Collaboration

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

Are done by

- [ ] @rejas
- [ ] @sdetweil
- [ ] @khassel

### Pre-Deployment steps

- [ ] update dependencies (a few days before)

### Deployment steps

- [ ] pull latest `develop` branch
- [ ] update `package.json` and `package-lock.json` to reflect correct version number `2.xx.0`
- [ ] test `develop` branch
- [ ] update `CHANGELOG.md`
  - [ ] add all contributor names: `...`
  - [ ] add min. node version: > ⚠️ This release needs nodejs version `v20` or `v22`, minimum version is `v20.9.0`
  - [ ] check release link at the bottom of the file
- [ ] commit and push all changes
- [ ] after successful test run via github actions: create pull request from `develop` to `master` branch
  - [ ] add label `mastermerge`
  - [ ] title of the PR is `Release 2.xx.0`
  - [ ] description of the PR is the section of the `CHANGELOG.md`
- [ ] after PR tests run without issues, merge PR
- [ ] create new release with
  - [ ] corresponding version tag `v2.xx.0`
  - [ ] a release name: `...`
  - [ ] description of the release is the section of the `CHANGELOG.md`

### Draft new development release

- [ ] checkout `develop` branch
- [ ] update `package.json` and `package-lock.json` to reflect correct version number `2.xx.0-develop`
- [ ] draft new section in `CHANGELOG.md`
  - [ ] create new release link at the bottom of the file
- [ ] commit and publish `develop` branch

### After release

- [ ] publish release notes with link to github release on forum in new locked topic
- [ ] close all issues with label `ready (coming with next release)`
- [ ] release new documentation by merging `develop` on `master` in documentation repository
- [ ] publish new version on [npm](https://www.npmjs.com/package/magicmirror)
