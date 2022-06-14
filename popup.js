const button = document.getElementById("start");
button.onclick = start;

const clearButton = document.getElementById("clear");
clearButton.onclick = () => {
    chrome.storage.local.clear();
}

let debuggee;

function identifier(request) {
    return JSON.stringify(
        {
            url: request.url,
            method: request.method,
            postData: request.postData
        }
    );
}

async function isCached(request) {
    return !_.isEmpty(await getCachedResponse(request));;
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
    console.log(result[identifier(request)]);
    if (_.isEmpty(result[identifier(request)])) {
        let params = (new URL(request.url)).searchParams;
        let url = params.get('url');
        result = await chrome.storage.local.get([identifier({...request, url})]);
    }

    return Object.values(result)[0];
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
    } else if (await isCached(params.request)) {
        const res = await getCachedResponse(params.request);
        await chrome.debugger.sendCommand(debuggee, 'Fetch.fulfillRequest', { requestId: params.requestId,  ...res });
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
    if (params.resourceType !== 'XHR' || ! (await isCached(params.request))) {
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueRequest', { requestId: params.requestId });
    } else {
        const url = new URL(params.request.url)
        await chrome.debugger.sendCommand(debuggee, 'Fetch.continueRequest', { requestId: params.requestId, url: `https://example.com/?url=${params.request.url}`});
    }
}
