import * as hash from 'object-hash';

export function isObjectEmpty(obj) {
    if (typeof obj != 'object') return false;
    if (obj === null) return false;
    return Object.keys(obj).length === 0;
}

export function makeIdentifier(request) {
    return hash({
        url: request.url,
        method: request.method,
        postData: request.postData
    });
}

export function isResponse(params) {
    return params.responseErrorReason || params.responseStatusCode;
}
