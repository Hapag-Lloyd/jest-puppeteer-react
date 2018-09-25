import React from 'react';

export const render = async (reactNode, options) => {
    const testName = window.__path.join(' ');
    // console.log('browser renderer', reactNode, testName);
    window.__tests[testName] = Object.assign({}, options, {
        reactNode,
        path: [...window.__path],
    });
};
