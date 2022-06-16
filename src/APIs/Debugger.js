import Fetch from './Fetch';
import { isResponse } from '../util';

class Debugger {
    #debuggingProtocolVersion = '1.1';
    constructor(debuggee) {
        this.debuggee = debuggee;
    }

    async attach() {
        return await chrome.debugger.attach(this.debuggee, this.#debuggingProtocolVersion);
    }

    async detach() {
        return await chrome.debugger.detach(this.debuggee);
    }

    async addEventListener(listener) {
        chrome.debugger.onEvent.addListener(
            async (source, method, params) => {
                if (source.tabId === this.debuggee.tabId && method === 'Fetch.requestPaused') {
                    if (params.resourceType !== 'XHR') {
                        if (isResponse(params)) {
                            await Fetch.continueResponse(params.requestId);
                        } else {
                            await Fetch.continueRequest(params.requestId);
                        }
                    } else {
                        listener(params);
                    }
                }
            }
        );
    }
}

export default Debugger;
