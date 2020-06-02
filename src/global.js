const setupPuppeteer = require('jest-environment-puppeteer/setup');
const teardownPuppeteer = require('jest-environment-puppeteer/teardown');
const {
    setup: setupPuppeteerWithDocker,
    teardown: teardownPuppeteerWithDocker
} = require('jest-puppeteer-docker');
const ora = require('ora');
const debug = require('debug')('jest-puppeteer-react');
const webpack = require('webpack');
const fetch = require('node-fetch');
const WebpackDevServer = require('webpack-dev-server');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const glob = promisify(require('glob'));

let webpackDevServer;

const getConfig = () => require(path.join(process.cwd(), 'jest-puppeteer-react.config.js'));

module.exports.setup = async function setup(jestConfig = {}) {
    const { noInfo = true, rootDir, testPathPattern, debugOnly = false } = jestConfig;
    // build only files matching testPathPattern
    const testPathPatterRe = new RegExp(testPathPattern, 'i');
    const testFiles = (await glob(`${rootDir}/**/*.browser.@(js|jsx|ts|tsx)`)).filter((file) => {
        if (file.includes('node_modules')) {
            return false;
        }
        return testPathPatterRe.test(fs.realpathSync(file));
    });

    const config = getConfig();

    const entryFiles = [
        path.resolve(__dirname, 'webpack/globals.browser.js'),
        ...testFiles,
        path.resolve(__dirname, 'webpack/entry.browser.js'),
    ];
    const aliasObject = {
        'jest-puppeteer-react': path.resolve(__dirname, 'webpack/render.browser.js'),
    };

    // TODO: document the conventions used here (and in the build / files) in README
    const webpackConfig = config.generateWebpackConfig(entryFiles, aliasObject);

    const spinner = ora({ color: 'yellow', stream: process.stdout });

    const compiler = webpack(webpackConfig);

    const compilerHooks = new Promise((resolve, reject) => {
        compiler.hooks.watchRun.tapAsync('jest-puppeeter-react', (_, callback) => {
            spinner.start('Waiting for webpack build to succeed...');
            callback();
        });
        compiler.hooks.done.tapAsync('jest-puppeeter-react', (stats, callback) => {
            if (stats.hasErrors()) {
                spinner.fail('Webpack build failed');
                reject(stats);
            } else {
                spinner.succeed('Webpack build finished');
                resolve(stats);
            }
            callback();
        });
    });

    webpackDevServer = new WebpackDevServer(compiler, {
        noInfo,
        disableHostCheck: true,
        stats: 'minimal',
        ...(webpackConfig.devServer || {}),
    });

    const port = config.port || 1111;
    debug('starting webpack-dev-server on port ' + port);
    webpackDevServer.listen(port);

    try {
        await compilerHooks;
    } catch (e) {
        return;
    }

    debug('setup jest-puppeteer');
    if (config.useDocker && !debugOnly) {
        await setupPuppeteerWithDocker(jestConfig);
    } else {
        await setupPuppeteer(jestConfig);
    }
};

module.exports.teardown = async function teardown(jestConfig = {}) {
    const { debugOnly = false } = jestConfig;
    debug('stopping webpack-dev-server');
    webpackDevServer.close();

    const config = getConfig();

    debug('teardown jest-puppeteer');
    if (config.useDocker && !debugOnly) {
        await teardownPuppeteerWithDocker(jestConfig);
    } else {
        await teardownPuppeteer(jestConfig);
    }
};
