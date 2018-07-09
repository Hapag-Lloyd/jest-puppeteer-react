import ReactDOM from 'react-dom';
import React from 'react';

const search = window.location.search;

try {
    const testName = decodeURIComponent(search.match(/\?test=([^&]+)/i)[1]);

    const component =
        window.__tests[testName] ||
        React.createElement(
            'div',
            null,
            `no component found for test "${testName}"`
        );

    ReactDOM.render(component, document.getElementById('main'));
} catch (e) {
    // show a list of all tests, only when search is empty
    const fragment = document.createDocumentFragment();
    Object.keys(__tests)
        .sort((a, b) => a.localeCompare(b))
        .map(k => {
            const a = document.createElement('a');
            a.href = `${document.location.protocol}//${
                document.location.hostname
            }:${document.location.port}?test=${encodeURIComponent(k)}`;
            a.text = k;
            return a;
        })
        .forEach(k => {
            fragment.appendChild(k), fragment.appendChild(document.createElement('br'));
        });
    document.body.appendChild(fragment);
}
