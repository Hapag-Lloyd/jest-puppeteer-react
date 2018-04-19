/**
 * @jest-environment jest-puppeteer-react/environment
 */
import React from 'react';
import { mount } from 'enzyme';
import { render } from 'jest-puppeteer-react';

import Logo from '../Logo';

describe('Logo', () => {
    test('should render correctly', async () => {
        await render(<Logo />, { viewport: { width: 100, height: 100 } });

        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot();
    });
});
