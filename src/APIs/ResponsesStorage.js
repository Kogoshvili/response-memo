import Storage from './Storage';
import { makeIdentifier } from '../util';

// add event listener to responses and cache them in object?
class ResponsesStorage extends Storage {
    storageName = 'RESPONSES';

    static async cache(request, response) {
        const data = await this.get(this.storageName);
        return await this.set(this.storageName, {
            ...data,
            [makeIdentifier(request)]: {
                responseCode: response.responseStatusCode,
                responseHeaders: response.responseHeaders,
                body: response.body
            }
        });
    }

    static async getCached(request = null) {
        const data = await this.get(this.storageName);
        return data[makeIdentifier(request)] || {};
    }

    static async isCached(request) {
        const result = await this.getCached(request);
        return !!result;
    }
}

export default ResponsesStorage;
