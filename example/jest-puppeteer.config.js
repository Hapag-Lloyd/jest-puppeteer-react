// require from parent node_modules since this test setup otherwise
// has duplicate jest-puppeteer-docker libs (both in root and in example node_modules)
// and resolves browserWSEndpoint wrong. in real usage, require normally:
// const getConfig = require("jest-puppeteer-docker/lib/config");
const getConfig = require("../node_modules/jest-puppeteer-docker/lib/config");
const baseConfig = getConfig();

module.exports = {
    ...baseConfig,
    launch: {
        // dumpio: true,
        // headless: false,
        // slowMo: 1000,
    },
};
