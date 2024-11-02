/**
 * A function to make HTTP requests via the server to avoid CORS-errors.
 * @param {string} url the url to fetch from
 * @param {string} type what contenttype to expect in the response, can be "json" or "xml"
 * @param {boolean} useCorsProxy A flag to indicate
 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to receive
 * @param {string} basePath, default /
 * @returns {Promise} resolved when the fetch is done. The response headers is placed in a headers-property (provided the response does not already contain a headers-property).
 */
async function performWebRequest (url, type = "json", useCorsProxy = false, requestHeaders = undefined, expectedResponseHeaders = undefined, basePath = "/") {
	const request = {};
	let requestUrl;
	if (useCorsProxy) {
		requestUrl = getCorsUrl(url, requestHeaders, expectedResponseHeaders, basePath);
	} else {
		requestUrl = url;
		request.headers = getHeadersToSend(requestHeaders);
	}
	const response = await fetch(requestUrl, request);
	const data = await response.text();

	if (type === "xml") {
		return new DOMParser().parseFromString(data, "text/html");
	} else {
		if (!data || !data.length > 0) return undefined;

		const dataResponse = JSON.parse(data);
		if (!dataResponse.headers) {
			dataResponse.headers = getHeadersFromResponse(expectedResponseHeaders, response);
		}
		return dataResponse;
	}
}

/**
 * Gets a URL that will be used when calling the CORS-method on the server.
 * @param {string} url the url to fetch from
 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to receive
 * @param {string} basePath, default /
 * @returns {string} to be used as URL when calling CORS-method on server.
 */
const getCorsUrl = function (url, requestHeaders, expectedResponseHeaders, basePath = "/") {
	if (!url || url.length < 1) {
		throw new Error(`Invalid URL: ${url}`);
	} else {
		let corsUrl = `${location.protocol}//${location.host}${basePath}cors?`;

		const requestHeaderString = getRequestHeaderString(requestHeaders);
		if (requestHeaderString) corsUrl = `${corsUrl}sendheaders=${requestHeaderString}`;

		const expectedResponseHeadersString = getExpectedResponseHeadersString(expectedResponseHeaders);
		if (requestHeaderString && expectedResponseHeadersString) {
			corsUrl = `${corsUrl}&expectedheaders=${expectedResponseHeadersString}`;
		} else if (expectedResponseHeadersString) {
			corsUrl = `${corsUrl}expectedheaders=${expectedResponseHeadersString}`;
		}

		if (requestHeaderString || expectedResponseHeadersString) {
			return `${corsUrl}&url=${url}`;
		}
		return `${corsUrl}url=${url}`;
	}
};

/**
 * Gets the part of the CORS URL that represents the HTTP headers to send.
 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
 * @returns {string} to be used as request-headers component in CORS URL.
 */
const getRequestHeaderString = function (requestHeaders) {
	let requestHeaderString = "";
	if (requestHeaders) {
		for (const header of requestHeaders) {
			if (requestHeaderString.length === 0) {
				requestHeaderString = `${header.name}:${encodeURIComponent(header.value)}`;
			} else {
				requestHeaderString = `${requestHeaderString},${header.name}:${encodeURIComponent(header.value)}`;
			}
		}
		return requestHeaderString;
	}
	return undefined;
};

/**
 * Gets headers and values to attach to the web request.
 * @param {Array.<{name: string, value:string}>} requestHeaders the HTTP headers to send
 * @returns {object} An object specifying name and value of the headers.
 */
const getHeadersToSend = (requestHeaders) => {
	const headersToSend = {};
	if (requestHeaders) {
		for (const header of requestHeaders) {
			headersToSend[header.name] = header.value;
		}
	}

	return headersToSend;
};

/**
 * Gets the part of the CORS URL that represents the expected HTTP headers to receive.
 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to receive
 * @returns {string} to be used as the expected HTTP-headers component in CORS URL.
 */
const getExpectedResponseHeadersString = function (expectedResponseHeaders) {
	let expectedResponseHeadersString = "";
	if (expectedResponseHeaders) {
		for (const header of expectedResponseHeaders) {
			if (expectedResponseHeadersString.length === 0) {
				expectedResponseHeadersString = `${header}`;
			} else {
				expectedResponseHeadersString = `${expectedResponseHeadersString},${header}`;
			}
		}
		return expectedResponseHeaders;
	}
	return undefined;
};

/**
 * Gets the values for the expected headers from the response.
 * @param {Array.<string>} expectedResponseHeaders the expected HTTP headers to receive
 * @param {Response} response the HTTP response
 * @returns {string} to be used as the expected HTTP-headers component in CORS URL.
 */
const getHeadersFromResponse = (expectedResponseHeaders, response) => {
	const responseHeaders = [];

	if (expectedResponseHeaders) {
		for (const header of expectedResponseHeaders) {
			const headerValue = response.headers.get(header);
			responseHeaders.push({ name: header, value: headerValue });
		}
	}

	return responseHeaders;
};

/**
 * Format the time according to the config
 * @param {object} config The config of the module
 * @param {object} time time to format
 * @returns {string} The formatted time string
 */
const formatTime = (config, time) => {
	let date = moment(time);

	if (config.timezone) {
		date = date.tz(config.timezone);
	}

	if (config.timeFormat !== 24) {
		if (config.showPeriod) {
			if (config.showPeriodUpper) {
				return date.format("h:mm A");
			} else {
				return date.format("h:mm a");
			}
		} else {
			return date.format("h:mm");
		}
	}

	return date.format("HH:mm");
};

if (typeof module !== "undefined") module.exports = {
	performWebRequest,
	formatTime
};
