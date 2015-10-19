var version = {
	updateInterval: 3000,
	intervalId: null
}

version.checkVersion = function () {

	$.ajax({
		type: 'GET',
		url: 'githash.php',
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