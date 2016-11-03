var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 2000);

console.log("Server started :)");

var SOCKET_LIST = {};

// extending functions
// this help to create an inheritance

function extend(Child, Parent) {
   var Temp = function(){};
   Temp.prototype = Parent.prototype;
   Child.prototype = new Temp();
   Child.prototype.constructor = Child;
}



// Base entity class for define base attributes and methods


function Entity(id) {
   this.id = id;
   this.X = 250;
   this.Y = 250;
   this.spdX = 0;
   this.spdY = 0;
}

Entity.prototype.update = function () {
   this.updatePosition();
};

Entity.prototype.updatePosition = function () {
   this.X += this.spdX;
   this.Y += this.spdY;
};





// Player class with functions extends from Entity

function Player(id){
   Entity.call(this, id);
   this.number = "" + Math.floor(10 * Math.random());
   this.pressingRight = false;
   this.pressingLeft = false;
   this.pressingUp = false;
   this.pressingDown = false;
   this.spd = 1;
   this.maxSpd = 10;

   Player.list[id] = this;
}
Player.list = {};

// create an inheritance between objects
extend(Player, Entity);

Player.prototype.update = function () {
   this.updateSpd();
   Entity.prototype.update.apply(this);
};

Player.prototype.updateSpd = function () {
   if(this.pressingLeft && this.X>0)
      this.spdX = -this.maxSpd*this.spd;
   else if(this.pressingRight  && this.X<475)
      this.spdX = this.maxSpd*this.spd;
   else
      this.spdX = 0;

   if(this.pressingUp  && this.Y>0)
      this.spdY = -this.maxSpd*this.spd;
   else if(this.pressingDown  && this.Y<475)
      this.spdY = this.maxSpd*this.spd;
   else
      this.spdY = 0;
};



// Bullet class with functions extends from Entity

function Bullet(angle){
   this.id = Math.random();
   Entity.call(this, this.id);
   this.maxSpd = 10;
   this.spdX = Math.cos(angle/180*Math.PI) * this.maxSpd;
   this.spdY = Math.sin(angle/180*Math.PI) * this.maxSpd;
   this.toRemove = false;
   this.timer = 0;

   Bullet.list[this.id] = this;
}
Bullet.list = {};

// create an inheritance between objects
extend(Bullet, Entity);

Bullet.prototype.update = function () {
   if(this.timer++ > 100)
      this.toRemove = true;
   Entity.prototype.update.apply(this);
};







// server functions

function onPlayerConnect(socket) {
   var player = new Player(socket.id);

   socket.on('keyPress', function (data) {
      if (data.inputId === 'left'){
         player.pressingLeft = data.state;
      } else if (data.inputId === 'right'){
         player.pressingRight = data.state;
      } else if (data.inputId === 'up'){
         player.pressingUp = data.state;
      } else if (data.inputId === 'down'){
         player.pressingDown = data.state;
      }
   });
}

function onPlayerDisconnect(socket) {
   delete Player.list[socket.id];
}

function playersUpdate(){
   var players = [];
   for(var i in Player.list){
      var player = Player.list[i];

      player.update();

      players.push({
         x: player.X,
         y: player.Y,
         number: player.number
      });
   }

   return players;
}

function bulletsUpdate(){
   if(Math.random() < 0.5)
      new Bullet(Math.random()*360);


   var bullets = [];
   for(var i in Bullet.list){
      var bullet = Bullet.list[i];

      bullet.update();

      bullets.push({
         x: bullet.X,
         y: bullet.Y
      });
   }

   return bullets;
}


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
   socket.id = Math.random();
   SOCKET_LIST[socket.id] = socket;

   onPlayerConnect(socket);

   socket.on('disconnect', function () {
      delete SOCKET_LIST[socket.id];
      onPlayerDisconnect(socket);
   });
});


setInterval(function () {
   var pack = {
    players : playersUpdate(),
    bullets : bulletsUpdate()
   };

   for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      socket.emit('positions', pack);
   }
}, 1000/50);