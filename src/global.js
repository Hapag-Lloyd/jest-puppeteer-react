const setupPuppeteer = require('jest-environment-puppeteer/setup');
const teardownPuppeteer = require('jest-environment-puppeteer/teardown');
const WS_ENDPOINT_PATH = require('jest-environment-puppeteer/lib/constants')
    .WS_ENDPOINT_PATH;

const debug = require('debug')('jest-puppeteer-react');
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
    debug('setup jest-puppeteer');
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
    const port = config.port || 1111;
    debug('starting webpack-dev-server on port ' + port);
    webpackDevServer.listen(port);

    if (config.useDocker) {
        try {
            debug('calling docker.start()');
            const ws = await docker.start();
            debug('websocket is ' + ws);
            fs.writeFileSync(WS_ENDPOINT_PATH, ws);
            debug('wrote websocket to file ' + WS_ENDPOINT_PATH);
            console.log('\nStarting Docker for screenshots...');
        } catch (e) {
            console.error(e);
        }
    }
};

module.exports.teardown = async function teardown() {
    debug('stopping webpack-dev-server');
    webpackDevServer.close();

    const config = getConfig();
    try {
        if (config.useDocker) {
            debug('stopping docker');
            await docker.stop();
        }
    } catch (e) {
        console.error(e);
    }

    debug('teardown jest-puppeteer');
    await teardownPuppeteer();
};
