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

window.describe = (name, fun) => {
    window.__path.push(name);
    console.log('describe', window.__path);
    fun();
    window.__path.pop();
};
window.describe.only = window.describe;
window.describe.skip = () => {};

window.test = (name, fun) => {
    window.__path.push(name);
    console.log('test', window.__path);
    fun();
    window.__path.pop();
};
window.test.only = window.test;
window.test.skip = () => {};
