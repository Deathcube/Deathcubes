
// usefull libraries
var express = require('express'); // this help to find files in project
var mongojs = require('mongojs'); // this works with database


// this variables are main in application and use in general
var app = express();
var serv = require('http').Server(app);
var db = mongojs('mongodb://firstapplication:123@ds139937.mlab.com:39937/gamedb', ['accounts', 'progress']);

// this open a base page for client - index.html
app.get('/', function(req, res){
   res.sendFile(__dirname + '/client/index.html');
});
// i dunno what is this
// TODO need to understand this
app.use('/client', express.static(__dirname + '/client'));


// this open a specific host port or :2000 using by localhost
serv.listen(process.env.PORT || 2000);

// hello, server! :)
console.log("Server started :)");




// server part for objects


// this is a global array contains all socket connections
var SOCKET_LIST = {};


// extending function
// this help to create an inheritance between two objects
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


// this is an entity functions

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

function Player(id, name){
   Entity.call(this, id);
   this.name = name;
   this.pressingRight = false;
   this.pressingLeft = false;
   this.pressingUp = false;
   this.pressingDown = false;
   this.pressingAttack = false;
   this.mouseAngle = 0;
   this.spd = 0.5;
   this.maxSpd = 10;
   this.hp = 1000;
   this.hpMax = 1000;
   this.score = 0;
   this.damage = 49;

   Player.list[id] = this;

   initPack.players.push(this.getInitPack());
}

// This global contains all players while game
Player.list = {};


// create an inheritance between objects
extend(Player, Entity);


// functions for player object

Player.prototype.update = function () {
   this.updateSpd();
   Entity.prototype.update.apply(this);

   if(this.pressingAttack)
      this.shoot(this.mouseAngle);
};

Player.prototype.updateSpd = function () {
   if(this.pressingLeft)
      this.spdX = this.maxSpd*this.spd;
   else if(this.pressingRight)
      this.spdX = -this.maxSpd*this.spd;
   else
      this.spdX = 0;

   if(this.pressingUp)
      this.spdY = this.maxSpd*this.spd;
   else if(this.pressingDown)
      this.spdY = -this.maxSpd*this.spd;
   else
      this.spdY = 0;
};

Player.prototype.shoot = function (angle) {
      var bullet = new Bullet(this.id, angle);
      bullet.X = this.X;
      bullet.Y = this.Y;
};

Player.prototype.getInitPack = function () {
   return {
      x     :  this.X,
      y     :  this.Y,
      id    :  this.id,
      name  :  this.name,
      hpMax :  this.hpMax,
      hp    :  this.hp,
      score :  this.score
   };
};

Player.prototype.getUpdatePack = function () {
   return {
      x     :  this.X,
      y     :  this.Y,
      id    :  this.id,
      name  :  this.name,
      hp    :  this.hp,
      score :  this.score
   };
};
















// Bullet class with functions. Extends from Entity

function Bullet(parent, angle){
   this.id = Math.random();
   this.parent = parent;
   Entity.call(this, this.id);
   this.maxSpd = 10;
   this.speed = 1;
   this.spdX = Math.cos(angle/180*Math.PI) * this.maxSpd * this.speed;
   this.spdY = Math.sin(angle/180*Math.PI) * this.maxSpd * this.speed;
   this.toRemove = false;
   this.timer = 0;

   Bullet.list[this.id] = this;

   initPack.bullets.push(this.getInitPack());

}

// this array contains all bullets created while all players playing
Bullet.list = {};

// create an inheritance between objects
extend(Bullet, Entity);


// functions for bullet object

Bullet.prototype.update = function () {
   if(this.timer++ > 70)
      this.toRemove = true;
   Entity.prototype.update.apply(this);

   for (var i in Player.list){
      var _player = Player.list[i];
      if(this.getDistance(_player) < 20 && this.parent != _player.id){
         _player.hp -= 49;

         if(_player.hp <= 0){
            var shooter = Player.list[this.parent];
            if(shooter){
               shooter.score += 1;
            }
            _player.hp = _player.hpMax;
            _player.X = Math.random() * 475;
            _player.Y = Math.random() * 475;
         }
         this.toRemove = true;
      }
   }

};

Bullet.prototype.getInitPack = function () {
   return {
      id    :  this.id,
      x     :  this.X,
      y     :  this.Y
   };
};

Bullet.prototype.getUpdatePack = function () {
   return {
      x     :  this.X,
      y     :  this.Y,
      id    :  this.id
   };
};






















// server part for functions

// this apply to debugging while chat(temporarily)
var DEBUG = true;


// handle player connecting
function onPlayerConnect(socket, name) {
   var player = new Player(socket.id, name);

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

   socket.emit('init', {
      selfId   : socket.id,
      players  : getAllPlayersInitPacks(),
      bullets  : getAllBulletsInitPacks()
   })
}

// handle player disconnecting
function onPlayerDisconnect(socket) {
   console.log("Player disconnected " + socket.id );
   delete Player.list[socket.id];
   removePack.players.push(socket.id);
}


// players updating

function playersUpdate(){
   var players = [];
   for(var i in Player.list){
      var player = Player.list[i];

      player.update();

      players.push(player.getUpdatePack());
   }

   return players;
}

function getAllPlayersInitPacks() {
   var players = [];
   for(var i in Player.list){
      players.push(Player.list[i].getInitPack());
   }
   return players;
}


// bullets updating

function bulletsUpdate(){
   var bullets = [];
   for(var i in Bullet.list){
      var bullet = Bullet.list[i];
      if(bullet.toRemove) {
         delete Bullet.list[i];
         removePack.bullets.push(bullet.id);
      }else{
         bullet.update();

         bullets.push(bullet.getUpdatePack());
      }
   }

   return bullets;
}

function getAllBulletsInitPacks() {
   var bullets = [];
   for(var i in Bullet.list){
      bullets.push(Bullet.list[i].getInitPack());
   }
   return bullets;
}




// functions which works with database

function userNameExist(data, cb) {
   db.accounts.find({username:data.username}, function (err, res) {
      if(res.length > 0){
         cb(true);
      } else {
         cb(false);
      }
   });
}

function isValidPassword(data, cb) {
   db.accounts.find({username:data.username, password:data.pass}, function (err, res) {
      if(res.length > 0){
         cb(true);
      } else {
         cb(false);
      }
   });
}

function addUser(data, cb) {
   db.accounts.insert({username:data.username, password:data.pass}, function (err) {
      cb();
   });
}



// this handle main connection or disconnection by users
// TODO need to understand socket.io methods and possibilities
var io = require('socket.io')(serv, {});

io.sockets.on('connection', function (socket) {
   // creating and adding a new socket connection
   socket.id = Math.random(); // temporarily
   SOCKET_LIST[socket.id] = socket;


   socket.on('signInPack', function (data) {
      isValidPassword(data, function (res) {
         if(res){
            onPlayerConnect(socket, data.username);
            socket.emit('signInResponse', {success:true});
         } else {
            socket.emit('signInResponse', {success:false});
         }
      });
   });

   socket.on('signUpPack', function (data) {
      userNameExist(data, function (res) {
         if(res){
            socket.emit('signUpResponse', {success:false});
         } else {
            addUser(data, function () {
               onPlayerConnect(socket, data.username);
               socket.emit('signUpResponse', {success:true});
            });
         }
      });
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



   socket.on('disconnect', function () {
      delete SOCKET_LIST[socket.id];
      onPlayerDisconnect(socket);
   });
});



// this handling for each single frame
var initPack = {players:[],bullets:[]};
var removePack = {players:[],bullets:[]};

setInterval(function () {
   var pack = {
    players : playersUpdate(),
    bullets : bulletsUpdate()
   };

   for(var i in SOCKET_LIST){
      var socket = SOCKET_LIST[i];
      socket.emit('init', initPack);
      socket.emit('update', pack); //update
      socket.emit('remove', removePack);
   }
   // avoiding duplications
   initPack.players = [];     
   initPack.bullets = [];
   removePack.players = [];
   removePack.bullets = [];

}, 40); // that means 25 times per second