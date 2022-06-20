import Storage from './Storage';
import { makeIdentifier } from '../util';

// add event listener to responses and cache them in object?
class ResponsesStorage extends Storage {
    static #storageName = 'RESPONSES';

    static async getById(id) {
        const storage = await this.get(this.#storageName);
        return storage[this.#storageName]?.[id];
    }

    static async cache(request, responseCode, responseHeaders, body) {
        const data = await this.get(this.#storageName);
        return await this.set(this.#storageName, {
            ...data[this.#storageName],
            [makeIdentifier(request)]: {
                responseCode,
                responseHeaders,
                body
            }
        });
    }

    static async getCached(request = {}) {
        const storage = await this.get(this.#storageName);
        let result = storage[this.#storageName];

        if (request.url) {
            result = storage[this.#storageName]?.[makeIdentifier(request)];

            if (!result && request.url) {
                const urlParam = (new URL(request.url)).searchParams.get('url');
                result = storage[this.#storageName]?.[makeIdentifier({ ...request, url: urlParam })];
            }
        }

        return result;
    }

    static async isCached(request) {
        const result = await this.getCached(request);
        return !!result;
    }
}

export default ResponsesStorage;
