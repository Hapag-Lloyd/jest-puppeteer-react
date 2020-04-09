const { dockerCommand } = require('docker-cli-js');
const debug = require('debug')('jest-puppeteer-react');
const http = require('http');

const options = {
    machineName: null, // use local docker
    currentWorkingDirectory: __dirname, // use current working directory
    echo: false, // echo command output to stdout/stderr
};

const DEFAULT_DOCKER_IMAGE_NAME = 'elbstack/jest-puppeteer-react:3.0.74';

async function getAvailableBrowserURL(containerId) {
    const inspectResponse = await dockerCommand(
        `inspect --format=\\""{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"\\" ${containerId}`,
        options
    );
    const containerIp = inspectResponse.object;

    debug(`Found container IP: ${containerIp}`);
    const urlsToCheck = ['http://0.0.0.0:9222', `http://${containerIp}:9222`];

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

    if (availableUrl) {
        return availableUrl;
    } else {
        throw new Error('could not find available browseURL');
    }
}

async function checkUrlAvailability(host) {
    return new Promise((resolve, reject) => {
        const req = http.get(host, () => {
            req.abort();
            resolve();
        });
        req.setTimeout(500);
        req.on('error', (e) => {
            req.abort();
            reject(e);
        });
        req.on('timeout', (e) => {
            req.abort();
            reject(e);
        });
    });
}

async function getRunningContainerIds(dockerImageName) {
    const { containerList } = await dockerCommand('ps', options);

    debug('getRunningContainerIds', { containerList });

    return containerList.filter(({ image }) => image === dockerImageName).map((container) => container['container id']);
}

/**
 * @returns {Promise<string>} resolves to the browserURL of the started chrome instance
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

    // wait a moment for chrome
    await new Promise(resolve => setTimeout(resolve, 500));

    let retriesLeft = 10;
    let browserURL = null;
    while (!browserURL) {
        try {
            browserURL = await getAvailableBrowserURL(containerId);
        } catch (e) {
            if (retriesLeft > 0) {
                retriesLeft--;
                debug('waiting 5 seconds for chrome');
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                throw e;
            }
        }
    }

    debug(`Found browserURL: ${browserURL}`);

    // when running container with chrome inside another container we haven't access to 0.0.0.0:9222
    // so we have to try to access 0.0.0.0:9222 and <container IP>:9222 to found valid one
    return browserURL;
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
