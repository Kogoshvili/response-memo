import * as hash from 'object-hash';
import { isObjectEmpty } from './util';

// chrome.action.onClicked.addListener((tab) => {
//     const popup = open('./popup.html', `response-memorizer_${tab.id}`, 'menubar=0,innerWidth=900,innerHeight=800');
// });
let isManual = false;

chrome.runtime.onMessage.addListener(
    (request, _sender, _sendResponse) => {
        if (request.fun === 'start') start();
        if (request.fun === 'clear') clear();
        if (request.fun === 'manual') setMode(request.fun);
        if (request.fun === 'auto') setMode(request.msg);
    }
);

function setMode(mode) {
    isManual = mode === 'manual';
}

function clear() {
    console.log('Clear');
    chrome.storage.local.clear();
}

let debuggee;

function identifier(request) {
    return hash(
        {
            url: request.url,
            method: request.method,
            postData: request.postData
        }
    );
}

async function isCached(request) {
    return !isObjectEmpty(await getCachedResponse(request));
}

function cacheResponse(request, response) {
    chrome.storage.local.set(
        {
            [identifier(request)]: {
                responseCode: response.responseStatusCode,
                responseHeaders: response.responseHeaders,
                body: response.body
            }
        }
    );
}

async function getCachedResponse(request) {
    let result = await chrome.storage.local.get([identifier(request)]);

    if (isObjectEmpty(result[identifier(request)])) {
        const params = (new URL(request.url)).searchParams;
        const url = params.get('url');
        result = await chrome.storage.local.get([identifier({ ...request, url })]);
    }

    result = Object.values(result)[0];

    if (isObjectEmpty(result)) {
        const preselected = (await chrome.storage.local.get('preselected'))?.preselected;
        if (preselected) {
            result = await chrome.storage.local.get(preselected);
            result = Object.values(result)[0];
        }
    }
    console.log(result);
    return result;
}

async function start() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    debuggee = { tabId: tabs[0].id };

    await chrome.debugger.attach(debuggee, '1.1');
    console.log('Attached to debugger');
    await chrome.debugger.sendCommand(debuggee, 'Fetch.enable', { patterns: [{ requestStage: 'Request' }, { requestStage: 'Response' }] });
    console.log('Fetch enabled');

    chrome.debugger.onEvent.addListener(listener);
}

function listener(source, method, params) {
    if (source.tabId === debuggee.tabId && method === 'Fetch.requestPaused') {
        if (params.responseErrorReason || params.responseStatusCode) {
            console.log('Response');
            handleResponse(params);
        } else {
            console.log('Request');
            handleRequest(params);
        }
    }
}

async function handleResponse(params) {
    if (params.resourceType !== 'XHR') {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueResponse', { requestId: params.requestId });
    } else if (await isCached(params.request)) {
        const res = await getCachedResponse(params.request);
        await chrome.debugger.sendCommand(debuggee, 'Fetch.fulfillRequest', { requestId: params.requestId,  ...res });
    } else {
        const responseBody = await chrome.debugger.sendCommand(debuggee, 'Fetch.getResponseBody', { requestId: params.requestId });
        cacheResponse(params.request, {
            responseStatusCode: params.responseStatusCode,
            responseHeaders: params.responseHeaders,
            body: responseBody.body
        });
        await chrome.debugger.sendCommand(debuggee, 'Fetch.fulfillRequest', { requestId: params.requestId, responseCode: params.responseStatusCode });
    }
}

async function handleRequest(params) {
    if (params.resourceType !== 'XHR' || ! (await isCached(params.request))) {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueRequest', { requestId: params.requestId });
    } else {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueRequest', { requestId: params.requestId, url: `https://example.com/?url=${params.request.url}` });
    }
}
