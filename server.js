var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

playerIdCounter = 1;

var world = {
  height: 10000,
  width: 10000,
  objects: [],
  players: [],
  default_speed: 400 // pix/sec
};

var lastUpdate = new Date();

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var generateWorld = function generateWorld() {
  for (var i = 1; i < 1000; i++) {
    world.objects[i] = {
      // not a player
      type: 0,
      pos: {
        x: getRandomInt(0, world.width),
        y: getRandomInt(0, world.height),
      },
      radius: 10,
      color: "bbaa23"
    };
  }
};

generateWorld();

var updateWorld = function updateWorld(data) {
  for (var i = 0; i < playerIdCounter; i++) {
    var player = world.players[i];
    if (!player) {
      // if vacant
      continue;
    }

    var currUpdate = new Date();
    var h = (player.speed || world.default_speed) * (currUpdate - lastUpdate) / 1000;

    player.pos.x += Math.cos(player.angle) * h
    player.pos.y += Math.sin(player.angle) * h

    player.pos.x = Math.max(0, Math.min(player.pos.x, world.width));
    player.pos.y = Math.max(0, Math.min(player.pos.y, world.height));
  }

  lastUpdate = new Date();
}

io.on('connection', function(socket) {
  socket.on('disconnect', function() {

  });

  currId = playerIdCounter++;

  world.players[currId] = {
    type: 1,
    id: currId,
    pos: {
      x: Math.floor(world.width / 2),
      y: Math.floor(world.height / 2)
    },
    radius: 30,
    angle: 0,
    color: "2353ab"
  };

  socket.emit('init', {
    world: world,
    id: currId
  });

  socket.on('clientTick', function(pack) {
    var player = world.objects[pack.id];
    player.angle = pack.angle;
  });
});

setInterval(function() {
  updateWorld();
  io.sockets.emit('serverTick', world.players);
}, 1000/60);

http.listen(3000, function() {
  console.log('listening on *:3000');
});
