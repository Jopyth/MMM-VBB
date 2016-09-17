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

	onError: function (message) {
		console.log(message);
	},

	socketNotificationReceived: function(notification, payload) {
		var self = this;

		if (notification === 'REQUEST') {
			request({url: payload.url, method: 'GET'}, function(error, response, body) {
				if (error)
				{
					self.onError(error);
					return;
				}

				if (response.statusCode !== 200)
				{
					self.onError(response.statusCode);
					return;
				}

				xml2js.parseString(body, function (err, result) {
					if (err) {
						self.onError(err);
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
