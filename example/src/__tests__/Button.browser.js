/**
 * @jest-environment jest-puppeteer-react/environment
 */
import React from 'react';
import { render } from 'jest-puppeteer-react';

import Button from '../Button';

describe('Button', () => {
    jest.setTimeout(60000);
    test('should render correctly', async () => {
        await render(<Button label="Button" />, {
            viewport: { width: 200, height: 100 },
        });

        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot();
    });

    test.each(['test 1', 'test 2'])('should render correctly %s', async t => {
        await render(<Button label={`Button in ${t}`} />, {
            viewport: { width: 100, height: 100 },
        });

        const screenshot = await page.screenshot();
        expect(screenshot).toMatchImageSnapshot();
    });
    describe('with describe', () => {
        test('should render correctly', async () => {
            await render(<Button label="Button with describe" />, {
                viewport: { width: 100, height: 100 },
            });

            const screenshot = await page.screenshot();
            expect(screenshot).toMatchImageSnapshot();
        });
    });

    describe.each(['describe 1', 'describe 2'])('with %s', d => {
        test('should render correctly', async () => {
            await render(<Button label={`Button in ${d}`} />, {
                viewport: { width: 100, height: 100 },
            });

            const screenshot = await page.screenshot();
            expect(screenshot).toMatchImageSnapshot();
        });
    });

    describe.each(['describe 1', 'describe 2'])('with %s', d => {
        test.each(['test 1', 'test 2'])('should render correctly %s', async t => {
            await render(<Button label={`Button in ${d} and ${t}`} />, {
                viewport: { width: 100, height: 100 },
            });

            const screenshot = await page.screenshot();
            expect(screenshot).toMatchImageSnapshot();
        });
    });
});
