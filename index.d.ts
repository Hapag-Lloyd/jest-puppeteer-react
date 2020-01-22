interface JestPuppeteerReactRenderConfig {
    timeout?: number;
    viewport?: {
        width?: number;
        height?: number;
        deviceScaleFactor?: number;
    };
}

export function render(
    component: JSX.Element,
    config?: JestPuppeteerReactRenderConfig
): any;
