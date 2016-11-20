var List = require('./List');
var Entity = require('./Entity');
var Bullet = require('./Bullet');

var players = List.players;
var enemies = List.enemies;

// Enemy class with functions extends from Entity

function Enemy(args) {
    Entity.call(this, args);

    this.X = args.x || 1000 + Math.random() * 5495;
    this.Y = args.y || 500 + Math.random() * 3160;
    this.hp = 300;
    this.hpMax = 300;

    this.moveSpd = 0.2;
    this.moveSpdMax = 10;

    this.moveDirection = null;
    this.movingRight = false;
    this.movingLeft = false;
    this.movingUp = false;
    this.movingDown = false;


    this.name = "Pirate";

    this.pressingAttack = true;

    this.shootAngle = 0;
    this.shootDelay = 700;
    this.shootLastTime = Date.now();
    this.shootCan = false;

    this.target = null;

    this.timer = 0;


    enemies[this.id] = this;
}


// create an inheritance between objects
Entity.prototype.extend(Enemy, Entity);


// functions for enemy object

Enemy.prototype.update = function () {
    this.timer++;
    this.updateSpd();

    Entity.prototype.update.apply(this);

    for (var i in players) {
        var player = players[i];
        if (
            this.getDistance(player) <= 450 &&
            this.map === player.map
        ) {
            this.target = player;
            break;
        }
    }

    Date.now() - this.shootLastTime > this.shootDelay ?
        this.shootCan = true :
        this.shootCan = false;

    if (this.target &&
        this.map == this.target.map &&
        this.shootCan &&
        this.getDistance(this.target)<=750
    ) {
        this.shootAngle =
            Math.atan2(
                -this.target.X / 2 + this.X / 2,
                this.target.Y / 2 - this.Y / 2
            ) / Math.PI * 180 + 90;

        this.shoot(this.shootAngle);
        this.shootLastTime = Date.now();
    }
};

Enemy.prototype.updateSpd = function () {
    if(!this.target){
        if(!(this.timer%70))
            this.moveDirection = Math.random();

        if (this.X > 755 && this.moveDirection > 0.75) {
            this.spdX = -this.moveSpdMax * this.moveSpd;
            this.movingLeft = true;
            this.movingRight = false;
            return;
        }else if (this.X < 6495 && this.moveDirection > 0.50) {
            this.spdX = this.moveSpdMax * this.moveSpd;
            this.movingLeft = false;
            this.movingRight = true;
            return;
        }else{
            this.spdX = 0;
            this.movingLeft = false;
            this.movingRight = false;
        }

        if (this.Y > 355 && this.moveDirection > 0.25) {
            this.spdY = -this.moveSpdMax * this.moveSpd;
            this.movingUp = true;
            this.movingDown = false;
            return;
        }else if (this.Y < 3660 && this.moveDirection < 0.25) {
            this.spdY = this.moveSpdMax * this.moveSpd;
            this.movingUp = false;
            this.movingDown = true;
            return;
        }else {
            this.spdY = 0;
            this.movingUp = false;
            this.movingDown = false;
        }

    } else {
        if(this.getDistance(this.target)>1250 &&
            this.target.map === this.map
        ){
            this.target = null;
            return;
        }


        if(this.X < this.target.X-250){
            this.spdX = this.moveSpdMax * this.moveSpd;
            this.movingLeft = false;
            this.movingRight = true;
            this.movingUp = false;
            this.movingDown = false;
        } else if(this.X > this.target.X+250) {
            this.spdX = -this.moveSpdMax * this.moveSpd;
            this.movingLeft = true;
            this.movingRight = false;
            this.movingUp = false;
            this.movingDown = false;
        } else {
            this.movingLeft = false;
            this.movingRight = false;
            this.spdX = 0;
        }

        if(this.Y < this.target.Y-250){
            this.spdY = this.moveSpdMax * this.moveSpd;
            this.movingLeft = false;
            this.movingRight = false;
            this.movingUp = false;
            this.movingDown = true;
        } else if(this.Y > this.target.Y+250) {
            this.spdY = -this.moveSpdMax * this.moveSpd;
            this.movingLeft = false;
            this.movingRight = false;
            this.movingUp = true;
            this.movingDown = false;
        } else {
            this.movingUp = false;
            this.movingDown = false;
            this.spdY = 0;
        }
    }

};

Enemy.prototype.shoot = function (angle) {
    new Bullet({
        parent: this.id,
        angle: angle,
        x: this.X,
        y: this.Y,
        map: this.map
    });
};

Enemy.prototype.getInitPack = function () {
    return {
        x: this.X,
        y: this.Y,
        id: this.id,
        name: this.name,
        hpMax: this.hpMax,
        hp: this.hp,
        map: this.map
    };
};

Enemy.prototype.getUpdatePack = function () {
    return {
        x: this.X,
        y: this.Y,
        id: this.id,
        name: this.name,
        hp: this.hp,
        map: this.map,
        movingLeft: this.movingLeft,
        movingDown: this.movingDown,
        movingRight: this.movingRight,
        movingUp: this.movingUp
    };
};



module.exports = Enemy;