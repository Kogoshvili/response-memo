class Fetch {
    constructor(debuggee) {
        this.debuggee = debuggee;
    }

    async enable(patterns) {
        return await chrome.debugger.sendCommand(this.debuggee, 'Fetch.enable', patterns);
    }

    async disable() {
        return await chrome.debugger.sendCommand(this.debuggee, 'Fetch.disable');
    }

    async continueResponse(requestId) {
        return await chrome.debugger.sendCommand(this.debuggee, 'Fetch.continueResponse', { requestId });
    }

    async fulfillRequest(requestId, response) {
        return await chrome.debugger.sendCommand(this.debuggee, 'Fetch.fulfillRequest', { requestId,  ...response });
    }

    async getResponseBody(requestId) {
        return await chrome.debugger.sendCommand(this.debuggee, 'Fetch.getResponseBody', { requestId });
    }

    async continueRequest(requestId, params = {}) {
        return await chrome.debugger.sendCommand(this.debuggee, 'Fetch.continueRequest', { requestId, ...params });
    }
}

export default Fetch;
