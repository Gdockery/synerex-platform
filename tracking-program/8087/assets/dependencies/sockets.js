// Legacy module - SocketService now uses socket.io-client directly.
// This file kept for any scripts that might require('dependencies/sockets').
var io = require('socket.io-client');
module.exports = io;
