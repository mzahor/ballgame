var socket = io();

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

var makeObject = function makeObject(obj) {
  var circle = new Path2D();
  circle.arc(obj.pos.x, obj.pos.y, obj.radius, 0, 2 * Math.PI);
  return circle;
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
  var ctx = canvas.getContext("2d");
  var world = null;
  var id = null;
  var lastUpdate = new Date();

  socket.on('connect', function() {
    socket.on('init', function(initData) {
      id = initData.id;

      setInterval(function() {
        socket.emit('tick', {
          angle: Math.random(),
          id: id
        });
      }, 500);

      socket.on('world', function(data) {
        lastUpdate = new Date();
        world = data;
      });
    });
  });



  var updateWorld = function updateWorld(data) {
    var currUpdate = new Date();
    for (var i = 0; i < world.objects.length; i++) {
      var player = world.objects[i];
      if (!player || player.type != 1) {
        // if not a player
        continue;
      }
      var h = (player.speed || world.default_speed) * (currUpdate - lastUpdate) / 1000;

      player.pos.x += Math.cos(player.angle) * h
      player.pos.y += Math.sin(player.angle) * h

      player.pos.x = Math.max(0, Math.min(player.pos.x, world.width));
      player.pos.y = Math.max(0, Math.min(player.pos.y, world.height));
    }

    lastUpdate = new Date();
  }

  var draw = function draw() {
    if (world) {
      updateWorld(world)
      ctx.clear(true);
      ctx.save();

      var me = world.objects[id];
      ctx.translate(-me.pos.x + 500 / 2, -me.pos.y + 500 / 2);
      var obj = makeObject(me);
      ctx.fill(obj);

      for (var i = 1; i < world.objects.length; i++) {
        var o = world.objects[i];
        if (!o) continue;
        var obj = makeObject(o);
        ctx.fill(obj);
      }

      ctx.restore();
    }

    window.requestAnimationFrame(draw);
  }
  window.requestAnimationFrame(draw);
});
