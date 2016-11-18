// Base entity class for define base attributes and methods

function Entity(args) {
    this.id = args.id;

    this.map = args.map || 'blue';

    this.spdX = 0;
    this.spdY = 0;

    this.X = args.x || 355 + Math.random() * 1220;
    this.Y = args.y || 355 + Math.random() * 375;
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
    if(!point){
        throw new Error('point does not exist');
    }
    return Math.sqrt(Math.pow(this.X - point.X, 2) + Math.pow(this.Y - point.Y, 2));
};

Entity.prototype.extend = function(Child, Parent){
    var Temp = function () {};
    Temp.prototype = Parent.prototype;
    Child.prototype = new Temp();
    Child.prototype.constructor = Child;
};



module.exports = Entity;
