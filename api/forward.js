const { scheduledHandler } = require("../src/http");
const { pollOnce } = require("../src/forwarder/poll");

module.exports = scheduledHandler("forwarder", pollOnce);
