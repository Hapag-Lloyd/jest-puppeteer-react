import ReactDOM from 'react-dom';
import React from 'react';

const search = window.location.search;
const testName = decodeURIComponent(search.match(/\?test=([^&]+)/i)[1]);

const component =
    window.__tests[testName] ||
    React.createElement(
        'div',
        null,
        `no component found for test "${testName}"`
    );

ReactDOM.render(component, document.getElementById('main'));
