# jest-puppeteer-react [![Build Status](https://travis-ci.com/Hapag-Lloyd/jest-puppeteer-react.svg?branch=master)](https://travis-ci.com/Hapag-Lloyd/jest-puppeteer-react)

```
yarn add jest-puppeteer-react
```

This lib combines `jest-puppeteer` with webpack and webpack-dev-server to render your React components so you don't have to setup a server and navigate to it. It also includes `jest-image-snapshot` which adds the `toMatchImageSnapshot` matcher to expect.

## Setup

1.  Use the preset in your jest configuration:

    ```
    {
      "preset": "jest-puppeteer-react"
    }
    ```

    Or require / include the needed scripts (`globalSetup, globalTeardown, testEnvironment, setupTestFrameworkScriptFile`).

2.  Add a config file which contains a function to return a webpack config which is used to render:

    ```
    const webpack = require('webpack');
    const path = require('path');
    const buildDevWebpackConfig = require('./packages/core/dev/webpack/dev');

    module.exports = {
        generateWebpackConfig: function generateWebpackConfig(entryFiles, aliasObject) {
            const webpackConfig = buildDevWebpackConfig('test', {
                root: __dirname,
                app: 'x',
            }, {
                template: path.join(__dirname, './packages/dev-test-lib/screenshot/index.ejs'),
            }, webpack);

            webpackConfig.entry = { test: entryFiles };
            webpackConfig.resolve.alias = aliasObject;

            return webpackConfig;
        },
        port: 1111,
    };
    ```

## Usage

Then use the specified render in your tests:

```ecmascript 6
import React from 'react';
import { render } from 'jest-puppeteer-react';
import Button from '../Button';

describe('Button', () => {
    test('should render a button', async () => {
        await render(
            <Button>Button</Button>,
            { viewport: { width: 100, height: 100 } }
        );

        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot();
    });
});
```

## Options

The second argument of render takes some options to make things easier. You can also supply a default for this via the config.

```
{
    timeout: 60000, // 60 seconds
    viewport: {
        width: 100,
        height: 100,
        deviceScaleFactor: 2 // Retina Resolution
    }
}
```

### Viewport

Automatically calls `page.setViewport()` for you.
See [puppeteer](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagesetviewportviewport) docs for options.

## Configuration

You can put a `jest-puppeteer-react.config.js` file in your project root which gets automatically detected by jest-puppeteer-react.

Example:

```
const webpack = require('webpack');
const path = require('path');
const buildDevWebpackConfig = require('./packages/core/dev/webpack/dev');

module.exports = {
    generateWebpackConfig: function generateWebpackConfig(entryFiles, aliasObject) {
        const webpackConfig = buildDevWebpackConfig('test', {
            root: __dirname,
            app: 'x',
        }, {
            template: path.join(__dirname, './packages/dev-test-lib/screenshot/index.ejs'),
        }, webpack);

        webpackConfig.entry = { test: entryFiles };
        webpackConfig.resolve.alias = aliasObject;

        return webpackConfig;
    },
    port: 1111,
    renderOptions: {
        viewport: { deviceScaleFactor: 2 },

        // function calls before page.goto()
        before: (page) => {
            // for example, disable cache
            await page.setCacheEnabled(false);
        },

        // function calls after page.goto()
        after: (page) => {},
    },
};
```

### Configure Puppeteer

You can put a `jest-puppeteer.config.js` file in your root to configure puppeteer. This is a feature of the jest-puppeteer lib. See their readme for documentation: [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer/tree/6cd3050e472c9a8bcdb18e2635a40ad674c4b795#configure-puppeteer).

### Configure ESLint

If you want to use the page object directly (without using the return value of render), you can set it as a global for eslint. See [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer/tree/6cd3050e472c9a8bcdb18e2635a40ad674c4b795#configure-eslint) for an example.

## Limitations

To be able to render the components in the browser, the test cases are required via webpack and the structure functions such as describe and test are evaluated. However, special behavior implemented in jest may be missing. For example mocks and timers are not supported currently.
Furthermore at the moment hooks are not supported aswell. But they could be implemented quite easily.

## Todos

*   check if we need babel for jest aswell. we probably do for jsx syntax
*   make webpack config option step optional and supply a simple config with js/jsx loader.
*   document requirement: run jest from root directory of project (containing config files)
*   support beforeEach, afterEach, beforeAll and afterAll
