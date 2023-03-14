const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const debug = require('debug')('jest-puppeteer-react');

const isMac = process.platform === 'darwin';
const isWin32 = process.platform === 'win32';

const dockerHost = () => {
    if (isMac) {
        return 'docker.for.mac.host.internal';
    }
    if (isWin32) {
        return 'host.docker.internal';
    }
    return '172.17.0.1';
};

function getIPAddress() {
    const interfaces = require('os').networkInterfaces();
    for (let devName in interfaces) {
        const iface = interfaces[devName];

        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) return alias.address;
        }
    }

    return '0.0.0.0';
}

debug(`get ip address: ${getIPAddress()}`);

module.exports = {
    generateWebpackConfig: function generateWebpackConfig(entryFiles, aliasObject) {
        return {
            mode: 'development',
            entry: { test: ['@babel/polyfill', ...entryFiles] },
            devtool: 'eval-source-map',
            output: {
                path: path.resolve(__dirname, 'build'),
                filename: '[name].js',
            },
            devServer: {
                server: 'https',
            },
            resolve: {
                alias: aliasObject,
            },
            plugins: [
                new HtmlWebpackPlugin({
                    template: path.resolve(__dirname, 'index.ejs'),
                }),
            ],
            module: {
                rules: [
                    {
                        test: /\.m?js$/,
                        exclude: /(node_modules)/,
                        use: {
                            loader: 'babel-loader',
                        },
                    },
                ],
            },
        };
    },
    port: 1111,
    renderOptions: {
        viewport: { deviceScaleFactor: 1 },
        dumpConsole: false,
    },
    useHttps: true,
    useDocker: true,
    dockerHost: dockerHost(),
    dockerEntrypoint: '""', // overwrites the default entrypoint of the image
    dockerRunOptions: '--shm-size=1g',
    dockerCommand:
        'google-chrome ' +
        '--no-sandbox ' +
        '--disable-background-networking ' +
        '--disable-default-apps ' +
        '--disable-extensions ' +
        '--disable-sync ' +
        '--disable-translate ' +
        '--headless ' +
        '--hide-scrollbars ' +
        '--metrics-recording-only ' +
        '--mute-audio ' +
        '--no-first-run ' +
        '--safebrowsing-disable-auto-update ' +
        '--ignore-certificate-errors ' +
        '--ignore-ssl-errors ' +
        '--ignore-certificate-errors-spki-list ' +
        '--user-data-dir=/tmp ' +
        '--remote-debugging-port=9222 ' +
        '--remote-debugging-address=0.0.0.0',
};
