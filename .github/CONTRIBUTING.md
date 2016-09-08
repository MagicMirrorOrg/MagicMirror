Contribution Policy for MagicMirror²
====================================

Thanks for contributing to MagicMirror²!

We hold our code to standard, and these standards are documented below. 

### JavaScript: Run ESLint

We use [ESLint](http://eslint.org) on our JavaScript files.

Our ESLint configuration is in our .eslintrc.json and .eslintignore files.

To run ESLint, use `grunt eslint`.

### CSS: Run StyleLint

We use [StyleLint](http://stylelint.io) to lint our CSS. Our configuration is in our .stylelintrc file.

To run StyleLint, use `grunt postcss:lint`.

### Submitting Issues

Please only submit reproducible issues. 

If you're not sure if it's a real bug or if it's just you, please open a topic on the forum: https://forum.magicmirror.builders/category/15/bug-hunt - Problems installing or configuring your MagicMirror? Check out: https://forum.magicmirror.builders/category/10/troubleshooting

When submitting a new issue, please supply the following information:

**Platform** [ Raspberry Pi 2/3, Windows, Mac OS X, Linux, Etc ... ]:

**Node Version** [ 0.12.13 or later ]:

**MagicMirror Version** [ V1 / V2-Beta ]:

**Description:** Provide a detailed description about the issue and include specific details to help us understand the problem. Adding screenshots will help describing the problem.

**Steps to Reproduce:** List the step by step process to reproduce the issue.

**Expected Results:** Describe what you expected to see.

**Actual Results:** Describe what you actually saw.

**Configuration:** What does the used config.js file look like? (Don't forget to remove any sensitive information.)

**Additional Notes:** Provide any other relevant notes not previously mentioned (optional)
