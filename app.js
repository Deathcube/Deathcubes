var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);

console.log("Hello from server!");

var SOCKET_LIST = {};

/*

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
*/

function extend(Child, Parent) {
   var Temp = function(){};
   Temp.prototype = Parent.prototype;
   Child.prototype = new Temp();
   Child.prototype.constructor = Child;
}

function Entity(id) {
   this.id = id;
   this.X = 0;
   this.Y = 0;
   this.spdX = 0;
   this.spdY = 0;
}

Entity.prototype = {
   update: function() {
      this.updatePosition();
   },
   updatePosition: function(){
      this.X += this.spdX;
      this.Y += this.spdY;
   }
};


function Player(id){
   Entity.prototype.id = id;
   this.number = "" + Math.floor(10 * Math.random());
   this.pressingRight = false;
   this.pressingLeft = false;
   this.pressingUp = false;
   this.pressingDown = false;
   this.spd = 1;
   this.maxSpd = 10;

   Player.list[id] = this;
}

Player.prototype = {
   update: function () {
      this.updateSpd();
      Entity.prototype.update.apply(this);
   },
   updateSpd: function (){
      if(this.pressingLeft)
         this.spdX = -this.maxSpd*this.spd;
      else if(this.pressingRight)
         this.spdX = this.maxSpd*this.spd;
      else
         this.spdX = 0;

      if(this.pressingUp)
         this.spdY = -this.maxSpd*this.spd;
      else if(this.pressingDown)
         this.spdY = this.maxSpd*this.spd;
      else
         this.spdY = 0;
   }
};

Player.list = {};

extend(Player, Entity);


function playerConnect(socket) {
   var player = new Player(socket.id);

   socket.on('keyPress', function (data) {
      switch (data.inputId){
         case 'left' : player.pressingLeft = data.state; break;
         case 'right' : player.pressingRight = data.state; break;
         case 'up' : player.pressingUp = data.state; break;
         case 'down' : player.pressingDown = data.state; break;
      }
   });
}

function onPlayerDisconnect(socket) {
   delete Player.list[socket.id];
}

function playerUpdate(){
   var pack = [];
   for(var i in Player.list){
      var player = Player.list[i];
      player.update();

      pack.push({
         x: player.X,
         y: player.Y,
         number: player.number
      });
   }

   return pack;
}


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
   socket.id = Math.random();
   SOCKET_LIST[socket.id] = socket;

   playerConnect(socket);

   socket.on('disconnect', function () {
      delete SOCKET_LIST[socket.id];
      onPlayerDisconnect(socket);
   });
});


setInterval(function () {
   var pack = playerUpdate();
   for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      socket.emit('positions', pack);
   }
}, 1000/25);