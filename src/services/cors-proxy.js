/**
 * CORS proxy for LLM API calls.
 * Gemini supports direct browser calls; Claude/OpenAI need a proxy.
 */

const DEFAULT_PROXY = 'https://corsproxy.io/?';

let _proxyBase = DEFAULT_PROXY;

export function setCorsProxy(url) {
    _proxyBase = url;
}

export function getCorsProxy() {
    return _proxyBase;
}

/**
 * Wrap a URL with the CORS proxy if needed.
 * @param {string} url - The target API URL
 * @param {boolean} needsProxy - Whether this provider needs CORS proxy
 */
export function wrapWithProxy(url, needsProxy = true) {
    if (!needsProxy) return url;
    return `${_proxyBase}${encodeURIComponent(url)}`;
}
