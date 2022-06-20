import { Storage, Fetch, Debugger, ResponsesStorage, Runtime } from './APIs';
import { isResponse } from './util';

let debuggee;
let fetch;
let debug;

async function Debuggee() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return { tabId: tabs[0].id };
}

async function manualMode(value) {
    return await Storage.set('manual', value);
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
    debuggee = await Debuggee();
    fetch = new Fetch(debuggee);
    debug = new Debugger(debuggee);
    await manualMode(false);
    console.log('Initialized');
}

async function start() {
    await initialize();
    await debug.attach();
    console.log('Debugger to attached');
    await fetch.enable({ patterns: [{ requestStage: 'Request' }, { requestStage: 'Response' }] });
    console.log('Fetch enabled');
    debug.addEventListener(listener);
    console.log('Listener added');
}

async function stop() {
    await debug.detach();
    console.log('Debugger from detached');
    await fetch.disable();
    console.log('Fetch disabled');
}

async function clear() {
    await Storage.clear();
    console.log('Cleared');
}

async function listener(params) {
    if (params.resourceType === 'XHR' || params.resourceType === 'Fetch') {
        if (isResponse(params)) {
            console.log('Response');
            handleResponse(params);
        } else {
            console.log('Request');
            handleRequest(params);
        }
    } else {
        console.log('Skip');
        if (isResponse(params)) {
            fetch.continueResponse(params.requestId);
        } else {
            fetch.continueRequest(params.requestId);
        }
    }
}

async function handleResponse(params) {
    const manual = await isManual();
    if (!manual) { // if manual respond function will be manually called to fulfill request
        const isCached = await ResponsesStorage.isCached(params.request);
        if (isCached) {
            const response = await ResponsesStorage.getCached(params.request);
            console.log('Responding with Cached', response);
            await fetch.fulfillRequest(params.requestId, response);
        } else {
            const responseBody = await fetch.getResponseBody(params.requestId);
            console.log('Caching response');
            await ResponsesStorage.cache(
                params.request,
                params.responseStatusCode,
                params.responseHeaders,
                responseBody.body
            );
            await fetch.continueResponse(params.requestId);
        }
    } else {
        await Runtime.sendMessage({ requestId: params.requestId });
    }
}

async function handleRequest(params) {
    const isCached = await ResponsesStorage.isCached(params.request);
    const manual = await isManual();

    if (isCached || manual) {
        console.log('Request is cached');
        await fetch.continueRequest(params.requestId, { url: `https://example.com/?url=${params.request.url}` });
    } else {
        console.log('Request is not cached');
        await fetch.continueRequest(params.requestId);
    }
}

async function respond(requestId, responseId) {
    const response = await ResponsesStorage.getById(responseId);
    console.log('Responding with', response);
    await fetch.fulfillRequest(requestId, response);
}

async function isManual() {
    const state = await Storage.get('manual');
    return state['manual'];
}
