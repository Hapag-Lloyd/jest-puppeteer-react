const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const isCI = process.env.CI === 'true';
const isMac = process.platform === 'darwin';

module.exports = {
    generateWebpackConfig: function generateWebpackConfig(
        entryFiles,
        aliasObject
    ) {
        return {
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
                        test: /\.js?$/,
                        loader: 'babel-loader',
                        exclude: /node_modules/,
                    },
                ],
            },
        };
    },
    port: 1111,
    renderOptions: {
        viewport: { deviceScaleFactor: 2 },
    },
    useDocker: false,
    dockerHost: isMac ? 'docker.for.mac.host.internal' : '192.168.65.1', // or try common default
};
