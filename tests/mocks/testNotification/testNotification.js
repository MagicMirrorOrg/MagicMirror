Module.register("testNotification", {
	defaults: {
		debug: false,
		match: {
			notificationID: "",
			matchtype: "count"
			//or
			// type: 'contents' // look for item in field of content
		}
	},
	count: 0,
	table: null,
	notificationReceived (notification, payload) {
		if (notification === this.config.match.notificationID) {
			if (this.config.match.matchtype === "count") {
				this.count = payload.length;
				if (this.count) {
					this.table = document.createElement("table");
					this.addTableRow(this.table, null, `${this.count}:elementCount`);
					if (this.config.debug) {
						payload.forEach((e, i) => {
							this.addTableRow(this.table, i, e.title);
						});
					}
				}

				this.updateDom();
			}
		}
	},
	maketd (row, info) {
		let td = document.createElement("td");
		row.appendChild(td);
		if (info !== null) {
			let colinfo = info.toString().split(":");
			if (colinfo.length === 2) td.className = colinfo[1];
			td.innerText = colinfo[0];
		}
		return td;
	},
	addTableRow (table, col1 = null, col2 = null, col3 = null) {
		let tableRow = document.createElement("tr");
		table.appendChild(tableRow);

		let tablecol1 = this.maketd(tableRow, col1);
		let tablecol2 = this.maketd(tableRow, col2);
		let tablecol3 = this.maketd(tableRow, col3);

		return tableRow;
	},
	getDom () {
		let wrapper = document.createElement("div");
		if (this.table) {
			wrapper.appendChild(this.table);
		}
		return wrapper;
	}

});
