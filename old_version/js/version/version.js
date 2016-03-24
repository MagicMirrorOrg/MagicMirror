var version = {
	updateInterval: 600000,
	intervalId: null
}

/**
 * Checks the version and refreshes the page if a new version has been pulled
 */
version.checkVersion = function () {

	$.ajax({
		type: 'GET',
		url: 'controllers/hash.php',
		success: function (data) {
			// The githash variable is located in index.php
			if (data && data.gitHash !== gitHash) {
				window.location.reload();
				window.location.href = window.location.href;
			}
		},
		error: function () {

		}
	});

}

version.init = function () {

	this.intervalId = setInterval(function () {
		this.checkVersion();
	}.bind(this), this.updateInterval);

}
