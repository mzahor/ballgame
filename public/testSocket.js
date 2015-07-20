var socket = io();
CANV_HEIGHT = window.innerHeight;
CANV_WIDTH = window.innerWidth;
var ZOOM = 2;

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

    this.clearRect(0, 0, this.canvas.width*ZOOM, this.canvas.height*ZOOM);

    if (preserveTransform) {
      this.restore();
    }
  };

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById("canvas");
  canvas.width = CANV_WIDTH;
  canvas.height = CANV_HEIGHT;
  mousePos = {};

  canvas.addEventListener('mousemove', function(event) {
    mousePos.x = event.offsetX;
    mousePos.y = event.offsetY;
    var me = world.players[id];

    me.angle = Math.atan2(mousePos.y - CANV_HEIGHT / 2, mousePos.x - CANV_WIDTH / 2);
  });

  canvas.addEventListener('mousewheel',function(event){

    var delta = event.deltaY || event.detail || event.wheelDelta;
    if      (delta === 100)
    {ZOOM = ZOOM + 0.01;}
  else
    {ZOOM = ZOOM - 0.01;}
 
});

  var ctx = canvas.getContext("2d");
  var world = null;
  var id = null;
  var lastUpdate = new Date();

  socket.on('connect', function() {
    socket.on('init', function(pack) {
      id = pack.id;
      world = pack.world;

      socket.on('eatFood', function(pack) {        
        pack.eatedFood.forEach(function(item, i, arr) {          
          delete world.objects[item];
        });
      });

      socket.on('generateFood', function(pack) {      
        pack.objects.forEach(function(item, i, arr) {
          world.objects[item.id]=item.object;
        });
      });

      setInterval(function() {
        socket.emit('clientTick', world.players[id]);
      }, 1000 / 60);

      socket.on('serverTick', function(pack) {
        lastUpdate = new Date();
        world.players = pack;
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

      var h = player.speed * (currUpdate - lastUpdate) / 1000;

      player.pos.x += Math.cos(player.angle) * h
      player.pos.y += Math.sin(player.angle) * h

      player.pos.x = Math.max(0, Math.min(player.pos.x, world.width));
      player.pos.y = Math.max(0, Math.min(player.pos.y, world.height));
    }

    lastUpdate = new Date();
  }

  var makeObject = function makeObject(obj) {
    var circle = new Path2D();
    circle.arc(obj.pos.x*ZOOM, obj.pos.y*ZOOM, obj.radius*ZOOM, 0, 2 * Math.PI);
    return circle;
  }

  var renderObjects = function renderObjects(ctx, objArray) {
    for (var i = 1; i < objArray.length; i++) {
      var object = objArray[i];
      if (!object) continue;
      var pathObj = makeObject(object);
      ctx.fillStyle = '#' + object.color;
      ctx.fill(pathObj);

      if (object.name) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'yellow';
        ctx.font = 'bold 20px serif'
        var width = ctx.measureText(object.name).width;
        var height = ctx.measureText("w").width;
        ctx.fillText(object.name, object.pos.x*ZOOM - width / 2, object.pos.y*ZOOM + height / 2);
        ctx.restore();
      }
    }
  }

  var draw = function draw() {
    if (world) {
      updateWorld(world)
      ctx.clear(true);
      ctx.save();

      var me = world.players[id];
      ctx.translate((-me.pos.x*ZOOM + CANV_WIDTH / 2), (-me.pos.y*ZOOM + CANV_HEIGHT / 2));
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
