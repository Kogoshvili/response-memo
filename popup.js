const button = document.getElementById("start");
button.onclick = start;

/*
hash
quick compare?
*/

const fulfilledResponses = new Map();
let debuggee;

function isCached(request) {
    let params = (new URL(request.url)).searchParams;
    let url = params.get('url');
    for (const [key, value] of fulfilledResponses) {
        if (key.url === url || key.url === request.url) {
            if (key.method === request.method) {
                if (_.isEqual(key.body, request.body)) {
                    return true;
                }
            }
        }
    }

    return false;
}

function cacheResponse(request, response) {
    fulfilledResponses.set({
        url: request.url,
        method: request.method,
        postData: request.postData
    }, {
        responseCode: response.responseStatusCode,
        responseHeaders: response.responseHeaders,
        body: response.body
    });
}

function getCachedResponse(request) {
    let params = (new URL(request.url)).searchParams;
    let url = params.get('url');
    for (const [key, value] of fulfilledResponses) {
        if (key.url === url || key.url === request.url) {
            if (key.method === request.method) {
                if (_.isEqual(key.body, request.body)) {
                    return value;
                }
            }
        }
    }

    return null;
}

async function start() {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    debuggee = { tabId: tabs[0].id };

    await chrome.debugger.attach(debuggee, '1.1');
    console.log('Attached to debugger');
    await chrome.debugger.sendCommand(debuggee, 'Fetch.enable', { patterns: [{ requestStage: 'Request' }, { requestStage: 'Response' }] });
    console.log('Fetch enabled');

    chrome.debugger.onEvent.addListener(listener);
}

function listener(source, method, params) {
    if (source.tabId == debuggee.tabId && method == 'Fetch.requestPaused') {
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
    } else if (isCached(params.request)) {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.fulfillRequest', { requestId: params.requestId,  ...getCachedResponse(params.request) });
    }else {
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
    if (params.resourceType !== 'XHR' || !isCached(params.request)) {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueRequest', { requestId: params.requestId });
    } else {
        const url = new URL(params.request.url)
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueRequest', { requestId: params.requestId, url: `https://example.com/?url=${params.request.url}`});
    }
}
