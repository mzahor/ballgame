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

  socket.on('connect', function() {
    socket.on('init', function(initData) {
      id = initData.id;

      setInterval(function() {
        socket.emit('tick', {
          angle: Math.PI,
          id: id
        });
      }, 500);

      socket.on('world', function(data) {
        world = data;
      });
    });
  });

  var draw = function draw() {
    if (world) {
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
