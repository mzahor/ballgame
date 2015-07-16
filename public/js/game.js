
var height = 640;
var width = 480;
var game =  Phaser.Game(height,width, Phaser.AUTO, 'ball-game');

game.state.add('boot',bootState);
game.state.add('load',loadState);
game.state.add('menu',bootState);
game.state.add('play',bootState);
game.state.add('result',resultState);

game.state.start('boot');