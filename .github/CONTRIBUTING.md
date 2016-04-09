Contribution Policy for MagicMirror²
====================================

Thanks for contributing to MagicMirror²!

We hold our code to standard, and these standards are documented below. 

First, before you run the linters, you will need to install them all **and** install the development dependencies:

```bash
(sudo) npm install -g jscs stylelint html-validator-cli
npm install
```

### JavaScript: Run JSCS and ESLint

We use [JSCS](http://jscs.info) and [ESLint](http://eslint.org) on our JavaScript files.

Our JSCS configuration is in our .jscsrc file, and we use [eslint-config-google](https://www.npmjs.com/package/eslint-config-google) in ESLint.

To run ESLint, use `npm run eslint`. To run JSCS, use `npm run jscs`.

### CSS: Run StyleLint

We use [StyleLint](http://stylelint.io) to lint our CSS. Our configuration is in our .stylelintrc file.

To run StyleLint, use `npm run stylelint`.

### HTML: Run HTML Validator

We use [NU Validator](https://validator.w3.org/nu) to validate our HTML. The configuration is in the command in the package.json file.

To run HTML Validator, use `npm run htmlvalidator`.
