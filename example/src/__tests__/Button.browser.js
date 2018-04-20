/**
 * @jest-environment jest-puppeteer-react/environment
 */
import React from 'react';
import { render } from 'jest-puppeteer-react';

import Button from '../Button';

describe('Button', () => {
    test('should render correctly', async () => {
        await render(<Button label="Button" />, {
            viewport: { width: 100, height: 100 },
        });

        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot();
    });
});
