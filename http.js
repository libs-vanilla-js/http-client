/**
 * @file http.js
 * @description This library is a simple wrapper around the Fetch API.
 *
 * @version 1.0.0
 * @license GPLv3
 * @author Hylke Hellinga
 */

/**
 * The HTTPClient class is a wrapper around the Fetch API, providing methods for
 * making HTTP requests. It supports GET, POST, PUT, DELETE, PATCH, and HEAD
 * methods, while also managing request headers, body, and response handling.
 */
export default class HTTPClient {
    baseUrl;

     /**
     * Initializes the HTTPClient.
     * @param {string} [baseUrl] - The base URL for all requests. Defaults to the current host's origin if not provided.
     */
    constructor(baseUrl) {
        // Use the provided baseUrl. If it's null or undefined, default to the current window's origin.
        // The check for `typeof window` ensures this doesn't crash in non-browser environments.
        if (baseUrl !== undefined && baseUrl !== null) {
            this.baseUrl = baseUrl;
        } else {
            this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        }
    }

    /**
     * Performs a GET request.
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {HeadersInit} [headers] - Optional headers for the request.
     * @returns {Promise<Response>} The Response object from the fetch call.
     */
    GET(endpoint, headers) {
        return this.request('GET', endpoint, undefined, headers);
    }

    /**
     * Performs a POST request.
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {*} body - The body of the request.
     * @param {HeadersInit} [headers] - Optional headers for the request.
     * @returns {Promise<Response>} The Response object from the fetch call.
     */
    POST(endpoint, body, headers) {
        return this.request('POST', endpoint, body, headers);
    }

    /**
     * Performs a PUT request.
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {*} body - The body of the request.
     * @param {HeadersInit} [headers] - Optional headers for the request.
     * @returns {Promise<Response>} The Response object from the fetch call.
     */
    PUT(endpoint, body, headers) {
        return this.request('PUT', endpoint, body, headers);
    }

    /**
     * Performs a DELETE request.
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {HeadersInit} [headers] - Optional headers for the request.
     * @returns {Promise<Response>} The Response object from the fetch call.
     */
    DELETE(endpoint, headers) {
        return this.request('DELETE', endpoint, undefined, headers);
    }

    /**
     * Performs a PATCH request.
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {*} body - The body of the request.
     * @param {HeadersInit} [headers] - Optional headers for the request.
     * @returns {Promise<Response>} The Response object from the fetch call.
     */
    PATCH(endpoint, body, headers) {
        return this.request('PATCH', endpoint, body, headers);
    }

    /**
     * Performs a HEAD request to retrieve only the headers of a response.
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {HeadersInit} [headers] - Optional headers for the request.
     * @returns {Promise<Response>} The Response object from the fetch call.
     */
    HEAD(endpoint, headers) {
        return this.headRequest('HEAD', endpoint, headers);
    }

    /**
     * Safely gets a header value from a HeadersInit object.
     * @param {HeadersInit} headers - The headers object.
     * @param {string} key - The case-insensitive header key to retrieve.
     * @returns {string | undefined} The header value if found, otherwise undefined.
     */
    getHeader(headers, key) {
        if (headers instanceof Headers) {
            const value = headers.get(key);
            return value !== null ? value : undefined;
        } else if (Array.isArray(headers)) {
            const header = headers.find(([k]) => k.toLowerCase() === key.toLowerCase());
            return header ? header[1] : undefined;
        } else if (typeof headers === 'object' && headers !== null) {
            const headerKey = Object.keys(headers).find(k => k.toLowerCase() === key.toLowerCase());
            return headerKey ? headers[headerKey] : undefined;
        }
        return undefined;
    }

    /**
     * Safely sets a header value in a HeadersInit object.
     * @param {HeadersInit} headers - The headers object.
     * @param {string} key - The header key to set.
     * @param {string} value - The header value to set.
     */
    setHeader(headers, key, value) {
        if (headers instanceof Headers) {
            headers.set(key, value);
        } else if (Array.isArray(headers)) {
            const index = headers.findIndex(([k]) => k.toLowerCase() === key.toLowerCase());
            if (index !== -1) {
                headers[index][1] = value;
            } else {
                headers.push([key, value]);
            }
        } else if (typeof headers === 'object' && headers !== null) {
            headers[key] = value;
        }
    }

    /**
     * Parses the response based on its Content-Type header.
     * @param {Response} response - The fetch API Response object.
     * @returns {Promise<*>} The parsed response in its appropriate type.
     */
    async handleContentType(response) {
        const contentType = response.headers.get('Content-Type');

        if (!contentType) {
            console.warn('No Content-Type header found in response');
            return await response.text();
        }

        switch (true) {
            // JSON data
            case contentType.includes('application/json'):
                return await response.json();

            // Plain text and text-based formats
            case contentType.includes('text/plain'):
            case contentType.includes('text/html'):
            case contentType.includes('text/csv'):
            case contentType.includes('text/markdown'):
            case contentType.includes('application/x-yaml'):
            case contentType.includes('text/yaml'):
                return await response.text();

            // XML data
            case contentType.includes('application/xml'):
            case contentType.includes('text/xml'):
                const xmlText = await response.text();
                return new window.DOMParser().parseFromString(xmlText, 'application/xml');

            // Form data
            case contentType.includes('multipart/form-data'):
                return await response.formData();

            // URL-encoded form data
            case contentType.includes('application/x-www-form-urlencoded'):
                const formText = await response.text();
                return new URLSearchParams(formText);

            // Raw binary data as an ArrayBuffer
            case contentType.includes('application/octet-stream'):
                return await response.arrayBuffer();

            // Office Documents & PDFs
            case contentType.includes('application/pdf'):
            case contentType.includes('application/rtf'):
            case contentType.includes('application/msword'):
            case contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document'):
            case contentType.includes('application/vnd.ms-excel'):
            case contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'):
            case contentType.includes('application/vnd.ms-powerpoint'):
            case contentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation'):
            // Images
            case contentType.includes('image/png'):
            case contentType.includes('image/jpeg'):
            case contentType.includes('image/gif'):
            case contentType.includes('image/webp'):
            case contentType.includes('image/bmp'):
            case contentType.includes('image/svg+xml'):
            // Audio
            case contentType.includes('audio/mpeg'):
            case contentType.includes('audio/wav'):
            case contentType.includes('audio/ogg'):
            case contentType.includes('audio/aac'):
            case contentType.includes('audio/flac'):
            case contentType.includes('audio/webm'):
            // Video
            case contentType.includes('video/mp4'):
            case contentType.includes('video/webm'):
            case contentType.includes('video/ogg'):
            case contentType.includes('video/avi'):
            case contentType.includes('video/mpeg'):
            case contentType.includes('video/quicktime'):
            // Archives
            case contentType.includes('application/zip'):
            case contentType.includes('application/x-7z-compressed'):
            case contentType.includes('application/x-rar-compressed'):
            case contentType.includes('application/x-tar'):
            case contentType.includes('application/gzip'):
                return await response.blob();

            // Default fallback
            default:
                console.warn(`Unhandled content type: ${contentType}`);
                return await response.text();
        }
    }

    /**
     * Handles HTTP status codes by logging appropriate messages.
     * @param {Response} response - The fetch API Response object.
     */
    async handleStatusCode(response) {
        const { status, statusText, url: resourceUrl } = response;

        const statusHandlers = {
            // 1xx Informational
            100: { level: 'info', message: 'Continue: The client should continue with its request.' },
            101: { level: 'info', message: 'Switching Protocols: The server is switching protocols.' },
            102: { level: 'info', message: 'Processing: The server is processing the request, but no response is available yet.' },
            103: { level: 'info', message: 'Early Hints: The server is sending some response headers before the final response.' },
            // 2xx Success
            200: { level: 'info', message: 'OK: The request has succeeded.' },
            201: { level: 'info', message: 'Created: The request has been fulfilled and resulted in a new resource being created.' },
            202: { level: 'info', message: 'Accepted: The request has been accepted for processing, but the processing has not been completed.' },
            203: { level: 'info', message: 'Non-Authoritative Information: The server is returning information that is not from its origin.' },
            204: { level: 'info', message: 'No Content: The server successfully processed the request, but is not returning any content.' },
            205: { level: 'info', message: 'Reset Content: The server successfully processed the request, but requires the client to reset the document view.' },
            206: { level: 'info', message: 'Partial Content: The server is delivering only part of the resource due to a range header sent by the client.' },
            207: { level: 'info', message: 'Multi-Status: The message body contains multiple status codes for different operations.' },
            208: { level: 'info', message: 'Already Reported: The members of a DAV binding have already been enumerated.' },
            226: { level: 'info', message: 'IM Used: The server has fulfilled the request and the response is a representation of the result of one or more instance-manipulations applied to the current instance.' },
            // 3xx Redirection
            300: { level: 'warn', message: 'Multiple Choices: The request has more than one possible response. User-agent or user should choose one of them.' },
            301: { level: 'warn', message: 'Moved Permanently: The URL of the requested resource has been changed permanently.' },
            302: { level: 'warn', message: 'Found: The requested resource has been temporarily moved to a different URI.' },
            303: { level: 'warn', message: 'See Other: The server is redirecting to a different URI.' },
            304: { level: 'info', message: 'Not Modified: The resource has not been modified since the last request.' },
            305: { level: 'warn', message: 'Use Proxy: The requested resource is available only through a proxy.' },
            307: { level: 'warn', message: 'Temporary Redirect: The server is redirecting to a different URI, but the request method should not be changed.' },
            308: { level: 'warn', message: 'Permanent Redirect: The server is redirecting to a different URI, and the request method should not be changed.' },
            // 4xx Client Error
            400: { level: 'error', message: 'Bad Request: The server could not understand the request due to invalid syntax.' },
            401: { level: 'error', message: 'Unauthorized: The client must authenticate itself to get the requested response.' },
            402: { level: 'error', message: 'Payment Required: Reserved for future use.' },
            403: { level: 'error', message: 'Forbidden: The client does not have access rights to the content.' },
            404: { level: 'error', message: 'Not Found: The server cannot find the requested resource.' },
            405: { level: 'error', message: 'Method Not Allowed: The request method is known by the server but has been disabled and cannot be used.' },
            406: { level: 'error', message: 'Not Acceptable: The server cannot produce a response matching the list of acceptable values defined in the request\'s proactive content negotiation headers.' },
            407: { level: 'error', message: 'Proxy Authentication Required: The client must first authenticate itself with the proxy.' },
            408: { level: 'error', message: 'Request Timeout: The server would like to shut down this unused connection.' },
            409: { level: 'error', message: 'Conflict: The request could not be processed because of conflict in the request, such as an edit conflict between multiple simultaneous updates.' },
            410: { level: 'error', message: 'Gone: The requested resource is no longer available at the server and no forwarding address is known.' },
            411: { level: 'error', message: 'Length Required: The server refuses to accept the request without a defined Content-Length.' },
            412: { level: 'error', message: 'Precondition Failed: The server does not meet one of the preconditions that the requester put on the request.' },
            413: { level: 'error', message: 'Payload Too Large: The request is larger than the server is willing or able to process.' },
            414: { level: 'error', message: 'URI Too Long: The URI requested by the client is longer than the server is willing to interpret.' },
            415: { level: 'error', message: 'Unsupported Media Type: The media format of the requested data is not supported by the server.' },
            416: { level: 'error', message: 'Range Not Satisfiable: The range specified by the Range header field in the request cannot be fulfilled.' },
            417: { level: 'error', message: 'Expectation Failed: The server cannot meet the requirements of the Expect header field.' },
            418: { level: 'error', message: 'I\'m a teapot: The server refuses the attempt to brew coffee with a teapot.' },
            421: { level: 'error', message: 'Misdirected Request: The request was directed at a server that is not able to produce a response.' },
            422: { level: 'error', message: 'Unprocessable Entity: The request was well-formed but was unable to be followed due to semantic errors.' },
            423: { level: 'error', message: 'Locked: The resource that is being accessed is locked.' },
            424: { level: 'error', message: 'Failed Dependency: The request failed due to failure of a previous request.' },
            425: { level: 'error', message: 'Too Early: Indicates that the server is unwilling to risk processing a request that might be replayed.' },
            426: { level: 'error', message: 'Upgrade Required: The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol.' },
            428: { level: 'error', message: 'Precondition Required: The origin server requires the request to be conditional.' },
            429: { level: 'error', message: 'Too Many Requests: The user has sent too many requests in a given amount of time.' },
            431: { level: 'error', message: 'Request Header Fields Too Large: The server is unwilling to process the request because its header fields are too large.' },
            451: { level: 'error', message: 'Unavailable For Legal Reasons: The user requested a resource that cannot be legally provided, such as a web page censored by a government.' },
            // 5xx Server Error
            500: { level: 'error', message: 'Internal Server Error: The server has encountered a situation it doesn\'t know how to handle.' },
            501: { level: 'error', message: 'Not Implemented: The request method is not supported by the server and cannot be handled.' },
            502: { level: 'error', message: 'Bad Gateway: The server, while acting as a gateway or proxy, received an invalid response from the upstream server.' },
            503: { level: 'error', message: 'Service Unavailable: The server is not ready to handle the request.' },
            504: { level: 'error', message: 'Gateway Timeout: The server, while acting as a gateway or proxy, did not get a response in time from the upstream server.' },
            505: { level: 'error', message: 'HTTP Version Not Supported: The HTTP version used in the request is not supported by the server.' },
            506: { level: 'error', message: 'Variant Also Negotiates: The server has an internal configuration error.' },
            507: { level: 'error', message: 'Insufficient Storage: The server is unable to store the representation needed to complete the request.' },
            508: { level: 'error', message: 'Loop Detected: The server detected an infinite loop while processing the request.' },
            510: { level: 'error', message: 'Not Extended: Further extensions to the request are required for the server to fulfill it.' },
            511: { level: 'error', message: 'Network Authentication Required: The client needs to authenticate to gain network access.' },
        };

        const handler = statusHandlers[status];

        if (handler) {
            const message = `${status} ${handler.message} Resource: ${resourceUrl}`;
            console[handler.level](message);
        } else {
            const message = `Unhandled status code: ${status} - ${statusText}. Resource: ${resourceUrl}`;
            console.warn(message);
        }
    }

    /**
     * Prepares the body for the fetch request based on its type and the HTTP method.
     * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
     * @param {*} body - The request body.
     * @returns {BodyInit | null} The processed body suitable for the fetch API, or null.
     */
    handleBody(method, body) {
        if (method === 'GET' || method === 'HEAD') {
            return null;
        }
        if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || typeof body === 'string' || body instanceof ArrayBuffer) {
            return body;
        } else if (body !== undefined && body !== null) {
            return JSON.stringify(body);
        }
        return null;
    }

    /**
     * Prepares the headers for the fetch request.
     * @description Sets 'Content-Type' to 'application/json' if not already set and the body is a JSON object.
     * @param {HeadersInit} headers - The initial headers for the request.
     * @param {*} body - The request body, used to determine if the JSON header is needed.
     * @returns {HeadersInit} The processed headers.
     */
    handleHeaders(headers, body) {
        if (body && !(body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || typeof body === 'string' || body instanceof ArrayBuffer) && !this.getHeader(headers, 'Content-Type')) {
            this.setHeader(headers, 'Content-Type', 'application/json');
        }
        return headers;
    }

    /**
     * The core request method that constructs and executes the fetch call.
     * @param {string} method - The HTTP method.
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {*} [body] - The body of the request.
     * @param {HeadersInit} [headers={}] - The headers for the request.
     * @returns {Promise<Response>} The fetch Response object, extended with a 'data' property holding the parsed body.
     * @throws {Error} Throws an error if the fetch call fails or is unhandled.
     */
    async request(method, endpoint, body, headers = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: this.handleHeaders(headers, body),
            body: this.handleBody(method, body)
        };

        try {
            console.info(`Starting ${method} request to ${url}`);
            const response = await fetch(url, options);
            if (response.status === 204) {
                return response;
            }
            // Parse the content
            const data = await this.handleContentType(response);
            
            // Attach the parsed data as a new property
            response.data = data;

            // Return the extended response object
            return response;
        } catch (error) {
            console.error(`Failed ${method} request to ${url}: ${error.message}`);
            throw error;
        }
    }

    /**
     * The core request method for HEAD requests.
     * @param {string} method - The HTTP method (should be 'HEAD').
     * @param {string} endpoint - The endpoint to send the request to.
     * @param {HeadersInit} [headers={}] - The headers for the request.
     * @returns {Promise<Response>} The fetch Response object.
     * @throws {Error} Throws an error if the fetch call fails or is unhandled.
     */
    async headRequest(method, endpoint, headers = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: this.handleHeaders(headers, undefined),
        };

        try {
            console.info(`Starting ${method} request to ${url}`);
            const response = await fetch(url, options);
            await this.handleStatusCode(response);
            return response;
        } catch (error) {
            console.error(`Failed ${method} request to ${url}: ${error.message}`);
            throw error;
        }
    }
}
