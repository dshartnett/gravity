(function(){

"use strict";

var CONST =
{
FPS: 60,
UPS: 60,
TIME_INTERVAL: 1000,
FRAME_MAX: 30,

CANVAS_WIDTH: 840,
CANVAS_HEIGHT: 420,

MAP_WIDTH: 2560,
MAP_HEIGHT: 1280,

BACKGROUND_STARS0: 1000,
BACKGROUND_STARS1: 1000,
BACKGROUND_PLANETS0: 10,
BACKGROUND_PLANET_SIZE_MIN: 30,
BACKGROUND_PLANET_SIZE_RANGE: 20,

PARTICLE_SIZE: 4,
PARTICLE_WALL_LOSS: 0.5,
PARTICLE_MASS: 100,
PARTICLE_CHARGE: 100,
PARTICLE_INITIAL_VELOCITY: .7, // pixels per millisecond
PARTICLE_ARRAY_MAX_SIZE: 100,

PLAYER_MAX_HEALTH: 1000,
PLAYER_MAX_ENERGY: 1000,
PLAYER_RADIUS: 20,
PLAYER_SHIELD_RADIUS: 26,
PLAYER_SHIELD_FADE_MAX: 700,
PLAYER_WING_ANGLE: 5*Math.PI/6,
PLAYER_WING_ANGLE_SIN: 20*Math.sin(5*Math.PI/6),
PLAYER_WING_ANGLE_COS: 20*Math.cos(5*Math.PI/6),
PLAYER_ACCELERATION: 0.0007,
PLAYER_ROTATE_SPEED: 1/360,
PLAYER_FRICTION: 0.001,
PLAYER_WALL_LOSS: 0.5,
PLAYER_FIRE_BATTERY: 120,
PLAYER_MASS: 2000,

COMMAND_ROTATE_CC: 1,
COMMAND_MOVE_FORWARD: 2,
COMMAND_ROTATE_CW: 4,
COMMAND_MOVE_BACKWARD: 8,
COMMAND_STRAFE_RIGHT: 16,
COMMAND_STRAFE_LEFT: 32,

COMMAND_FIRE: 1,
};

setInterval(function () {
	console.log(Date.now() + "    " + Math.random()*Math.pow(2,32));
},1000/CONST.UPS);

var app = require('http').createServer(handler)
	, io = require('socket.io').listen(app)
	, staticReq = require('node-static'); // for serving files

// This will make all the files in the current folder accessible
var fileServer = new staticReq.Server('./');
	
// http://localhost:8080
app.listen(8080);

// If the URL of the socket server is opened in a browser
function handler(request, response) {request.addListener('end', function () {fileServer.serve(request, response);}); }
//function handler(request, response) {response.writeHeader(200, {'Content-Type': 'text/plain'});  response.end('Hello World\n');}

// Delete this row if you want to see debug messages
io.set('log level', 1);

var PLAYER_ID = 0;

var player_list = {};
// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {
	PLAYER_ID++;
	player_list[socket.id] = {"player_id":PLAYER_ID,x:0,y:0,angle:0};

	socket.emit("constant_field",CONST);

	// Start listening for mouse move events
	/*
	socket.on('mousemove', function (data) {
		
		// This line sends the event (broadcasts it)
		// to everyone except the originating client.
		socket.broadcast.emit('moving', data);
	});*/
	
	socket.on('ping', function(data) {
		console.log("pinged; interval:" + data + " player id: " + player_list[socket.id].player_id);
		socket.emit("pong",PLAYER_ID);
	});

	socket.on('player_position', function(data) {
		player_list[socket.id].x = data.x;
		player_list[socket.id].y = data.y;
		socket.broadcast.emit('player_position',data);
	});
	socket.on('disconnect', function(){
		console.log("player " + player_list[socket.id].player_id + " disconnected");
		socket.broadcast.emit('player_removed', PLAYER_ID);
		delete player_list[socket.id];
	});
});
})();
