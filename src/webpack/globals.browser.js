import { format } from 'util';
import pretty from 'pretty-format';

// some snippet of the code inspired/copied by https://github.com/facebook/jest/blob/master/packages/jest-each/src/bind.js

if (!window.Proxy)
    throw new Error('The environment needs to support window.Proxy!');

const makeShrugger = () => {
    const functionMock = () => {};
    return new Proxy(functionMock, {
        apply: () => makeShrugger(), // if called as function
        get: (target, name) => {
            // if trying to get property
            if (name in target) {
                return target[name];
            }
            return makeShrugger();
        },
    });
};

// ¯\_(ツ)_/¯ .. allows you to call anything on him and just ignores it
const shrugger = makeShrugger();
window.jest = shrugger;
window.page = shrugger;
window.expect = shrugger;

const notImplementedYet = name => () => {
    throw new Error(`${name} is not supported yet in jest-puppeteer-react`);
};

window.beforeAll = notImplementedYet('beforeAll');
window.afterAll = notImplementedYet('afterAll');
window.beforeEach = notImplementedYet('beforeEach');
window.afterEach = notImplementedYet('afterEach');

window.__path = []; // current test path
window.__tests = {}; // 'Button should render': <button>hi</button>

const SUPPORTED_PLACEHOLDERS = /%[sdifjoOp%]/g;
const PRETTY_PLACEHOLDER = '%p';

const applyRestParams = (params, test) => {
    // if (params.length < test.length) return done => test(...params, done);

    return () => test(...params);
};

const getPrettyIndexes = placeholders =>
    placeholders.reduce(
        (indexes, placeholder, index) =>
            placeholder === PRETTY_PLACEHOLDER
                ? indexes.concat(index)
                : indexes,
        []
    );

const arrayFormat = (title, ...args) => {
    const placeholders = title.match(SUPPORTED_PLACEHOLDERS) || [];
    const prettyIndexes = getPrettyIndexes(placeholders);

    const { title: prettyTitle, args: remainingArgs } = args.reduce(
        (acc, arg, index) => {
            if (prettyIndexes.indexOf(index) !== -1) {
                return {
                    args: acc.args,
                    title: acc.title.replace(
                        PRETTY_PLACEHOLDER,
                        pretty(arg, { maxDepth: 1, min: true })
                    ),
                };
            }

            return {
                args: acc.args.concat([arg]),
                title: acc.title,
            };
        },
        { args: [], title }
    );

    return format(
        prettyTitle,
        ...remainingArgs.slice(0, placeholders.length - prettyIndexes.length)
    );
};

const each = cb => (...args) => {
    return (title, testFun) => {
        const table = args[0].every(Array.isArray)
            ? args[0]
            : args[0].map(entry => [entry]);
        return table.forEach(row =>
            cb(arrayFormat(title, ...row), applyRestParams(row, testFun))
        );
    };
};

window.describe = (name, fun) => {
    window.__path.push(name);
    // console.log('describe', window.__path);
    fun();
    window.__path.pop();
};
window.describe.each = each(window.describe);
window.describe.only = window.describe;
window.describe.skip = () => {};

window.test = (name, fun) => {
    window.__path.push(name);
    // console.log('test', window.__path);
    fun();
    window.__path.pop();
};
window.test.each = each(window.test);
window.test.only = window.test;
window.test.skip = () => {};

window.it = window.test;
