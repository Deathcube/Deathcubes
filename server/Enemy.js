var List = require('./List');
var Entity = require('./Entity');
var Bullet = require('./Bullet');

var players = List.players;
var enemies = List.enemies;

// Enemy class with functions extends from Entity

function Enemy(args) {
    Entity.call(this, args);

    this.hp = 300;
    this.hpMax = 300;

    this.moveSpd = 0.5;
    this.moveSpdMax = 10;

    this.movingRight = false;
    this.movingLeft = false;
    this.movingUp = false;
    this.movingDown = false;

    this.name = "enemy";

    this.pressingAttack = true;

    this.shootAngle = 0;
    this.shootDelay = 500;
    this.shootLastTime = Date.now();
    this.shootCan = false;

    this.target = null;


    enemies[this.id] = this;
}


// create an inheritance between objects
Entity.prototype.extend(Enemy, Entity);


// functions for enemy object

Enemy.prototype.update = function () {

    this.updateSpd();

    Entity.prototype.update.apply(this);

    for (var i in players) {
        var player = players[i];
        if (
            this.getDistance(player) <= 250 &&
            this.map === player.map
        ) {
            this.target = player;
            break;
        } else {
            this.target = null;
        }
    }

    Date.now() - this.shootLastTime > this.shootDelay ?
        this.shootCan = true :
        this.shootCan = false;

    if (this.target && this.shootCan) {
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
    if (Math.random() > 0.9) {
        var randomMoveChance = Math.random();
        if (randomMoveChance > 0.75 && this.X > 355) {
            this.spdX = -this.moveSpdMax * this.moveSpd;
            this.movingLeft = true;
            this.movingRight = false;
            this.movingUp = false;
            this.movingDown = false;
        }
        else if (randomMoveChance > 0.50 && this.X < 1570) {
            this.spdX = this.moveSpdMax * this.moveSpd;
            this.movingLeft = false;
            this.movingRight = true;
            this.movingUp = false;
            this.movingDown = false;
        }
        else
            this.spdX = 0;

        if (randomMoveChance < 0.50 && this.Y > 355) {
            this.spdY = -this.moveSpdMax * this.moveSpd;
            this.movingLeft = false;
            this.movingRight = false;
            this.movingUp = true;
            this.movingDown = false;
        }
        else if (randomMoveChance < 0.25 && this.Y < 730) {
            this.spdY = this.moveSpdMax * this.moveSpd;
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