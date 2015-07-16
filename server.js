var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

idCounter = 1;

var world = {
  height: 10000,
  width: 10000,
  objects: [],
  default_speed: 100 // pix/sec
};

var lastUpdate = new Date();

var tick = function tick(data) {
  console.log(data);
  var player = world.objects[data.id];
  player.angle = data.angle;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var generateWorld = function generateWorld() {
  for (idCounter = 1; idCounter < 1000; idCounter++) {
    world.objects[idCounter] = {
      // not a player
      type: 0,
      pos: {
        x: getRandomInt(0, world.width),
        y: getRandomInt(0, world.height),
      },
      radius: 10
    };
  }
};

generateWorld();

var updateWorld = function updateWorld(data) {
  var currUpdate = new Date();
  for (var player in world.objects) {
    if (player.type != 1) {
      // if not a player
      continue;
    }
    var h = (player.speed || world.default_speed) * (currUpdate - lastUpdate) / 1000;

    player.pos.x += Math.cos(player.angle) * h
    player.pos.y += Math.sin(player.angle) * h

    player.pos.x = Math.max(x, world.width);
    player.pos.y = Math.max(y, world.height);
  }

  lastUpdate = new Date();
}

io.on('connection', function(socket) {
  socket.on('disconnect', function() {

  });

  currId = idCounter++;

  socket.emit('init', {
    world: world,
    id: currId
  });

  world.objects[currId] = {
    type: 1,
    id: currId,
    pos: {
      x: Math.floor(world.width / 2),
      y: Math.floor(world.height / 2)
    },
    radius: 30
  };

  socket.on('tick', function(data) {
    tick(data);
  });
});

setInterval(function() {
  updateWorld();
  io.sockets.emit('world', world);
}, 10);

http.listen(3000, function() {
  console.log('listening on *:3000');
});
