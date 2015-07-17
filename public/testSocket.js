var socket = io();
CANV_HEIGHT = 500;
CANV_WIDTH = 500;

var clip = function clip(x1, y1, x2, y2, world) {
  var clipped = [];
  var obj = world.objects;
  for (var i = 0; i < obj.length; i++) {
    if (!obj[i]) continue;

    if (obj.pos.x > x1 && obj.pos.x < x2 && obj.pos.y > y1 && obj.pos.y < y2) {
      clipped.push(obj[i]);
    }
  }
  return clipped;
}



CanvasRenderingContext2D.prototype.clear =
  CanvasRenderingContext2D.prototype.clear || function(preserveTransform) {
    if (preserveTransform) {
      this.save();
      this.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (preserveTransform) {
      this.restore();
    }
  };

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById("canvas");
  mousePos = {};

  canvas.addEventListener('mousemove', function(event) {
    mousePos.x = event.offsetX;
    mousePos.y = event.offsetY;
    var me = world.players[id];

    me.angle = Math.atan2(mousePos.y - CANV_HEIGHT / 2, mousePos.x - CANV_WIDTH / 2);
  });

  var ctx = canvas.getContext("2d");
  var world = null;
  var id = null;
  var lastUpdate = new Date();

  socket.on('connect', function() {
    socket.on('init', function(pack) {
      id = pack.id;
      world = pack.world;

      setInterval(function() {
        socket.emit('clientTick', world.players[id]);
      }, 1000 / 60);

      socket.on('serverTick', function(pack) {
        lastUpdate = new Date();
        world.players = pack;
      });

      socket.on('eatFood', function(pack) {
        delete world.objects[pack.id];
      });
    });
  });

  var updateWorld = function updateWorld(data) {
    var currUpdate = new Date();
    for (var i = 0; i < world.players.length; i++) {
      var player = world.players[i];
      if (!player) {
        // if vacant
        continue;
      }

      console.log(player.id)

      var h = (player.speed || world.default_speed) * (currUpdate - lastUpdate) / 1000;

      player.pos.x += Math.cos(player.angle) * h
      player.pos.y += Math.sin(player.angle) * h

      player.pos.x = Math.max(0, Math.min(player.pos.x, world.width));
      player.pos.y = Math.max(0, Math.min(player.pos.y, world.height));
    }

    lastUpdate = new Date();
  }

  var makeObject = function makeObject(obj) {
    var circle = new Path2D();
    circle.arc(obj.pos.x, obj.pos.y, obj.radius, 0, 2 * Math.PI);
    return circle;
  }

  var renderObjects = function renderObjects(ctx, objArray) {
    for (var i = 1; i < objArray.length; i++) {
      var o = objArray[i];
      if (!o) continue;
      var obj = makeObject(o);
      ctx.fillStyle = '#' + o.color;
      ctx.fill(obj);
    }
  }

  var draw = function draw() {
    if (world) {
      updateWorld(world)
      ctx.clear(true);
      ctx.save();

      var me = world.players[id];
      ctx.translate(-me.pos.x + 500 / 2, -me.pos.y + 500 / 2);
      var obj = makeObject(me);
      ctx.fillStyle = '#' + me.color;
      ctx.fill(obj);

      renderObjects(ctx, world.objects);
      renderObjects(ctx, world.players);

      ctx.restore();
    }

    window.requestAnimationFrame(draw);
  }

  window.requestAnimationFrame(draw);
});
