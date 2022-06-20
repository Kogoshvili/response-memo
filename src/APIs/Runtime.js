class Runtime {
    static addMessageListener(listener) {
        chrome.runtime.onMessage.addListener(listener);
    }

    static async sendMessage(message) {
        await chrome.runtime.sendMessage(message);
    }

    static async invokeFunction(functionName, args = {}) {
        await this.sendMessage({
            type: 'function',
            function: functionName,
            args
        });
    }

    static functionInvoker() {}
}

export default Runtime;
