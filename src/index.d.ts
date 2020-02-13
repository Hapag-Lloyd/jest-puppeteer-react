import { Page, Viewport, DirectNavigationOptions } from "puppeteer";

export interface JestPuppeteerReactRenderOptions extends DirectNavigationOptions {
    dumpConsole?: boolean,
    before?(page: Page): any,
    after?(page: Page): any,
    viewport?: Viewport,
}

export function render(
    component: JSX.Element,
    options?: JestPuppeteerReactRenderOptions
): Page;