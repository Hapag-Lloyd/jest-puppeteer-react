const dockerCLI = require('docker-cli-js');
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
        exec(`docker logs ${containerId}`, (err, stdout, stderr) => {
            if (err) {
                return reject(err);
            }

            // "DevTools listening on ws://0.0.0.0:9222/devtools/browser/3fa3f446-3b92-4ddc-9ae4-ef1d6a65c3b0"
            const results = /DevTools\slistening\son\s(ws:\/\/0\.0\.0\.0:9222\/devtools\/browser\/.*)/m.exec(
                stderr
            );

            if (results.length < 1) {
                console.log(stderr);
                return reject(
                    new Error(
                        'could not find DevTools Websocket in startup logs'
                    )
                );
            }

            resolve(results[1]);
        });
    });

/**
 * @returns {Promise<*>} resolves to the websocket url of the started chrome instance
 */
async function start() {
    // console.log('docker build');
    const data = await docker.command('build -t jest-puppeteer-react .');
    // console.log(data);

    // console.log('docker run');
    const data2 = await docker.command(
        'run -p 9222:9222 -d jest-puppeteer-react'
    );
    // console.log(data2);

    const ws = await getChromeWebSocket(data2.containerId);

    // console.log(`Found Websocket: ${ws}`);

    return ws;
}

async function stop() {
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
            // console.log(result);
        }
    } else {
        // console.log('no containers to stop');
    }
}

module.exports.start = start;
module.exports.stop = stop;
