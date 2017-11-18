# Common build scripts for eth.ly

The repository with common scripts for build, tests and deploy, reused by other repositories of eth.ly

## How to use
Add this lines in `dependencies` section of your `package.json` file:
```json
"ethly-deploy": "ethly/deploy",
"gulp": "^3.9.1"
```
And to your `gulpfile.js`:
```js
const gulp = require('gulp');
const setupBuild = require('ethly-deploy');

setupBuild(
  gulp,
  'path/to/sources',
  'path/to/build',
  'path/to/build_test'
);
```
## Commands

```sh
gulp typecheck    # Typechecks entire project
gulp lint         # Lint project and fix some errors
gulp build        # Builds the project
gulp test         # Starts tests from the `tests` directory
gulp clean        # Cleans the `build` directory
gulp clean-test   # Cleans the `build_test` directory
```

## Steps of build
1. Clean
2. Check types of JS files
3. Lint them
4. Erase types
5. Transform to legacy JS
6. Add type declaration files
