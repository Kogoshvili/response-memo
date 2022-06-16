import { Storage, Fetch, Debugger, ResponsesStorage, Runtime } from './APIs';
import { isResponse } from './util';

let debuggee;

async function getDebuggee() {
    if (!debuggee) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        debuggee = { tabId: tabs[0].id };
    }

    return debuggee;
}

async function manualMode(value) {
    return await Storage.set('manual', !!value);
}

Runtime.addMessageListener(
    (request, _sender, _sendResponse) => {
        if (request.type === 'function') {
            switch (request.function) {
            case 'start':
                start();
                break;
            case 'stop':
                stop();
                break;
            case 'clear':
                clear();
                break;
            case 'respond':
                respond(...request.args);
                break;
            default:
                console.log('Unknown function');
                break;
            }
        }
    }
);

async function initialize() {
    const debuggee = await getDebuggee();
    new Fetch(debuggee);
    new Debugger(debuggee);
    await manualMode(false);
}

async function start() {
    await initialize();
    const debuggee = await getDebuggee();
    await Debugger.attach(debuggee);
    console.log('Debugger to attached');
    await Fetch.enable({ patterns: [{ requestStage: 'Request' }, { requestStage: 'Response' }] });
    console.log('Fetch enabled');
    Debugger.addEventListener(listener);
    console.log('Listener added');
}

async function stop() {
    await Debugger.detach();
    console.log('Debugger from detached');
    await Fetch.disable();
    console.log('Fetch disabled');
}

async function clear() {
    await Storage.clear();
    console.log('Cleared');
}

function listener(params) {
    if (isResponse(params)) {
        console.log('Response');
        handleResponse(params);
    } else {
        console.log('Request');
        handleRequest(params);
    }
}

async function handleResponse(params) {
    await Runtime.sendMessage({ requestId: params.requestId });
    const isCached = await ResponsesStorage.isCached(params.request);
    if (isCached) {
        const response = await ResponsesStorage.getCached(params.request);
        await Fetch.fulfillRequest(params.requestId, response);
    } else {
        const manual = await isManual();
        if (!manual) { // if manual respond function will be manually called to fulfill request
            const responseBody = await Fetch.getResponseBody(params.requestId);
            ResponsesStorage.cache(params.request, {
                responseStatusCode: params.responseStatusCode,
                responseHeaders: params.responseHeaders,
                body: responseBody.body
            });
            await Fetch.continueResponse(params.requestId);
        }
    }
}

async function handleRequest(params) {
    const isCached = await ResponsesStorage.isCached(params.request);
    if (isCached) {
        await Fetch.continueRequest(params.requestId, { url: `https://example.com/?url=${params.request.url}` });
    } else {
        await Fetch.continueRequest(params.requestId);
    }
}

async function respond(requestId, responseId) {
    const response = await Storage.get(responseId);
    await Fetch.fulfillRequest(requestId, response);
}

async function isManual() {
    return await Storage.get('manual');
}
