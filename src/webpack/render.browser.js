import React from 'react';

export const render = async (reactNode, options) => {
    const testName = window.__path.join(' ');

    if (testName in window.__tests) {
        throw new Error(`Test name collision detected for "${testName}". Please use describe() or rename tests.`);
    }

    // console.log('browser renderer', reactNode, testName);
    window.__tests[testName] = Object.assign({}, options, {
        reactNode,
        path: [...window.__path],
    });
};
