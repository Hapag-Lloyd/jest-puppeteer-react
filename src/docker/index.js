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

const getChromeWebSocket = containerId =>
    new Promise((resolve, reject) => {
        // we have to do this because the logs end up on stderr (which docker-cli-js ignores)
        debug('getting Chrome DevTools WebSocket from docker logs');

        exec(`docker logs ${containerId}`, (err, stdout, stderr) => {
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
                if (results && results2.length > 0) {
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
        });
    });

/**
 * @returns {Promise<*>} resolves to the websocket url of the started chrome instance
 */
async function start() {
    debug('docker run');
    const data2 = await docker.command(
        'run -p 9222:9222 -d amrtns/jest-puppeteer-react'
    );
    debug('docker run result:', data2);

    // wait 5 seconds to make sure the logs are available
    debug('waiting 5 seconds for logs');
    await new Promise(resolve => setTimeout(resolve), 5000);

    const ws = await getChromeWebSocket(data2.containerId);

    debug(`Found Websocket: ${ws}`);

    return ws;
}

async function stop() {
    debug('stopping any running docker containers');
    // check if running
    const { containerList } = await docker.command('ps');

    const ours = containerList.filter(
        ({ image }) => image === 'jest-puppeteer-react'
    );

    if (ours.length > 0) {
        console.log(`Stopping ${ours.length} Docker container(s)`);
        for (let i = 0; i < ours.length; i++) {
            const containerId = ours[i]['container id'];

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
