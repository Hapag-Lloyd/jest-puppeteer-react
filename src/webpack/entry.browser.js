import ReactDOM from 'react-dom';
import React from 'react';

const search = window.location.search;
const urlParams = new URLSearchParams(window.location.search);
let currentTest = urlParams.get('testPreview') || urlParams.get('test');

if (urlParams.has('test')) {
    const testName = decodeURIComponent(search.match(/\?test=([^&]+)/i)[1]);

    const component =
        (window.__tests[testName] || {}).reactNode || React.createElement('div', null, `no component found for test "${testName}"`);

    ReactDOM.render(component, document.getElementById('main'));
} else {
    const wrapper = document.getElementById('main') || document.createElement('div');
    wrapper.style.setProperty('display', 'grid');
    wrapper.style.setProperty('grid-template-columns', '300px auto');
    wrapper.style.setProperty('grid-gap', '.16em');
    wrapper.style.setProperty('height', '100vh');
    wrapper.style.setProperty('background-color', '#808080');

    const containerWrapper = document.createElement('div');
    // frame to render the test preview
    const container = document.createElement('iframe');
    container.style.setProperty('border', 'none');
    container.style.setProperty('background-color', document.body.style.backgroundColor || 'white');

    containerWrapper.appendChild(container);

    const applyTest = ({ path, reactNode, viewport }, position = 0, result = {}) => {
        const pathEntry = path[position];

        if (!result[pathEntry] && position < path.length) {
            result[pathEntry] = {};
        }

        if (position < path.length) {
            result[pathEntry] = Object.assign(
                {},
                result[pathEntry],
                applyTest({ path, reactNode, viewport }, position + 1, result[pathEntry])
            );

            return result;
        }

        return {
            __reactNode: reactNode,
            viewport,
            description: path.join(' '),
        };
    };

    const updateContainer = (reactNode, viewport, title) => {
        container.style.setProperty('height', viewport.height + 'px');
        container.style.setProperty('width', viewport.width + 'px');
        container.src = [location.origin, '?test=', title].join('');
        document.title = 'Preview: ' + title;
    };

    const detailsBlockEntries = (element, values) => {
        Object.entries(values)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(createDetailsBlock)
            .forEach((entry) => element.appendChild(entry));
    };

    const createDetailsBlock = ([key, values]) => {
        let details;
        if (!values.__reactNode) {
            details = document.createElement('details');
            details.style.setProperty('padding-left', '1em');
            details.style.setProperty('margin', '.32em');
            details.open = true;
            const summary = document.createElement('summary');
            summary.style.setProperty('margin-left', '-1em');
            summary.textContent = key;
            details.appendChild(summary);
            detailsBlockEntries(details, values);
        } else {
            const description = values.description;
            const a = document.createElement('a');
            a.style.setProperty('display', 'block');
            a.style.setProperty('padding', '.1em');

            const url = `${document.location.protocol}//${document.location.hostname}:${
                document.location.port
            }?testPreview=${encodeURIComponent(description)}`;

            a.href = url;

            a.onclick = (e) => {
                e.stopPropagation();
                window.history.pushState({}, description, url);
                updateContainer(values.__reactNode, values.viewport, description);
                return false;
            };

            a.onmouseenter = (e) => {
                e.target.style.setProperty('background-color', '#ddd');
            };
            a.onmouseleave = (e) => {
                e.target.style.removeProperty('background-color');
            };
            a.text = key;

            if (description === currentTest) {
                updateContainer(values.__reactNode, values.viewport, description);
            }
            details = a;
        }
        return details;
    };

    // build an object to easily create a hierarchical structure
    const tests = Object.entries(__tests)
        .map(([, t]) => t)
        .reduce((acc, { path, reactNode, viewport }, i, tests) => {
            return applyTest({ path, reactNode, viewport }, 0, acc);
        }, {});

    const detailsBlock = document.createElement('div');
    detailsBlock.style.setProperty('overflow', 'auto');
    detailsBlock.style.setProperty('position', 'relative');
    detailsBlock.style.setProperty('max-height', '100%');
    detailsBlock.style.setProperty('background-color', 'white');
    detailsBlockEntries(detailsBlock, tests);

    wrapper.appendChild(detailsBlock);
    wrapper.appendChild(containerWrapper);
    document.body.appendChild(wrapper);
}
