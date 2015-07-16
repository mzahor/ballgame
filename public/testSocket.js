var socket = io();

socket.on('connect', function(data){
  socket.on('init', function(data){
    setInterval(function() {
      socket.emit('tick', {
        angle: 1.4,
        id: data.id
      });
    }, 10);

    socket.on('world', function(world){
      // console.log(world);
    });
  });
});
