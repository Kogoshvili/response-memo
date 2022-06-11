const button = document.getElementById("start");
button.onclick = start;

const fulfilledResponses = new Map();
let debuggee;

function inCached(request) {
    for (const [key, value] of fulfilledResponses) {
        if (key.url === request.url) {
            if (key.method === request.method) {
                if (_.isEqual(key.body, request.body)) {
                    return true;
                }

                return false;
            }

            return false;
        }

        return false;
    }
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
    for (const [key, value] of fulfilledResponses) {
        if (key.url === request.url) {
            if (key.method === request.method) {
                if (_.isEqual(key.body, request.body)) {
                    return value;
                }

                continue;
            }

            continue;
        }

        continue;
    }
}

async function start() {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    debuggee = { tabId: tabs[0].id };

    await chrome.debugger.attach(debuggee, '1.1');
    console.log('Attached to debugger');
    await chrome.debugger.sendCommand(debuggee, 'Fetch.enable', { patterns: [{ requestStage: 'Request' }, { requestStage: 'Response' }] });

    chrome.debugger.onEvent.addListener(listener);
}

function listener(source, method, params) {
    if (source.tabId == debuggee.tabId && method == 'Fetch.requestPaused') {
        if (params.responseErrorReason || params.responseStatusCode) {
            console.log('Response')
            handleResponse(params)
        } else {
            console.log('Request')
            handleRequest(params);
        }
    }
}

async function handleResponse(params) {
    const responseBody = await chrome.debugger.sendCommand(debuggee, 'Fetch.getResponseBody', { requestId: params.requestId });
    inCached(params.request) ? console.log('Cached') : cacheResponse(params.request, {
        responseStatusCode: params.responseStatusCode,
        responseHeaders: params.responseHeaders,
        body: responseBody.body
    });
}

async function handleRequest(params) {
    if (!inCached(params.request)) {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueRequest', { requestId: params.requestId });
    } else {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.fulfillRequest', { requestId: params.requestId,  ...getCachedResponse(params.request) });
    }
}
