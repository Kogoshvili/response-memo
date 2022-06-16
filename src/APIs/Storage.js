class Storage {
    static async get(id = null) {
        const data = await chrome.storage.local.get(id);
        return Object.values(data).length === 1 ? data[id] : data;
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
