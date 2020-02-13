const { dockerCommand } = require('docker-cli-js');
const debug = require('debug')('jest-puppeteer-react');
const { exec } = require('child_process');
const http = require('http');

const options = {
    machineName: null, // use local docker
    currentWorkingDirectory: __dirname, // use current working directory
    echo: false, // echo command output to stdout/stderr
};

const DEFAULT_DOCKER_IMAGE_NAME = 'elbstack/jest-puppeteer-react:3.0.74';

const getChromeWebSocket = containerId =>
    new Promise((resolve, reject) => {
        // we have to do this because on mac the logs end up on stderr (which docker-cli-js ignores)
        debug('getting Chrome DevTools WebSocket from docker logs');

        const maxBuffer = 1024 * 1024 * 10; // 10 MB
        exec(`docker logs ${containerId}`, { maxBuffer }, (err, stdout, stderr) => {
            if (err) {
                return reject(err);
            }

            // "DevTools listening on ws://0.0.0.0:9222/devtools/browser/3fa3f446-3b92-4ddc-9ae4-ef1d6a65c3b0"
            const results = /DevTools\slistening\son\s(ws:\/\/0\.0\.0\.0:9222\/devtools\/browser\/.*)/m.exec(stderr);

            const results2 = /DevTools\slistening\son\s(ws:\/\/0\.0\.0\.0:9222\/devtools\/browser\/.*)/m.exec(stdout);

            if (!results || results.length < 1) {
                if (results2 && results2.length > 0) {
                    debug('found devtools link on stdout: ' + results2[1]);
                    return resolve(results2[1]);
                } else {
                    console.log(stdout);
                    console.log(stderr);
                    return reject(new Error('could not find DevTools Websocket in startup logs'));
                }
            }

            debug('found devtools link on stderr: ' + results[1]);
            resolve(results[1]);
        });
    });

async function getAvailableChromeWebSocket(ws, containerId) {
    const inspectResponse = await dockerCommand(
        `inspect --format=\\""{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"\\" ${containerId}`,
        options
    );
    const containerIp = inspectResponse.object;

    debug(`Found container IP: ${containerIp}`);

    const basicUrl = ws.match(/0\.0\.0\.0:\d+/)[0];
    const urlsToCheck = [basicUrl, basicUrl.replace('0.0.0.0', containerIp)];

    let availableUrl;
    for (let i = 0; i < urlsToCheck.length; i++) {
        const urlToCheck = urlsToCheck[i];
        try {
            await checkUrlAvailability(urlToCheck);
            debug(`url available: ${urlToCheck}`);
            availableUrl = urlToCheck;
            break;
        } catch (e) {
            debug(`url unavailable: ${urlToCheck}`);
        }
    }

    debug(`Found available Websocket at ${availableUrl}`);

    // fallback to original ws if we can't find any available url
    return availableUrl ? ws.replace(basicUrl, availableUrl) : ws;
}

async function checkUrlAvailability(host) {
    const chunks = host.split(':');
    return new Promise((resolve, reject) => {
        const req = http.get(
            {
                hostname: chunks[0],
                port: chunks[1],
                timeout: 100,
            },
            resolve
        );
        req.setTimeout(100);
        req.on('error', reject);
        req.on('timeout', reject);
    });
}

async function getRunningContainerIds(dockerImageName) {
    const { containerList } = await dockerCommand('ps', options);

    debug('getRunningContainerIds', { containerList });

    return containerList.filter(({ image }) => image === dockerImageName).map(container => container['container id']);
}

/**
 * @returns {Promise<*>} resolves to the websocket url of the started chrome instance
 */
async function start(config) {
    const dockerImageName = config.dockerImageName || DEFAULT_DOCKER_IMAGE_NAME;
    const customEntryPoint = config.dockerEntrypoint ? `--entrypoint=${config.dockerEntrypoint}` : '';
    const customRunOptions = config.dockerRunOptions || '';
    const customCommand = config.dockerCommand || '';

    const containerIds = await getRunningContainerIds(dockerImageName);
    let containerId = null;

    if (containerIds.length > 0) {
        debug('docker container is already running');
        containerId = containerIds[0];
    } else {
        const runCommand = `run -p 9222:9222 ${customEntryPoint} -d ${customRunOptions} ${dockerImageName} ${customCommand}`;
        debug(`executing: docker ${runCommand}`);
        const data2 = await dockerCommand(runCommand, options);
        debug('docker run result:', data2);
        containerId = data2.containerId;
    }

    let retriesLeft = 10;
    let ws = null;
    while (!ws) {
        try {
            ws = await getChromeWebSocket(containerId);
        } catch (e) {
            if (retriesLeft > 0) {
                retriesLeft--;
                debug('waiting 5 seconds for logs');
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                throw e;
            }
        }
    }

    debug(`Found Websocket: ${ws}`);

    // when running container with chrome inside another container we haven't access to 0.0.0.0:9222
    // so we have to try to access 0.0.0.0:9222 and <container IP>:9222 to found valid one
    return await getAvailableChromeWebSocket(ws, containerId);
}

async function stop(config) {
    debug('stopping any running docker containers');
    // check if running
    const dockerImageName = config.dockerImageName || DEFAULT_DOCKER_IMAGE_NAME;
    const ours = await getRunningContainerIds(dockerImageName);

    if (ours.length > 0) {
        console.log(`Stopping ${ours.length} Docker container(s)`);
        for (let i = 0; i < ours.length; i++) {
            const containerId = ours[i];

            const result = await dockerCommand(`stop ${containerId}`, options);
            debug('stopped container with id ' + containerId + ' result:', result);
        }
    } else {
        debug('no containers to stop');
    }
}

module.exports.start = start;
module.exports.stop = stop;
