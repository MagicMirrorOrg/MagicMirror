const FetcherHelper = {
	checkStatus: function (response) {
		// response.status >= 200 && response.status < 300
		if (response.ok) {
			return response;
		} else {
			throw Error(response.statusText);
		}
	}
};

module.exports = FetcherHelper;
