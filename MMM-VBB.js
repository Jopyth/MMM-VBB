/* global Module */
/* Magic Mirror
 * Module: VBB
 *
 * By Joseph Bethge https://github.com/Jopyth
 * MIT Licensed.
 */
Module.register('MMM-VBB', {
	defaults: {
		animationSpeed: 2000,
		updateInterval: 3 * 60 * 1000, // three minutes
		maxDepartures: 6,
		stationId: "",
		apiKey: "",
		abbreviateNow: true,
		maxTimeDistance: true,
		systemURL: "http://demo.hafas.de/openapi/vbb-proxy",
		service: "/departureBoard"
	},
	start: function() {
		Log.info('Starting module: ' + this.name);
		this.loaded = false;

		this.url = this.config.systemURL + this.config.service + "?";
		this.url += "id=" + this.config.stationId;
		this.url += "&accessId=" + this.config.apiKey;

		this.board = [];

		this.updated = false;

		this.updateData();

		var self = this;
		
		setInterval(function() {
			self.updateTime();
		}, 1000 * 20);

		setInterval(function() {
			self.updateData();
		}, this.config.updateInterval);

		this.pause = false;
	},

	getStyles: function() {
		return ["MMM-VBB.css", "font-awesome.css"];
	},

	getScripts: function() {
		return ["moment.js"];
	},

	updateData: function() {
		var payload = {origin: this.identifier, url: this.url};
		this.sendSocketNotification('REQUEST', payload);
	},

	updateTime: function() {
		this.updateDom();
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'RESPONSE' && payload.origin === this.identifier)
		{
			if (payload.data && payload.data.DepartureBoard)
			{
				this.board = payload.data.DepartureBoard;
				this.updated = moment();
				this.loaded = true;
				this.updateDom(this.config.animationSpeed);
			}
		}
	},
	getTranslations: function() {
		return {
			de: "translations/de.json",
			en: "translations/en.json"
		};
	},
	getHeaderAppendix: function() {
		if (!this.updated)
		{
			return "";
		}
		return " (<span class='fa fa-refresh'></span> " + this.updated.format("HH:mm:ss") + ")";
	},
	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.className = 'vbb-wrapper';
		if (!this.loaded) {
			wrapper.innerHTML = "<span class='small fa fa-refresh fa-spin fa-fw'></span>";
		} else {
			for (var i = 0; i < Math.min(this.board.Departure.length, this.config.maxDepartures); i++)
			{
				var current = this.board.Departure[i];

				var dir = current.$.direction;
				var name = current.$.name;
				var timeMoment = moment(current.$.rtDate + " " + current.$.rtTime, "YYYY-MM-DD HH:mm:ss");
				var time = timeMoment.fromNow();
				if (this.config.abbreviateNow && Math.abs(moment().diff(moment(timeMoment))) <= 45000)
				{
					time = this.translate('NOW');
				}

				var productDiv = document.createElement("div");
				productDiv.innerHTML = name + " (" + dir + ")";
				productDiv.className = "vbb-product bright small";
				wrapper.appendChild(productDiv);

				var timeDiv = document.createElement("div");
				timeDiv.innerHTML = time;
				timeDiv.className = "vbb-time small light";
				wrapper.appendChild(timeDiv);
			}
		}
		return wrapper;
	}
});
