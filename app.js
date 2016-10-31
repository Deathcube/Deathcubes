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

function extend(Child, Parent) {
   var F = function() { };
   F.prototype = Parent.prototype;
   Child.prototype = new F();
   Child.prototype.constructor = Child;
   Child.superclass = Parent.prototype;
}

var Entity = function () {
   this.id = id;
   this.x = 0;
   this.y = 0;
   this.spdX = 0;
   this.spdY = 0;

   this.getId = function () {
      return this.id;
   };
   this.setId = function (id) {
      this.id = id;
   };
   this.getX = function () {
      return this.x;
   };
   this.setX = function (x) {
      this.x = x;
   };
   this.getSpdX = function () {
      return this.spdX;
   };
   this.setSpdX = function (spdX) {
      this.spdX = spdX;
   };
   this.getY = function () {
      return this.y;
   };
   this.setY = function (y) {
      this.y = y;
   };
   this.getSpdY = function () {
      return this.spdY;
   };
   this.setSpdY = function (spdY) {
      this.spdY = spdY;
   };

   this.update = function () {
      this.updatePosition();
   };

   this.updatePosition = function () {
      this.x += this.spdX;
      this.y += this.spdY;
   };
};

var Player = function (id) {
   this.superclass.constructor.apply(this, arguments);
   this.number = ""+Math.floor(10*Math.random());
   this.pressingLeft = false;
   this.pressingRight = false;
   this.pressingUp = false;
   this.pressingDown = false;
   this.spd = 1;
   this.maxSpd = 8;

   this.update = function () {
     this.updateSpd();
      this.superclass.update();
   };

   this.updateSpd = function () {
      if(this.pressingRight){
         this.superclass.setSpdX(this.maxSpd * this.spd);
      }
      else if(this.pressingLeft){
         this.superclass.setSpdX(-this.maxSpd * this.spd);
      }
      else if(this.pressingDown){
         this.superclass.setSpdY(this.maxSpd * this.spd);
      }
      else if(this.pressingUp){
         this.superclass.setSpdY(-this.maxSpd * this.spd);
      }
      else
         this.spd = 0;
   };

   Player.list[id] = this;
   return this;
};
extend(Player, Entity);

Player.list = {};


Player.prototype.onConnect = function (socket) {
   var player = Player(socket.id);

   socket.on('keyPress', function (data) {
      if(data.inputId === 'left')
         player.pressingLeft = data.state;
      else if(data.inputId === 'right')
         player.pressingRight = data.state;
      else if(data.inputId === 'up')
         player.pressingUp = data.state;
      else if(data.inputId === 'down')
         player.pressingDown = data.state;
   });
};

Player.prototype.onDisconnect = function (socket) {
   delete Player.list[socket.id];
};

Player.prototype.update = function () {
   var pack = [];
   for(var i in Player.list){
      var player = Player.list[i];
      player.update();

      pack.push({
         x: player.x,
         y: player.y,
         number:player.number
      });
   }

   return pack;
};


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
   socket.id = Math.random();
   SOCKET_LIST[socket.id] = socket;

   Player.prototype.onConnect(socket);

   socket.on('disconnect', function () {
      delete SOCKET_LIST[socket.id];
      Player.prototype.onDisconnect(socket);
   });
});


setInterval(function () {
   var pack = Player.prototype.update();
   for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      socket.emit('positions', pack);
   }
}, 1000/25);