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
    const wrapper =
        document.getElementById('main') || document.createElement('div');
    wrapper.style.setProperty('display', 'grid');
    wrapper.style.setProperty('grid-template-columns', '300px auto');
    wrapper.style.setProperty('grid-gap', '1em');
    wrapper.style.setProperty('max-height', '100vh');
    wrapper.style.setProperty('padding', '.75em');

    // frame to render the test preview
    const container = document.createElement('div');
    container.style.setProperty('position', 'relative');
    container.style.setProperty('overflow', 'auto');

    // show a list of all tests, only when search is empty
    const list = document.createElement('ul');
    list.style.setProperty('margin', '0');
    list.style.setProperty('padding', '0');
    list.style.setProperty('display', 'grid');
    list.style.setProperty('grid-gap', '.32em');
    list.style.setProperty('overflow-x', 'auto');

    const applyTest = ({ path, reactNode }, position = 0, result = {}) => {
        const pathEntry = path[position];

        if (!result[pathEntry] && position < path.length) {
            result[pathEntry] = {};
        }

        if (position < path.length) {
            result[pathEntry] = Object.assign(
                {},
                result[pathEntry],
                applyTest({ path, reactNode }, position + 1, result[pathEntry])
            );

            return result;
        }

        return { __reactNode: reactNode };
    };

    const detailsBlockEntries = (element, values) => {
        Object.entries(values)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(createDetailsBlock)
            .forEach(entry => element.appendChild(entry));
    };

    const createDetailsBlock = ([key, values]) => {
        let details;
        if (!values.__reactNode) {
            details = document.createElement('details');
            details.style.setProperty('padding-left', '1em');
            details.open = true;
            const summary = document.createElement('summary');
            summary.style.setProperty('margin-left', '-1em');
            summary.textContent = key;
            details.appendChild(summary);
            detailsBlockEntries(details, values);
        } else {
            const a = document.createElement('a');
            a.style.setProperty('display', 'block');
            a.style.setProperty('padding', '.1em');

            const url = `${document.location.protocol}//${
                document.location.hostname
            }:${document.location.port}?testPreview=${encodeURIComponent(key)}`;

            a.href = url;

            a.onclick = e => {
                e.stopPropagation();
                window.history.pushState({}, key, url);
                ReactDOM.render(values.__reactNode, container);
                return false;
            };

            a.onmouseenter = e => {
                e.target.style.setProperty('background-color', '#ddd');
            };
            a.onmouseleave = e => {
                e.target.style.removeProperty('background-color');
            };
            a.text = key;

            if (key === currentTest) {
                ReactDOM.render(values.__reactNode, container);
            }
            details = a;
        }
        return details;
    };

    // build an object to easily create a hierarchical structure
    const tests = Object.entries(__tests)
        .map(([, t]) => t)
        .reduce((acc, { path, reactNode }, i, tests) => {
            return applyTest({ path, reactNode }, 0, acc);
        }, {});

    const detailsBlock = document.createElement('div');
    detailsBlockEntries(detailsBlock, tests);

    wrapper.appendChild(detailsBlock);
    wrapper.appendChild(container);
    document.body.appendChild(wrapper);
}
