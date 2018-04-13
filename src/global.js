const setupPuppeteer = require('jest-environment-puppeteer/setup');
const teardownPuppeteer = require('jest-environment-puppeteer/teardown');

const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { promisify } = require('util');
const path = require('path');
const glob = promisify(require('glob'));

let webpackDevServer;

module.exports.setup = async function setup() {
    await setupPuppeteer();

    const rootPath = process.cwd(); // e.g. /Users/ansgar/projects/project-x
    const testFiles = await glob(`${rootPath}/**/*.browser.js`);

    const config = require(path.join(
        rootPath,
        'jest-puppeteer-react.config.js'
    ));

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
    webpackDevServer = new WebpackDevServer(compiler, { noInfo: true });
    webpackDevServer.listen(1111); // TODO make port settable via config
};

module.exports.teardown = async function teardown() {
    webpackDevServer.close();
    await teardownPuppeteer();
};
