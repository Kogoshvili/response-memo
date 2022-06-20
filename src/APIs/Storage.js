class Storage {
    static async get(id = null) {
        return await chrome.storage.local.get(id);
    }

    static async set(id, data) {
        return await chrome.storage.local.set({ [id]: data });
    }

    static async clear() {
        return await chrome.storage.local.clear();
    }

    static addChangedListener(listener) {
        chrome.storage.onChanged.addListener(listener);
    }
}

export default Storage;
