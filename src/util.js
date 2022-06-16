import * as hash from 'object-hash';

export function isObjectEmpty(obj) {
    if (!obj) return false;
    return !(typeof obj == 'object' && Object.keys(obj).length === 0);
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
