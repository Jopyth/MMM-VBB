/* Magic Mirror
 * Module: VBB
 *
 * By Joseph Bethge https://github.com/Jopyth
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const request = require("request");
const xml2js = require("xml2js");

module.exports = NodeHelper.create({
	start: function () {
		console.log(this.name + ' helper started ...');
	},

	onError: function (message, origin) {
		console.log(message);
		this.sendSocketNotification('ERROR', {message: message, origin: origin});
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;

		if (notification === 'REQUEST') {
			request({url: payload.url, method: 'GET'}, function(error, response, body) {
				if (error)
				{
					self.onError(error, payload.origin);
					return;
				}

				if (response.statusCode !== 200)
				{
					self.onError("Error " + response.statusCode + " (" + response.statusMessage + ")", payload.origin);
					return;
				}

				xml2js.parseString(body, function (err, result) {
					if (err) {
						self.onError(err, payload.origin);
						return;
					}
					self.sendSocketNotification('RESPONSE', {
						origin: payload.origin,
						data: result
					});
				});
			});
		}
	}
});
