var List = require('./List');
var Entity = require('./Entity');
var Bullet = require('./Bullet');

var players = List.players;


// Player class with functions extends from Entity

function Player(args) {
    Entity.call(this, args);

    this.abilityActivate = false;
    this.abilityActivated = false;
    this.abilityActivationTime = 0;
    this.abilityActivationDelay = 15000;
    this.abilityDuration = 5000;

    this.attackSpd = 1;
    this.attackSpdBase = 1;

    this.hp = 300;
    this.hpMax = 300;

    this.mouseAngle = 0;
    this.moveSpd = 0.4;
    this.moveSpdMax = 10;

    this.name = args.name;

    this.pressingRight = false;
    this.pressingLeft = false;
    this.pressingUp = false;
    this.pressingDown = false;
    this.pressingAttack = false;

    this.score = 0;

    this.shootDelay = 500;
    this.shootLastTime = Date.now();
    this.shootCan = false;


    players[this.id] = this;
}

// create an inheritance between objects
Entity.prototype.extend(Player, Entity);


// functions for player object

Player.prototype.update = function () {

    this.updateSpd();

    Entity.prototype.update.apply(this);

    var time = Date.now();

    time - this.shootLastTime > this.shootDelay/this.attackSpd ?
        this.shootCan = true :
        this.shootCan = false;

    if (this.pressingAttack && this.shootCan) {
        this.shoot(this.mouseAngle);
        this.shootLastTime = Date.now();
    }

    if(!this.abilityActivated) {
        if (
            this.abilityActivate &&
            time - this.abilityActivationTime >= this.abilityActivationDelay
        ) {
            this.abilityActivation();
            this.abilityActivationTime = Date.now();
            this.abilityActivated = true;
            this.abilityActivate = false;
        } else {
            this.abilityActivate = false;
        }
    } else {
        if(time - this.abilityActivationTime > this.abilityDuration){
            this.abilityDeActivation();
            this.abilityActivated = false;
        }
    }
};

Player.prototype.updateSpd = function () {
    if (this.pressingLeft && this.X > 355)
        this.spdX = -this.moveSpdMax * this.moveSpd;
    else if (this.pressingRight && this.X < 1570)
        this.spdX = this.moveSpdMax * this.moveSpd;
    else
        this.spdX = 0;

    if (this.pressingUp && this.Y > 355)
        this.spdY = -this.moveSpdMax * this.moveSpd;
    else if (this.pressingDown && this.Y < 730)
        this.spdY = this.moveSpdMax * this.moveSpd;
    else
        this.spdY = 0;
};

Player.prototype.shoot = function (angle) {
    new Bullet({
        parent: this.id,
        angle: angle,
        x: this.X,
        y: this.Y,
        map: this.map
    });
};

Player.prototype.abilityActivation = function () {
    this.attackSpd += 3;
};
Player.prototype.abilityDeActivation = function () {
    this.attackSpd = this.attackSpdBase;
};

Player.prototype.getInitPack = function () {
    return {
        x: this.X,
        y: this.Y,
        id: this.id,
        name: this.name,
        hpMax: this.hpMax,
        hp: this.hp,
        score: this.score,
        map: this.map
    };
};

Player.prototype.getUpdatePack = function () {
    return {
        x: this.X,
        y: this.Y,
        id: this.id,
        name: this.name,
        hp: this.hp,
        score: this.score,
        map: this.map,
        pressingLeft: this.pressingLeft,
        pressingDown: this.pressingDown,
        pressingRight: this.pressingRight,
        pressingUp: this.pressingUp,
        abilityActivate: this.abilityActivate,
        abilityActivated: this.abilityActivated,
        abilityActivationTime: this.abilityActivationTime
    };
};


module.exports = Player;