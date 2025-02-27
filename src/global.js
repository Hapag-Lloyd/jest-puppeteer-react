const setupPuppeteer = require('jest-environment-puppeteer/setup');
const teardownPuppeteer = require('jest-environment-puppeteer/teardown');
const ora = require('ora');
const debug = require('debug')('jest-puppeteer-react');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { glob } = require('glob');
const docker = require('./docker');

const DIR = path.join(os.tmpdir(), 'jest_puppeteer_react_global_setup');

let webpackDevServer;

const getConfig = async () => {
    const configName = 'jest-puppeteer-react.config';
    const statPromisified = promisify(fs.stat);

    let configExt = '.cjs';

    try {
        await statPromisified(path.join(process.cwd(), `${configName}${configExt}`));
    } catch (e) {
        // Fallback extension if CommonJS module not exist
        configExt = '.js';
    }

    return require(path.join(process.cwd(), `${configName}${configExt}`));
};

module.exports.setup = async function setup(jestConfig) {
    const { noInfo = true, rootDir, testPathPattern, debugOnly = false } = jestConfig;

    // build only files matching testPathPattern
    const testPathPatterRe = new RegExp(testPathPattern, 'i');
    const testFiles = (await glob(`${rootDir}/**/*.browser.@(js|jsx|ts|tsx)`, { dotRelative: true, posix: true })).filter((file) => {
        if (file.includes('node_modules')) {
            return false;
        }
        return testPathPatterRe.test(fs.realpathSync(file));
    });

    const config = await getConfig();

    const entryFiles = [
        path.resolve(__dirname, 'webpack/globals.browser.js'),
        ...testFiles,
        path.resolve(__dirname, 'webpack/entry.browser.js'),
    ];
    const aliasObject = {
        'jest-puppeteer-react': path.resolve(__dirname, 'webpack/render.browser.js'),
    };

    const webpackConfig = config.generateWebpackConfig(entryFiles, aliasObject);

    const spinner = ora({ color: 'yellow', stream: process.stdout });

    const compiler = webpack({
        infrastructureLogging: {
            level: 'warn',
        },
        ...webpackConfig,
    });

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

    const port = config.port || 1111;
    debug('starting webpack-dev-server on port ' + port);
    webpackDevServer = new WebpackDevServer(
        {
            allowedHosts: 'all',
            devMiddleware: {
                stats: 'minimal',
            },
            port,
            ...(webpackConfig.devServer || {}),
        },
        compiler
    );

    try {
        await webpackDevServer.start();
        await compilerHooks;
    } catch (e) {
        console.error(e);
        return;
    }

    if (config.useDocker && !debugOnly) {
        try {
            spinner.start('Starting Docker for screenshots...');
            debug('calling docker.start()');
            const browserURL = await docker.start(config);
            debug(`browserURL is ${browserURL}`);
            process.env.JEST_PUPPETEER_CONFIG = path.join(DIR, 'config.json');
            fs.mkdirSync(DIR, { recursive: true });
            fs.writeFileSync(
                process.env.JEST_PUPPETEER_CONFIG,
                JSON.stringify({
                    connect: {
                        browserURL: browserURL,
                    },
                })
            );
            spinner.succeed('Docker started');
        } catch (e) {
            console.error(e);
            throw new Error('Failed to start docker for screenshots');
        }
    }

    debug('setup jest-puppeteer');
    await setupPuppeteer(jestConfig);
};

module.exports.teardown = async function teardown(jestConfig) {
    debug('stopping webpack-dev-server');
    try {
        await webpackDevServer.stop();
    } catch (e) {
        console.error(e);
    }

    const config = getConfig();
    try {
        if (config.useDocker) {
            debug('stopping docker');
            await docker.stop(config);
        }
    } catch (e) {
        console.error(e);
    }

    debug('teardown jest-puppeteer');
    await teardownPuppeteer(jestConfig);
};
