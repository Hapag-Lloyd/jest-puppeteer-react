import ReactDOM from 'react-dom';
import React from 'react';

// TODO: build routing based on a test case name and a global object (filled by globals.browser.js and the testcases)

const search = window.location.search;
const testName = decodeURIComponent(search.match(/\?test=([^&]+)/i)[1]);

console.log(testName);

const component =
    window.__tests[testName] ||
    React.createElement(
        'div',
        null,
        `no component found for test "${testName}"`
    );

ReactDOM.render(component, document.getElementById('main'));
