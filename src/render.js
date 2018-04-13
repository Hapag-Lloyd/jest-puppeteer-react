const merge = require('lodash.merge');

async function render(reactNode, options) {
    const { currentTestName } = expect.getState();
    const config = global._jest_puppeteer_react_default_config;
    const opts = merge({}, config.renderOptions, options);

    await page.goto(
        `http://localhost:${config.port}?test=${encodeURIComponent(
            currentTestName
        )}`
    );

    if (opts.viewport) {
        await page.setViewport(opts.viewport);
    }

    return page;
}

module.exports = render;
