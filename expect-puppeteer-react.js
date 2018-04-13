require('expect-puppeteer');

const { toMatchImageSnapshot } = require('jest-image-snapshot');

// maybe extend the matcher to understand page objects and making a screenshot on its own
// async matchers aren't supported yet: https://github.com/facebook/jest/pull/5919
expect.extend({ toMatchImageSnapshot });
