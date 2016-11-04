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

Entity.prototype.getDistance = function (point) {
   return Math.sqrt(Math.pow(this.X-point.X,2) + Math.pow(this.Y - point.Y,2));
};




// Player class with functions extends from Entity

function Player(id){
   Entity.call(this, id);
   this.number = "" + Math.floor(10 * Math.random());
   this.pressingRight = false;
   this.pressingLeft = false;
   this.pressingUp = false;
   this.pressingDown = false;
   this.pressingAttack = false;
   this.mouseAngle = 0;
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

   if(this.pressingAttack)
      this.shoot(this.mouseAngle);
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

Player.prototype.shoot = function (angle) {
      var bullet = new Bullet(this.id, angle);
      bullet.X = this.X;
      bullet.Y = this.Y;
};


// Bullet class with functions extends from Entity

function Bullet(parent, angle){
   this.id = Math.random();
   this.parent = parent;
   Entity.call(this, this.id);
   this.maxSpd = 10;
   this.spdX = Math.cos(angle/180*Math.PI) * this.maxSpd;
   this.spdY = Math.sin(angle/180*Math.PI) * this.maxSpd;
   this.toRemove = false;
   this.timer = 0;
   this.timerShoot = 0;

   Bullet.list[this.id] = this;
}
Bullet.list = {};

// create an inheritance between objects
extend(Bullet, Entity);

Bullet.prototype.update = function () {
   if(this.timer++ > 100)
      this.toRemove = true;
   Entity.prototype.update.apply(this);

   for (var i in Player.list){
      var _player = Player.list[i];
      if(this.getDistance(_player) < 20 && this.parent != _player.id){
         this.toRemove = true;
      }
   }

};





// server functions

var DEBUG = true;

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
      } else if (data.inputId === 'attack'){
         player.pressingAttack = data.state;
      } else if (data.inputId === 'mouseAngle'){
         player.mouseAngle = data.state;
      }

   });

   socket.on('chatMsgToAll', function (data) {
      if(!data)
         return;

      for(var i in SOCKET_LIST){
         SOCKET_LIST[i].emit('chatMsgSend', Player.list[socket.id].number+': '+ data);
      }
   });

   socket.on('chatMsgToServer', function (data) {
      if(!data || !DEBUG)
         return;
      var _eval = eval(data);
      socket.emit('serverMsg', _eval);

   });
}

function onPlayerDisconnect(socket) {
   console.log("Player disconnected " + socket.id );
   delete Player.list[socket.id];
}

function playersUpdate(){
   var players = [];
   for(var i in Player.list){
      var player = Player.list[i];

      player.update();

      players.push({
         x        : player.X,
         y        : player.Y,
         socketID : player.id,
         number   : player.number
      });
   }

   return players;
}

function bulletsUpdate(){
   var bullets = [];
   for(var i in Bullet.list){
      var bullet = Bullet.list[i];
      if(bullet.toRemove)
         delete Bullet.list[i];
      else{
         bullet.update();

         bullets.push({
            x: bullet.X,
            y: bullet.Y
         });
      }
   }

   return bullets;
}

function userNameExist(data, cb) {
   cb(data.username);
}

function isValidPassword(data, cb) {
   cb(data.pass);
}

function addUser(data, cb) {
   cb(data);
}


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
   socket.id = Math.random();
   SOCKET_LIST[socket.id] = socket;

   socket.on('signInPack', function (data) {
      isValidPassword(data, function (res) {
         if(1||res){
            onPlayerConnect(socket);
            socket.emit('signInResponse', {success:true});
         } else {
            socket.emit('signInResponse', {success:false});
         }
      });

   });

   socket.on('signUpPack', function (data) {
      userNameExist(data, function (res) {
         if(1||res){
            addUser(data, function () {
               onPlayerConnect(socket);
               socket.emit('signUpResponse', {success:true});
            });
         } else {
            socket.emit('signUpResponse', {success:false});
         }
      });
   });



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