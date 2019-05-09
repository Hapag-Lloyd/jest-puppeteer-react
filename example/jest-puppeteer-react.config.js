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
            if (
                alias.family === 'IPv4' &&
                alias.address !== '127.0.0.1' &&
                !alias.internal
            )
                return alias.address;
        }
    }

    return '0.0.0.0';
}

debug(`get ip address: ${getIPAddress()}`);

module.exports = {
    generateWebpackConfig: function generateWebpackConfig(
        entryFiles,
        aliasObject
    ) {
        return {
            mode: 'development',
            entry: { test: entryFiles },
            devtool: 'eval-source-map',
            output: {
                path: path.resolve(__dirname, 'build'),
                filename: '[name].js',
            },
            devServer: {
                contentBase: './',
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
        viewport: { deviceScaleFactor: 2 },
        dumpConsole: false,
    },
    useDocker: true,
    dockerHost: dockerHost(),
};
