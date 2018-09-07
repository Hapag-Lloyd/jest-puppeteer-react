import ReactDOM from 'react-dom';
import React from 'react';

const search = window.location.search;
const urlParams = new URLSearchParams(window.location.search);
let currentTest = urlParams.get('testPreview') || urlParams.get('test');

if (urlParams.has('test')) {
    const testName = decodeURIComponent(search.match(/\?test=([^&]+)/i)[1]);

    const component =
        (window.__tests[testName] || {}).reactNode ||
        React.createElement(
            'div',
            null,
            `no component found for test "${testName}"`
        );

    ReactDOM.render(component, document.getElementById('main'));
} else {
    const wrapper = document.getElementById('main') || document.createElement('div');
    wrapper.style.setProperty('display', 'grid');
    wrapper.style.setProperty('grid-template-columns', '300px auto');
    wrapper.style.setProperty('grid-gap', '1em');
    wrapper.style.setProperty('height', '100vh');

    // frame to render the test preview
    const container = document.createElement('div');
    container.style.setProperty('position', 'relative');
    container.style.setProperty('overflow', 'auto');

    // show a list of all tests, only when search is empty
    const list = document.createElement('ul');
    list.style.setProperty('margin', '0');
    list.style.setProperty('padding', '20px 0');
    list.style.setProperty('display', 'grid');
    list.style.setProperty('grid-gap', '.32em');
    list.style.setProperty('overflow-x', 'auto');

    Object.keys(__tests)
        .sort((a, b) => a.localeCompare(b))
        .map(k => {
            const a = document.createElement('a');
            a.style.setProperty('display', 'block');

            const url = `${document.location.protocol}//${
                document.location.hostname
            }:${document.location.port}?testPreview=${encodeURIComponent(k)}`;

            a.href = url;

            a.onclick = e => {
                e.stopPropagation();
                window.history.pushState({}, k, url);
                ReactDOM.render(__tests[k].reactNode, container);
                return false;
            };

            a.onmouseenter = e => {
                e.target.style.setProperty('background-color', '#ddd');
            };
            a.onmouseleave = e => {
                e.target.style.removeProperty('background-color');
            };
            a.text = k;

            if (k === currentTest) {
                ReactDOM.render(__tests[k].reactNode, container);
            }

            const item = document.createElement('li');
            item.style.setProperty('margin', '0 0 5px 10px');
            item.appendChild(a);
            return item;
        })
        .forEach(k => list.appendChild(k));
    wrapper.appendChild(list);
    wrapper.appendChild(container);
    document.body.appendChild(wrapper);
}
