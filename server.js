var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

playerIdCounter = 1;
var GENERATED_OBJ_COUNT = 1000;
var eatedFood = [];
var foodGenerationSpeed = 1000; // 1 max


var world = {
  height: 1000,
  width: 1000,
  objects: [],
  players: [],
  default_speed: 400 // pix/sec
};

var lastUpdate = new Date();

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var generateWorld = function generateWorld() {
  for (var i = 1; i < GENERATED_OBJ_COUNT; i++) {
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

var generateFood = function generateFood() {
  var foodDificit = eatedFood.length;
  var newFoodCount = getRandomInt(0, foodDificit) / foodGenerationSpeed;  
  var newFood = [];
  for (var i = 0; i < newFoodCount; i++) {
    var id =  eatedFood.pop();
    var food = {
      // not a player
      type: 0,
      pos: {
        x: getRandomInt(0, world.width),
        y: getRandomInt(0, world.height),
      },
      radius: 10,
      color: "bbaa23"
    };
    world.objects[id] = food;
    newFood.push({
            id: id,
            object: world.objects[id]
      })
  }
  io.sockets.emit('generateFood', {objects:newFood});
};

generateWorld();

var updateWorld = function updateWorld(data) {

  generateFood();
  for (var i = 0; i < playerIdCounter; i++) {
    var player = world.players[i];
    if (!player) {
      // if vacant
      continue;
    }

    var currUpdate = new Date();
    var h = (player.speed || world.default_speed) * (currUpdate - lastUpdate) / 1000;

    // console.log('angle: ', player.angle)
    // console.log("x move: ", Math.cos(player.angle) * h)
    // console.log("y move: ", Math.sin(player.angle) * h)

    player.pos.x += Math.cos(player.angle) * h
    player.pos.y += Math.sin(player.angle) * h

    player.pos.x = Math.max(0, Math.min(player.pos.x, world.width));
    player.pos.y = Math.max(0, Math.min(player.pos.y, world.height));

    handleOverlap(player, world);
  }

  lastUpdate = new Date();
}

var handleOverlap = function(player, world) {

  var recentlyEatedFood = [];
  for (var i = 0; i < world.objects.length; i++) {
    var object = world.objects[i];
    if (!object) {
      // if vacant
      continue;
    }

    if (hasOverlap(player, object)) {
      player.score = player.score + 1 || 1;
      player.radius += 0.1;
      eatedFood.push(i);
      recentlyEatedFood.push(i);
      delete world.objects[i];      
    }
  }
  io.sockets.emit('eatFood', {
        eatedFood: recentlyEatedFood
      });
}

var hasOverlap = function(player, object) {
  var distance = Math.sqrt(
    Math.pow(player.pos.x - object.pos.x, 2) +
    Math.pow(player.pos.y - object.pos.y, 2));
  return distance <= player.radius - object.radius / 2;
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
    var player = world.players[pack.id];
    player.angle = pack.angle;
  });
});

setInterval(function() {
  updateWorld();
  io.sockets.emit('serverTick', world.players);
}, 1000 / 60);

http.listen(3000, function() {
  console.log('listening on *:3000');
});
