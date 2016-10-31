var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

console.log("Hello from server!");

var SOCKET_LIST = {};

var PLAYER_LIST = {};


var Player = function (id) {
   var self = {
      x:250,
      y:250,
      id:id,
      number: ''+Math.floor(10*Math.random()),
      left:false,
      right:false,
      up:false,
      down:false,
      maxSpd:5,
   };

   self.updatePosition = function () {
      if(self.left)
         self.x -= self.maxSpd;
      if(self.right)
         self.x += self.maxSpd;
      if(self.up)
         self.y -= self.maxSpd;
      if(self.down)
         self.y += self.maxSpd;

   };


   return self;
};


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
   socket.id = Math.random();
   SOCKET_LIST[socket.id] = socket;

   var player = Player(socket.id);
   PLAYER_LIST[socket.id] = player;

   socket.on('disconnect', function () {
      delete SOCKET_LIST[socket.id];
      delete PLAYER_LIST[socket.id];
   });

   socket.on('keyPress', function (data) {
      if(data.inputId === 'left')
         player.left = data.state;
      else if(data.inputId === 'right')
         player.right = data.state;
      else if(data.inputId === 'up')
         player.up = data.state;
      else if(data.inputId === 'down')
         player.down = data.state;
   })
});


setInterval(function () {
   var pack = [];
   for(var i in PLAYER_LIST){
      var player = PLAYER_LIST[i];
      player.updatePosition();

      pack.push({
         x: player.x,
         y: player.y,
         number:player.number
      });
   }
   for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      socket.emit('positions', pack);
   }

}, 1000/25);