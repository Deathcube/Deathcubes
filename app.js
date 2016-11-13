
// usefull libraries
var express = require('express'); // this help to find files in project
var mongojs = require('mongojs'); // this works with database
var profiler = require('v8-profiler'); // this create profiler data

// this variables are main in application and use in general
var app = express();
var serv = require('http').Server(app);
var fs = require('fs');
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

function Entity(args) {
   this.id = args.id;
   this.X = args.x ||355 + Math.random() * 1220;
   this.Y = args.y ||355 + Math.random() * 375;
   this.spdX = 0;
   this.spdY = 0;
   this.map = args.map || 'blue';
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

function Player(args){
   Entity.call(this, args);
   this.name = args.name;
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

   Player.list[this.id] = this;

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
   if(this.pressingLeft && this.X > 355)
      this.spdX = -this.maxSpd*this.spd;
   else if(this.pressingRight && this.X < 1570)
      this.spdX = this.maxSpd*this.spd;
   else
      this.spdX = 0;

   if(this.pressingUp && this.Y > 355)
      this.spdY = -this.maxSpd*this.spd;
   else if(this.pressingDown && this.Y < 730)
      this.spdY = this.maxSpd*this.spd;
   else
      this.spdY = 0;
};

Player.prototype.shoot = function (angle) {
      new Bullet({
          parent:this.id,
          angle:angle,
          x:this.X,
          y:this.Y,
          map:this.map
      });
};

Player.prototype.getInitPack = function () {
   return {
      x     :  this.X,
      y     :  this.Y,
      id    :  this.id,
      name  :  this.name,
      hpMax :  this.hpMax,
      hp    :  this.hp,
      score :  this.score,
      map   :  this.map
   };
};

Player.prototype.getUpdatePack = function () {
   return {
      x     :  this.X,
      y     :  this.Y,
      id    :  this.id,
      name  :  this.name,
      hp    :  this.hp,
      score :  this.score,
      map   :  this.map,
      pressingLeft : this.pressingLeft,
      pressingDown : this.pressingDown,
      pressingRight : this.pressingRight,
      pressingUp : this.pressingUp
   };
};















// Enemy class with functions extends from Entity

function Enemy(args){
   Entity.call(this, args);
   this.name = "enemy";
   this.shootAngle = 0;
   this.spd = 0.5;
   this.maxSpd = 10;
   this.hp = 1000;
   this.hpMax = 1000;
   this.movingRight = false;
   this.movingLeft = false;
   this.movingUp = false;
   this.movingDown = false;
   this.pressingAttack = true;
   this.target = null;

   Enemy.list[this.id] = this;

   initPack.enemies.push(this.getInitPack());
}

// This global contains all players while game
Enemy.list = {};
var totalEnemies = 0;


// create an inheritance between objects
extend(Enemy, Entity);


// functions for enemy object

Enemy.prototype.update = function () {
   this.updateSpd();
   Entity.prototype.update.apply(this);
   for (var i in Player.list) {
      var _player = Player.list[i];
      if(this.getDistance(_player) <= 250){
         this.target = _player;
         break;
      } else {
         this.target = null;
      }
   }

   if(this.target){
      this.shootAngle = Math.atan2(-this.target.X/2+this.X/2,this.target.Y/2-this.Y/2)/Math.PI*180+90;
      this.shoot(this.shootAngle);
   }

};

Enemy.prototype.updateSpd = function () {
   if(Math.random() > 0.9){
      var randomMoveChance = Math.random();
      if(randomMoveChance>0.75 && this.X > 355){
         this.spdX = -this.maxSpd*this.spd;
         this.movingLeft = true;
         this.movingRight = false;
         this.movingUp = false;
         this.movingDown = false;
      }
      else if(randomMoveChance>0.50 && this.X < 1570){
         this.spdX = this.maxSpd*this.spd;
         this.movingLeft = false;
         this.movingRight = true;
         this.movingUp = false;
         this.movingDown = false;
      }
      else
         this.spdX = 0;

      if(randomMoveChance<0.50 && this.Y > 355){
         this.spdY = -this.maxSpd*this.spd;
         this.movingLeft = false;
         this.movingRight = false;
         this.movingUp = true;
         this.movingDown = false;
      }
      else if(randomMoveChance<0.25 && this.Y < 730){
         this.spdY = this.maxSpd*this.spd;
         this.movingLeft = false;
         this.movingRight = false;
         this.movingUp = false;
         this.movingDown = true;
      }
      else
         this.spdY = 0;
   }
};

Enemy.prototype.shoot = function (angle) {
   new Bullet({
      parent:this.id,
      angle:angle,
      x:this.X,
      y:this.Y,
      map:this.map
   });
};

Enemy.prototype.getInitPack = function () {
   return {
      x     :  this.X,
      y     :  this.Y,
      id    :  this.id,
      name  :  this.name,
      hpMax :  this.hpMax,
      hp    :  this.hp,
      map   :  this.map
   };
};

Enemy.prototype.getUpdatePack = function () {
   return {
      x     :  this.X,
      y     :  this.Y,
      id    :  this.id,
      name  :  this.name,
      hp    :  this.hp,
      map   :  this.map,
      movingLeft : this.movingLeft,
      movingDown : this.movingDown,
      movingRight : this.movingRight,
      movingUp : this.movingUp
   };
};














// Bullet class with functions. Extends from Entity

function Bullet(args){
   Entity.call(this, args);
   this.id = Math.random();
   this.parent = args.parent;
   this.maxSpd = 10;
   this.speed = 2.5;
   this.angle = args.angle;
   this.spdX = Math.cos(this.angle/180*Math.PI) * this.maxSpd * this.speed;
   this.spdY = Math.sin(this.angle/180*Math.PI) * this.maxSpd * this.speed;
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
      if(
          _player.map === this.map &&
          this.getDistance(_player) < 20 &&
          this.parent != _player.id
      ){
         _player.hp -= 49;

         if(_player.hp <= 0){
            var shooter = Player.list[this.parent];
            if(shooter){
               shooter.score += 1;
            }
            _player.hp = _player.hpMax;
            _player.X = 355 + Math.random() * 610;
            _player.Y = 355 + Math.random() * 375;
         }
         this.toRemove = true;
      }
   }
   for (var i in Enemy.list){
      var _enemy = Enemy.list[i];
      if(
          _enemy.map === this.map &&
          this.getDistance(_enemy) < 20 &&
          this.parent != _enemy.id &&
          !(Enemy.list[this.parent])
      ){
         _enemy.hp -= 49;

         if(_enemy.hp <= 0){
            var shooter = Player.list[this.parent];
            if(shooter){
               shooter.score += 1;
            }
            _enemy.hp = _enemy.hpMax;
            _enemy.X = 965 + Math.random() * 610;
            _enemy.Y = 355 + Math.random() * 375;
         }
         this.toRemove = true;
      }
   }


};

Bullet.prototype.getInitPack = function () {
   return {
      id    :  this.id,
      x     :  this.X,
      y     :  this.Y,
      map   :  this.map
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
   var map = 'blue';
    if(Math.random() > 0.5)
        map = 'purple';
   var player = new Player({
       id:socket.id,
       name:name,
       map:map
   });

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

   socket.on('changeMap', function () {
      if(player.map === 'blue'){
         player.map = 'purple';
      } else {
         player.map = 'blue';
      }
   });

   socket.emit('init', {
      selfId   : socket.id,
      players  : getAllPlayersInitPacks(),
      bullets  : getAllBulletsInitPacks(),
      enemies  : getAllEnemiesInitPacks()
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




// enemies updating

function enemiesUpdate(){
   if(Math.random() > 0.99 && totalEnemies <= 10){
      new Enemy({
         id:Math.random(),
         map:Math.random()>0.5?'blue':'purple'
      });
      totalEnemies++;
   }

   var enemies = [];
   for(var i in Enemy.list){
      var enemy = Enemy.list[i];

      enemy.update();

      enemies.push(enemy.getUpdatePack());
   }

   return enemies;
}

function getAllEnemiesInitPacks() {
   var enemies = [];
   for(var i in Enemy.list){
      enemies.push(Enemy.list[i].getInitPack());
   }
   return enemies;
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
         SOCKET_LIST[i].emit('chatMsgSend', Player.list[socket.id].name+': '+ data);
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
var initPack = {players:[],bullets:[],enemies:[]};
var removePack = {players:[],bullets:[],enemies:[]};

setInterval(function () {
   var pack = {
    players : playersUpdate(),
    bullets : bulletsUpdate(),
    enemies : enemiesUpdate()
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
   initPack.enemies = [];
   removePack.players = [];
   removePack.bullets = [];
   removePack.enemies = [];

}, 40); // that means 25 times per second




function startProfiling(duration) {
   profiler.startProfiling('1', true);
   setTimeout(function () {
      var profile1 = profiler.stopProfiling('1');

      profile1.export(function (error, result) {
         fs.writeFile('./profile.cpuprofile', result);
         profile1.delete();
         console.log('profile saved');
      });
   },duration);
}