// usefull libraries
var express = require('express'); // this help to find files in project
var mongojs = require('mongojs'); // this works with database
var profiler = require('v8-profiler'); // this create profiler data

// this variables are main in application and use in general
var app = express();
var server = require('http').Server(app);
var fs = require('fs');
var db = mongojs('mongodb://firstapplication:123@ds139937.mlab.com:39937/gamedb', ['accounts', 'progress']);

// entities

var List = require(__dirname+ '/server/List');
var Entity = require(__dirname+ '/server/Entity');
var Player = require(__dirname+ '/server/Player');
var Enemy = require(__dirname+ '/server/Enemy');
var Bullet = require(__dirname+ '/server/Bullet');



// this open a base page for client - index.html
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
// i dunno what is this
// TODO need to understand this
app.use('/client', express.static(__dirname + '/client'));


// this open a specific host port or :2000 using by localhost
server.listen(process.env.PORT || 2000);

// hello, server! :)
console.log("Server started :)");


// this is a global array contains all socket connections
var TIME = 0;

var Players = List.players;
var Bullets = List.bullets;
var Enemies = List.enemies;



// server part for functions

// this apply to debugging while chat(temporarily)
var DEBUG = true;
var totalEnemies = 0;

// handle player connecting
function onPlayerConnect(socket, name) {
    var map = 'blue';
    if (Math.random() > 0.5)
        map = 'purple';

    var player = new Player({
        id: socket.id,
        name: name,
        map: map
    });

    socket.on('keyPress', function (data) {
        if (data.inputId === 'left') {
            player.pressingLeft = data.state;
        } else if (data.inputId === 'right') {
            player.pressingRight = data.state;
        } else if (data.inputId === 'up') {
            player.pressingUp = data.state;
        } else if (data.inputId === 'down') {
            player.pressingDown = data.state;
        } else if (data.inputId === 'attack') {
            player.pressingAttack = data.state;
        } else if (data.inputId === 'mouseAngle') {
            player.mouseAngle = data.state;
        } else if (data.inputId === 'ability') {
            player.abilityActivate = data.state;
        }

    });

    socket.on('changeMap', function () {
        if (player.map === 'blue') {
            player.map = 'purple';
        } else {
            player.map = 'blue';
        }
    });

    socket.emit('init', {
        selfId: socket.id,
        players: getAllPlayersInitPacks(),
        bullets: getAllBulletsInitPacks(),
        enemies: getAllEnemiesInitPacks()
    });

    for (var i in List.sockets) {
        var _socket = List.sockets[i];
        _socket.emit('create_player', player.getInitPack());
    }

}

// handle player disconnecting
function onPlayerDisconnect(socket) {
    console.log("Player disconnected " + socket.id);
    delete Players[socket.id];
    socket.emit('remove_player', socket.id)
}


// players updating

function playersUpdate() {
    var players = [];
    for (var i in Players) {
        var player = Players[i];

        player.update();

        players.push(player.getUpdatePack());
    }

    return players;
}

function getAllPlayersInitPacks() {
    var players = [];
    for (var i in Players) {
        players.push(Players[i].getInitPack());
    }
    return players;
}


// enemies updating

function enemiesUpdate() {
    if (Math.random() > 0.99 && totalEnemies <= 0) {
        var e = new Enemy({
            id: Math.random(),
            map: Math.random() > 0.5 ? 'blue' : 'purple'
        });
        io.emit('create_enemy', e.getInitPack());
        totalEnemies++;
    }

    var enemies = [];
    for (var i in Enemies) {
        var enemy = Enemies[i];

        enemy.update();

        enemies.push(enemy.getUpdatePack());
    }

    return enemies;
}

function getAllEnemiesInitPacks() {
    var enemies = [];
    for (var i in Enemies) {
        enemies.push(Enemies[i].getInitPack());
    }
    return enemies;
}


// bullets updating

function bulletsUpdate() {
    var bullets = [];
    for (var i in Bullets) {
        var bullet = Bullets[i];
        if (bullet.toRemove) {
            delete Bullets[i];
            io.emit('remove_bullet', i);
        } else if (bullet.new){
            io.emit('create_bullet', bullet.getInitPack());
            bullet.new = false;
        }else{
            bullet.update();

            bullets.push(bullet.getUpdatePack());
        }
    }

    return bullets;
}

function getAllBulletsInitPacks() {
    var bullets = [];
    for (var i in Bullets) {
        bullets.push(Bullets[i].getInitPack());
    }
    return bullets;
}








// functions which works with database

function userNameExist(data, cb) {
    db.accounts.find({username: data.username}, function (err, res) {
        if (res.length > 0) {
            cb(true);
        } else {
            cb(false);
        }
    });
}

function isValidPassword(data, cb) {
    db.accounts.find({username: data.username, password: data.pass}, function (err, res) {
        if (res.length > 0) {
            cb(true);
        } else {
            cb(false);
        }
    });
}

function addUser(data, cb) {
    db.accounts.insert({username: data.username, password: data.pass}, function (err) {
        cb();
    });
}


// this handle main connection or disconnection by users
// TODO need to understand socket.io methods and possibilities
var io = require('socket.io')(server, {});

io.sockets.on('connection', function (socket) {
    // creating and adding a new socket connection
    socket.id = Math.random(); // temporarily
    List.sockets[socket.id] = socket;


    socket.on('signInPack', function (data) {
        isValidPassword(data, function (res) {
            if (res) {
                onPlayerConnect(socket, data.username);
                socket.emit('signInResponse', {success: true});
            } else {
                socket.emit('signInResponse', {success: false});
            }
        });
    });

    socket.on('signUpPack', function (data) {
        userNameExist(data, function (res) {
            if (res) {
                socket.emit('signUpResponse', {success: false});
            } else {
                addUser(data, function () {
                    onPlayerConnect(socket, data.username);
                    socket.emit('signUpResponse', {success: true});
                });
            }
        });
    });


    socket.on('chatMsgToAll', function (data) {
        if (!data)
            return;

        for (var i in List.sockets) {
            List.sockets[i].emit('chatMsgSend', Players[socket.id].name + ': ' + data);
        }
    });

    socket.on('chatMsgToServer', function (data) {
        if (!data || !DEBUG)
            return;
        try {
            var _eval = eval(data);
        } catch (e) {
            _eval = e.message;
        }
        socket.emit('serverMsg', _eval);

    });


    socket.on('disconnect', function () {
        delete List.sockets[socket.id];
        onPlayerDisconnect(socket);
    });
});


// this handling for each single frame(1/25 sec)

setInterval(function () {
    TIME++;
    var _pack = {
        players: playersUpdate(),
        bullets: bulletsUpdate(),
        enemies: enemiesUpdate()
    };
    for (var i in List.sockets) {
        var socket = List.sockets[i];
        socket.emit('update', _pack); //update
    }

}, 40); // that means 25 times per second

/*

function startProfiling(duration) {
    profiler.startProfiling('1', true);
    setTimeout(function () {
        var profile1 = profiler.stopProfiling('1');

        profile1.export(function (error, result) {
            fs.writeFile('./profile.cpuprofile', result);
            profile1.delete();
            console.log('profile saved');
        });
    }, duration);
}*/
