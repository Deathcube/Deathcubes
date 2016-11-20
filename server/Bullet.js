var List = require('./List');
var Entity = require('./Entity');

var players = List.players;
var enemies = List.enemies;
var bullets = List.bullets;

// Bullet class with functions. Extends from Entity

function Bullet(args) {
    Entity.call(this, args);

    this.angle = args.angle || null;

    this.id = Math.random();

    this.moveSpdMax = 10;
    this.moveSpd = 2.5;

    this.new = true;

    this.parent = args.parent || null;


    this.spdX = Math.cos(this.angle / 180 * Math.PI) * this.moveSpdMax * this.moveSpd;
    this.spdY = Math.sin(this.angle / 180 * Math.PI) * this.moveSpdMax * this.moveSpd;

    this.timer = 0;
    this.toRemove = false;


    bullets[this.id] = this;

}


// create an inheritance between objects
Entity.prototype.extend(Bullet, Entity);


// functions for bullet object

Bullet.prototype.update = function () {

    if (this.timer++ > 70)
        this.toRemove = true;

    Entity.prototype.update.apply(this);

    var player,enemy, shooter;

    for (var i in players) {
         player = players[i];
        if (
            player.map === this.map &&
            this.getDistance(player) < 20 &&
            this.parent != player.id
        ) {
            player.hp -= 49;

            if (player.hp <= 0) {
                shooter = players[this.parent];
                if (shooter) {
                    shooter.score += 1;
                }
                player.hp = player.hpMax;
                player.X = 750 + Math.random() * 250;
                player.Y = 350 + Math.random() * 250;
            }
            this.toRemove = true;
        }
    }


    for (var j in enemies) {
        enemy = enemies[j];
        if (
            enemy.map === this.map &&
            this.getDistance(enemy) < 20 &&
            this.parent != enemy.id &&
            !(enemies[this.parent])
        ) {
            enemy.hp -= 49;
            shooter = players[this.parent];
            enemy.target = shooter;
            if (enemy.hp <= 0) {
                if (shooter) {
                    shooter.score += 1;
                }
                enemy.hp = enemy.hpMax;
                enemy.X = 1000 + Math.random() * 5495;
                enemy.Y = 500 + Math.random() * 3160;
            }
            this.toRemove = true;
        }
    }

};

Bullet.prototype.getInitPack = function () {
    return {
        id: this.id,
        x: this.X,
        y: this.Y,
        map: this.map
    };
};

Bullet.prototype.getUpdatePack = function () {
    return {
        x: this.X,
        y: this.Y,
        id: this.id
    };
};



module.exports = Bullet;
