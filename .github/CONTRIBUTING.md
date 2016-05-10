Contribution Policy for MagicMirror²
====================================

Thanks for contributing to MagicMirror²!

We hold our code to standard, and these standards are documented below. 

First, before you run the linters, you will need to install them all **and** install the development dependencies:

```bash
(sudo) npm install -g jscs stylelint html-validator-cli
npm install
```

### JavaScript: Run JSCS

We use [JSCS](http://jscs.info) on our JavaScript files.

Our JSCS configuration is in our .jscsrc file.

To run JSCS, use `npm run jscs`.

### CSS: Run StyleLint

We use [StyleLint](http://stylelint.io) to lint our CSS. Our configuration is in our .stylelintrc file.

To run StyleLint, use `npm run stylelint`.

### HTML: Run HTML Validator

We use [NU Validator](https://validator.w3.org/nu) to validate our HTML. The configuration is in the command in the package.json file.

To run HTML Validator, use `npm run htmlvalidator`.

## Submitting Issues

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
