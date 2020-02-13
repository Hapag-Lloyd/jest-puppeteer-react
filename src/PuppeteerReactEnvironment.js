const path = require('path');
const PuppeteerEnvironment = require('jest-environment-puppeteer');

class PuppeteerReactEnvironment extends PuppeteerEnvironment {
    async setup() {
        await super.setup();

        const rootPath = process.cwd(); // of your project under test

        const config = require(path.join(rootPath, 'jest-puppeteer-react.config.js'));

        if (!config.port) {
            config.port = 1111;
        }
        const { renderOptions } = config;
        if (renderOptions.viewport) {
            // ensure width and height are set if the viewport was set
            if (!renderOptions.viewport.width) renderOptions.viewport.width = 600;
            if (!renderOptions.viewport.height) renderOptions.viewport.height = 800;
        }

        this.global._jest_puppeteer_react_default_config = config;
    }

    async teardown() {
        delete this.global._jest_puppeteer_react_default_config;

        await super.teardown();
    }
}

module.exports = PuppeteerReactEnvironment;
