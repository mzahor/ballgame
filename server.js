var express = require('express');
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

var GENERATED_OBJ_COUNT = 100;
var FOOD_GENERATION_SPEED = 1000; // 1 max
var STARTING_PLAYER_RADIUS = 30;
var STARTING_SPEED = 400;
var WORLD_UPDATE_RATE = 1000 / 60;
var WORLD_HEIGHT = 5000;
var WORLD_WIDTH = 5000;
var FOOD_INC_AMOUNT = 0.3;

var playerIdCounter = 1;

var eatedFood = [];
var eatedPlayers = [];
var recentlyEatedFood = [];
var recentlyEatedPlayers = [];
var newFood = [];

var world = {
  height: WORLD_HEIGHT,
  width: WORLD_WIDTH,
  objects: [],
  players: []
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
  var newFoodCount = getRandomInt(0, foodDificit) / FOOD_GENERATION_SPEED;
  newFood = [];
  for (var i = 0; i < newFoodCount; i++) {
    var id = eatedFood.pop();
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
    });
  }
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
    var h = player.speed * (currUpdate - lastUpdate) / 1000;

    // console.log('angle: ', player.angle)
    // console.log("x move: ", Math.cos(player.angle) * h)
    // console.log("y move: ", Math.sin(player.angle) * h)

    player.pos.x += Math.cos(player.angle) * h
    player.pos.y += Math.sin(player.angle) * h

    player.pos.x = Math.max(0, Math.min(player.pos.x, world.width));
    player.pos.y = Math.max(0, Math.min(player.pos.y, world.height));

    handleCollision(player, world);
  }

  lastUpdate = new Date();
}

var handleCollision = function(player, world) {
  recentlyEatedFood = [];
  recentlyEatedPlayers = [];

  for (var i = 0; i < world.objects.length; i++) {
    var object = world.objects[i];

    if (!object) {
      // if vacant
      continue;
    }

    if (hasCollision(player, object)) {
      player.radius += FOOD_INC_AMOUNT;
      eatedFood.push(i);
      recentlyEatedFood.push(i);
      delete world.objects[i];
    }
  }

  for (var i = 0; i < world.players.length; i++) {
    var pl = world.players[i];

    if (!pl || pl.id === player.id) {
      continue;
    }

    if (hasOverlap(player, pl) && player.radius > pl.radius) {
      player.radius += pl.radius;
      eatedPlayers.push(i);
      recentlyEatedPlayers.push(i);
      delete world.players[i];
    }
  }
}

var hasCollision = function(player, object) {
  var distance = Math.sqrt(
    Math.pow(player.pos.x - object.pos.x, 2) +
    Math.pow(player.pos.y - object.pos.y, 2));
  return distance < player.radius + object.radius;
}

var hasOverlap = function(player, object) {
  var distance = Math.sqrt(
    Math.pow(player.pos.x - object.pos.x, 2) +
    Math.pow(player.pos.y - object.pos.y, 2));
  return distance < Math.max(player.radius, object.radius);
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
    radius: STARTING_PLAYER_RADIUS,
    angle: 0,
    speed: STARTING_SPEED,
    name: 'player' + currId,
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
  io.sockets.emit('serverTick', {
    players: world.players,
    eatedFood: recentlyEatedFood,
    eatedPlayers: recentlyEatedPlayers,
    newFood: newFood
  });
  recentlyEatedFood = [];
  recentlyEatedPlayers = [];
  newFood = [];
}, WORLD_UPDATE_RATE);

http.listen(3000, function() {
  console.log('listening on *:3000');
});
