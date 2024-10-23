const path = require('path');
const { TestEnvironment } = require('jest-environment-puppeteer');
const { promisify } = require('util');
const fs = require('fs');

class PuppeteerReactEnvironment extends TestEnvironment {
    async setup() {
        await super.setup();

        const rootPath = process.cwd(); // of your project under test

        const configName = 'jest-puppeteer-react.config';
        const statPromisified = promisify(fs.stat);

        let configExt = '.cjs';

        try {
            await statPromisified(path.join(process.cwd(), `${configName}${configExt}`));
        } catch (e) {
            // Fallback extension if CommonJS module not exist
            configExt = '.js';
        }

        const config = require(path.join(rootPath, `${configName}${configExt}`));

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
