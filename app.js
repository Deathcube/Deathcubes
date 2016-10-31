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

/*
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
*/

var Entity  = function () {
   var self = {
      x:250,
      y:250,
      spdX:0,
      spdY:0,
      id:""
   };
   self.update = function () {
      self.updatePosition();
   };
   self.updatePosition = function () {
      self.x += self.spdX;
      self.y += self.spdY;
   };
   
   return self;
};

var Player = function (id) {
  var self = Entity();
   self.id = id;
   self.number = "" + Math.floor(10 * Math.random());
   self.pressingRight = false;
   self.pressingLeft = false;
   self.pressingUp = false;
   self.pressingDown = false;
   self.maxSpd = 10;

   self.update = function () {
      self.updatePosition();
   };

   self.updatePosition = function () {
      if(self.pressingLeft){
         self.x -= self.maxSpd;
      } else if (self.pressingRight) {
         self.x += self.maxSpd;
      } else if (self.pressingUp) {
         self.y -= self.maxSpd;
      } else if (self.pressingDown) {
         self.y += self.maxSpd;
      }
   };
   Player.list[id] = self;
   return self;

};
Player.list = {};


Player.onConnect = function (socket) {
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

Player.onDisconnect = function (socket) {
   delete Player.list[socket.id];
};

Player.update = function () {
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

   Player.onConnect(socket);

   socket.on('disconnect', function () {
      delete SOCKET_LIST[socket.id];
      Player.onDisconnect(socket);
   });
});


setInterval(function () {
   var pack = Player.update();
   for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      socket.emit('positions', pack);
   }
}, 1000/25);