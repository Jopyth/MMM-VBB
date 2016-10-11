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
		systemURL: "http://demo.hafas.de/openapi/vbb-proxy",
		service: "/departureBoard",
		fade: true,
		fadePoint: 0.5 // Start on half of the list.
	},
	start: function() {
		Log.info('Starting module: ' + this.name);
		this.loaded = false;
		this.error = false;

		this.url = this.config.systemURL + this.config.service + "?";
		this.url += "id=" + this.config.stationId;
		this.url += "&accessId=" + this.config.apiKey;

		this.board = [];

		this.updated = false;

		this.updateData();

		var self = this;
		
		this.addAutoSuspendingInterval(function() {
			self.updateTime();
		}, 1000 * 20);

		this.addAutoSuspendingInterval(function() {
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

	notificationReceived: function(notification, payload, sender) {
		this.checkUserPresence(notification, payload, sender);
	},

	updateData: function() {
		var payload = {origin: this.identifier, url: this.url};
		this.sendSocketNotification('REQUEST', payload);
	},

	updateTime: function() {
		this.updateDom();
	},

	socketNotificationReceived: function(notification, payload) {
		if (notification === 'ERROR' && payload.origin === this.identifier)
		{
			this.error = true;
			this.errorMessage = payload.message;
			this.updateDom(this.config.animationSpeed);
		}
		if (notification === 'RESPONSE' && payload.origin === this.identifier)
		{
			console.log(payload.data);
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

	getHeader: function() {
		if (!this.updated)
		{
			return this.data.header;
		}
		return this.data.header + " (<span class='fa fa-refresh'></span> " + this.updated.format("HH:mm:ss") + ")";
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.className = 'vbb-wrapper small';
		
		if (this.error) {
			wrapper.innerHTML = "<span class='small fa fa-exclamation-triangle'></span> " + this.errorMessage;
			wrapper.className = "small dimmed";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = "<span class='small fa fa-refresh fa-spin fa-fw'></span>";
			return wrapper;
		}

		if (!this.board.Departure || Math.min(this.board.Departure.length, this.config.maxDepartures) === 0) {
			wrapper.innerHTML = this.translate('NO_CONNECTIONS');
			wrapper.className = "small dimmed";
			return wrapper;
		}

		var length = Math.min(this.board.Departure.length, this.config.maxDepartures);

		for (var i = 0; i < length; i++)
		{
			var entryDiv = document.createElement("div");
			entryDiv.className = "vbb-entry";

			var current = this.board.Departure[i];

			var dir = current.$.direction;
			var name = current.$.name;
			var timeMoment = moment((current.$.rtDate || current.$.date) + " " + (current.$.rtTime || current.$.time), "YYYY-MM-DD HH:mm:ss");
			var time = timeMoment.fromNow();
			if (this.config.abbreviateNow && Math.abs(moment().diff(moment(timeMoment))) <= 45000)
			{
				time = this.translate('NOW');
			}

			var productDiv = document.createElement("div");
			productDiv.innerHTML = name + " (" + dir + ")";
			productDiv.className = "vbb-product bright";
			entryDiv.appendChild(productDiv);

			var timeDiv = document.createElement("div");
			timeDiv.innerHTML = time;
			timeDiv.className = "vbb-time light normal";
			entryDiv.appendChild(timeDiv);

			// Create fade effect by MichMich (MIT)
			if (this.config.fade && this.config.fadePoint < 1) {
				if (this.config.fadePoint < 0) {
					this.config.fadePoint = 0;
				}
				var startingPoint = length * this.config.fadePoint;
				var steps = length - startingPoint;
				if (i >= startingPoint) {
					var currentStep = i - startingPoint;
					entryDiv.style.opacity = 1 - (1 / steps * currentStep);
				}
			}
			// End Create fade effect by MichMich (MIT)

			wrapper.appendChild(entryDiv);
		}
		return wrapper;
	}
});
