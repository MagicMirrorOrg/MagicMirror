# Contribution Policy for MagicMirror²

Thanks for contributing to MagicMirror²!

We hold our code to standard, and these standards are documented below.

## Linters

We use prettier for automatic linting of all our files: `npm run lint:prettier`.

### JavaScript: Run ESLint

We use [ESLint](https://eslint.org) on our JavaScript files.

Our ESLint configuration is in our `.eslintrc.json` and `.eslintignore` files.

To run ESLint, use `npm run lint:js`.

### CSS: Run StyleLint

We use [StyleLint](https://stylelint.io) to lint our CSS. Our configuration is in our `.stylelintrc` file.

To run StyleLint, use `npm run lint:css`.

## Testing

We use [Jest](https://jestjs.io) for JavaScript testing.

To run all tests, use `npm run test`.

The specific test commands are defined in `package.json`.
So you can also run the specific tests with other commands, e.g. `npm run test:unit` or `npx jest tests/e2e/env_spec.js`.

## Submitting Issues

Please only submit reproducible issues.

If you're not sure if it's a real bug or if it's just you, please open a topic on the forum: [https://forum.magicmirror.builders/category/15/bug-hunt](https://forum.magicmirror.builders/category/15/bug-hunt)

Problems installing or configuring your MagicMirror? Check out: [https://forum.magicmirror.builders/category/10/troubleshooting](https://forum.magicmirror.builders/category/10/troubleshooting)

When submitting a new issue, please supply the following information:

**Platform**: Place your platform here... give us your web browser/Electron version _and_ your hardware (Raspberry Pi 2/3/4, Windows, Mac, Linux, System V UNIX).

**Node Version**: Make sure it's version 14 or later (recommended is 16).

**MagicMirror² Version**: Please let us know which version of MagicMirror² you are running. It can be found in the `package.json` file.

**Description**: Provide a detailed description about the issue and include specific details to help us understand the problem. Adding screenshots will help describing the problem.

**Steps to Reproduce**: List the step by step process to reproduce the issue.

**Expected Results**: Describe what you expected to see.

**Actual Results**: Describe what you actually saw.

**Configuration**: What does the used config.js file look like? Don't forget to remove any sensitive information!

**Additional Notes**: Provide any other relevant notes not previously mentioned. This is optional.
