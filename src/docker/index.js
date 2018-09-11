const dockerCLI = require('docker-cli-js');
const debug = require('debug')('jest-puppeteer-react');
const DockerOptions = dockerCLI.Options;
const Docker = dockerCLI.Docker;

const { exec } = require('child_process');

const options = new DockerOptions(
    /* machinename */ undefined, // we use docker locally not in vm
    /* currentWorkingDirectory */ __dirname
);

const docker = new Docker(options);

// const DOCKER_IMAGE_NAME = 'amrtns/jest-puppeteer-react';
const DOCKER_IMAGE_NAME = 'elbstack/jest-puppeteer-react:3.0.0';

const getChromeWebSocket = containerId =>
    new Promise((resolve, reject) => {
        // we have to do this because on mac the logs end up on stderr (which docker-cli-js ignores)
        debug('getting Chrome DevTools WebSocket from docker logs');

        const maxBuffer = 1024 * 1024 * 10; // 10 MB
        exec(
            `docker logs ${containerId}`,
            { maxBuffer },
            (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }

                // "DevTools listening on ws://0.0.0.0:9222/devtools/browser/3fa3f446-3b92-4ddc-9ae4-ef1d6a65c3b0"
                const results = /DevTools\slistening\son\s(ws:\/\/0\.0\.0\.0:9222\/devtools\/browser\/.*)/m.exec(
                    stderr
                );

                const results2 = /DevTools\slistening\son\s(ws:\/\/0\.0\.0\.0:9222\/devtools\/browser\/.*)/m.exec(
                    stdout
                );

                if (!results || results.length < 1) {
                    if (results2 && results2.length > 0) {
                        debug('found devtools link on stdout: ' + results2[1]);
                        return resolve(results2[1]);
                    } else {
                        console.log(stdout);
                        console.log(stderr);
                        return reject(
                            new Error(
                                'could not find DevTools Websocket in startup logs'
                            )
                        );
                    }
                }

                debug('found devtools link on stderr: ' + results[1]);
                resolve(results[1]);
            }
        );
    });

async function getRunningContainerIds() {
    const { containerList } = await docker.command('ps');

    debug('getRunningContainerIds', { containerList });

    return containerList
        .filter(({ image }) => image === DOCKER_IMAGE_NAME)
        .map(container => container['container id']);
}

/**
 * @returns {Promise<*>} resolves to the websocket url of the started chrome instance
 */
async function start() {
    const containerIds = await getRunningContainerIds();
    let containerId = null;

    if (containerIds.length > 0) {
        debug('docker container is already running');
        containerId = containerIds[0];
    } else {
        debug('docker run');
        const data2 = await docker.command(
            `run -p 9222:9222 -d ${DOCKER_IMAGE_NAME}`
        );
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

    return ws;
}

async function stop() {
    debug('stopping any running docker containers');
    // check if running
    const ours = await getRunningContainerIds();

    if (ours.length > 0) {
        console.log(`Stopping ${ours.length} Docker container(s)`);
        for (let i = 0; i < ours.length; i++) {
            const containerId = ours[i];

            const result = await docker.command(`stop ${containerId}`);
            debug(
                'stopped container with id ' + containerId + ' result:',
                result
            );
        }
    } else {
        debug('no containers to stop');
    }
}

module.exports.start = start;
module.exports.stop = stop;
