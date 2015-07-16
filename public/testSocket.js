var socket = io();
setInterval(function() {
  socket.emit('tick', {
    angle: 1.4
  });
}, 10);
