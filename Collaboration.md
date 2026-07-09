# Collaboration

This document describes how collaborators of this repository should work together.

## Pull Requests

- never merge your own PRs
- never merge without someone having approved (approving and merging by the same person is allowed)
- wait for all approvals requested (or the author decides something different in the comments)
- merge to `master` only for releases or other urgent issues (update notification is only triggered by tags)
- merges to `master` should be tagged with the `mastermerge` label so that the test runs through

## Issues

- "real" issues are closed if the problem is solved and the fix is released
- unrelated issues (e.g. related to a third-party module) are closed immediately with a comment to open an issue in the module repository or to discuss this further in the forum or Discord

## Releases

Releases are done by:

- @rejas
- @sdetweil
- @khassel or
- @KristjanESPERANTO

### Pre-Deployment Steps

- [ ] update dependencies (a few days before)

### Deployment Steps

- [ ] pull the latest `develop` branch
- [ ] create `prep-release` branch from `develop`
  - [ ] update `package.json` and `package-lock.json` to reflect correct version number `2.xx.0`
  - [ ] test `prep-release` branch
  - [ ] commit and push all changes
  - [ ] create pull request from `prep-release` to `develop` branch with title `Prepare Release 2.xx.0`
  - [ ] after successful test run via GitHub Actions: merge pull request to `develop`
- [ ] review the content of the automatically generated draft release named `unreleased`
  - [ ] check contributor names
  - [ ] check auto-generated minimum Node.js version and adjust it for better readability if necessary
  - [ ] check if all elements are assigned to the correct category
  - [ ] change release name to `v2.xx.0`
- [ ] after successful test run via GitHub Actions: create pull request from `develop` to `master` branch
  - [ ] add label `mastermerge`
  - [ ] title of the PR is `Release 2.xx.0`
  - [ ] description of the PR is the body of the draft release with name `v2.xx.0`
- [ ] check if the new PR has merge conflicts, if so, merge `master` into the new PR and solve the conflicts
- [ ] after PR tests run without issues, merge the PR
- [ ] edit draft release with name `v2.xx.0`
  - [ ] set corresponding version tag `v2.xx.0` (with `Select tag` and then `Create new tag`)
  - [ ] update release link in `Compare to previous Release` by replacing `develop` with the new tag `v2.xx.0`
  - [ ] publish the release (button at the bottom)

### Draft new development release

- [ ] check out `develop` branch
- [ ] update `package.json` and `package-lock.json` to reflect correct version number `2.xx.0-develop`
- [ ] commit and push `develop` branch
- [ ] if the new release will be in January, update the year in `LICENSE.md`

### After release

- [ ] publish release notes with a link to the GitHub release on the forum in a new locked topic (use edit release on GitHub to copy the content with Markdown syntax)
- [ ] close all issues with label `ready (coming with next release)`
- [ ] release new documentation by merging `develop` into `master` in the documentation repository
- [ ] publish new version on [npm](https://www.npmjs.com/package/magicmirror)
  - [ ] use a clean environment (e.g. container)
  - [ ] clone this repository with the new `master` branch and `cd` into the local repository directory
  - [ ] **Method 1 (recommended): With browser and 2FA**
    - [ ] execute `npm login` which will open a browser window
    - [ ] log in with your npm credentials and enter your 2FA code
    - [ ] execute `npm publish`
  - [ ] **Method 2 (fallback for headless environments): With token (bypasses 2FA)**
    - [ ] ⚠️ Note: This method bypasses 2FA and should only be used when a browser is not available
    - [ ] go to `https://www.npmjs.com/settings/<username>/tokens/` and click `generate new token`
    - [ ] enable `Bypass two-factor authentication (2FA)` and under `Packages and scopes` give `Read and write` permission to the `magicmirror` package, press `Generate token`
    - [ ] execute:

      ```bash
      NPM_TOKEN="npm_xxxxxx"
      npm set "//registry.npmjs.org/:_authToken=$NPM_TOKEN"
      npm publish
      ```
