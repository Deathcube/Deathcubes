var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res){
   res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(2000);

console.log("Hello from server!");


var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {

   console.log('socket connection');

   socket.on('recieve', function (data) {
      console.log(data.msg);
   });

   socket.emit('emit', {
      msg: 'hello!'
   });

});