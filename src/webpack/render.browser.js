import React from 'react';
import ReactDOM from 'react-dom';

export const render = async (reactNode, options) => {
    const testName = window.__path.join(' ');
    console.log('browser renderer', reactNode, testName);

    // TODO dont render in DOM but rather register the testcases (use globals.browser for that)

    // ReactDOM.render(reactNode, document.getElementById('main'));
    window.__tests[testName] = reactNode;

    return 'image';
};
