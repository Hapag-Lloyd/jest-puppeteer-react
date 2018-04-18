const setupPuppeteer = require('jest-environment-puppeteer/setup');
const teardownPuppeteer = require('jest-environment-puppeteer/teardown');
const WS_ENDPOINT_PATH = require('jest-environment-puppeteer/lib/constants')
    .WS_ENDPOINT_PATH;

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const glob = promisify(require('glob'));
const docker = require('./docker');

let webpackDevServer;

const getConfig = () =>
    require(path.join(process.cwd(), 'jest-puppeteer-react.config.js'));

module.exports.setup = async function setup() {
    await setupPuppeteer();

    const rootPath = process.cwd(); // e.g. /Users/ansgar/projects/project-x
    const testFiles = (await glob(`${rootPath}/**/*.browser.js`)).filter(
        file => file.indexOf('node_modules') === -1
    );

    const config = getConfig();

    const entryFiles = [
        'babel-polyfill',
        path.resolve(__dirname, 'webpack/globals.browser.js'),
        ...testFiles,
        path.resolve(__dirname, 'webpack/entry.browser.js'),
    ];
    const aliasObject = {
        'jest-puppeteer-react': path.resolve(
            __dirname,
            'webpack/render.browser.js'
        ),
    };

    // TODO: document the conventions used here (and in the build / files) in README
    const webpackConfig = config.generateWebpackConfig(entryFiles, aliasObject);

    const compiler = webpack(webpackConfig);
    webpackDevServer = new WebpackDevServer(compiler, {
        noInfo: true,
        disableHostCheck: true,
    });
    webpackDevServer.listen(config.port || 1111);

    if (config.useDocker) {
        try {
            const ws = await docker.start();
            fs.writeFileSync(WS_ENDPOINT_PATH, ws);
            console.log('\nStarting Docker for screenshots...');
        } catch (e) {
            console.error(e);
        }
    }
};

module.exports.teardown = async function teardown() {
    webpackDevServer.close();

    const config = getConfig();
    try {
        if (config.useDocker) {
            await docker.stop();
        }
    } catch (e) {
        console.error(e);
    }

    await teardownPuppeteer();
};
