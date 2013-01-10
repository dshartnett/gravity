(function(){

"use strict";

var CONST =
{
FPS: 60,
UPS: 35,
TIME_INTERVAL: 1000,
FRAME_MAX: 30,

CANVAS_WIDTH: 840,
CANVAS_HEIGHT: 420,

MAP_WIDTH: 2560,
MAP_HEIGHT: 1280,

BACKGROUND_STARS0: 10000,
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
PLAYER_MOVING: 63,

COMMAND_FIRE: 1024,
};

setInterval(function () {
	//console.log(Date.now() + "    " + Math.random()*Math.pow(2,32));
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
	player_list[socket.id] = {player_id:PLAYER_ID, start_interval: Date.now(), end_interval: null, data:{x:CONST.MAP_WIDTH/2, y:CONST.MAP_HEIGHT/2, angle:0}, player:new Player()};
	
	player_list[socket.id].player.pos_x = player_list[socket.id].data.x;
	player_list[socket.id].player.pos_y = player_list[socket.id].data.y;
	player_list[socket.id].player.angle = player_list[socket.id].data.angle;

	console.log("player " + PLAYER_ID + " connected on socket " + socket.id + ". ponging now...");
	socket.emit("pong",player_list[socket.id].data);
	
	socket.on('ping', function(data) {
		player_list[socket.id].end_interval = Date.now();
		var interval = player_list[socket.id].end_interval - player_list[socket.id].start_interval;
		console.log("pinged with: " + data + " player id: " + player_list[socket.id].player_id + "  socket id: " + socket.id + " interval: " + interval);
		
		player_list[socket.id].player.move_command_state = data;
		player_list[socket.id].player.update(interval);
		player_list[socket.id].data.x = player_list[socket.id].player.pos_x;
		player_list[socket.id].data.y = player_list[socket.id].player.pos_y;
		player_list[socket.id].data.angle = player_list[socket.id].player.angle;
		
		player_list[socket.id].start_interval = Date.now();
		socket.emit("pong",player_list[socket.id].data);
	});

	socket.on('disconnect', function(){
		console.log("player " + player_list[socket.id].player_id + " disconnected");
		socket.broadcast.emit('player_removed', PLAYER_ID);
		delete player_list[socket.id];
	});
});

function Player(){
	this.pos_x = 500;
	this.pos_y = 500;
	this.angle = 0;
	
	this.v_x = 0;
	this.v_y = 0;
	this.radius = CONST.PLAYER_RADIUS;
	this.wing_angle = CONST.PLAYER_WING_ANGLE;
	this.team_color = 'red';
	
	this.mass = CONST.PLAYER_MASS;
	
	this.shield_fade = 0;
	this.fire_battery = 0;
	
	this.move_command_state = 0;
	
	this.server_set = false;
	
	this.update = function (interval) {
		this.v_x -= CONST.PLAYER_FRICTION*this.v_x*interval;
		this.v_y -= CONST.PLAYER_FRICTION*this.v_y*interval;

		if (this.shield_fade > 0) this.shield_fade -= interval;
		if (this.fire_battery > 0) this.fire_battery -= interval;

		if (this.move_command_state & CONST.COMMAND_ROTATE_CC) this.angle -= CONST.PLAYER_ROTATE_SPEED*interval;
		if (this.move_command_state & CONST.COMMAND_MOVE_FORWARD)
		{
			this.v_x += CONST.PLAYER_ACCELERATION*interval*Math.cos(this.angle);
			this.v_y += CONST.PLAYER_ACCELERATION*interval*Math.sin(this.angle);
		}
		if (this.move_command_state & CONST.COMMAND_ROTATE_CW) this.angle += CONST.PLAYER_ROTATE_SPEED*interval;
		if (this.move_command_state & CONST.COMMAND_MOVE_BACKWARD)
		{
			this.v_x -= CONST.PLAYER_ACCELERATION*interval*Math.cos(this.angle);
			this.v_y -= CONST.PLAYER_ACCELERATION*interval*Math.sin(this.angle);
		}
		if (this.move_command_state & CONST.COMMAND_STRAFE_LEFT)
		{
			this.v_x += CONST.PLAYER_ACCELERATION*interval*Math.sin(this.angle);
			this.v_y -= CONST.PLAYER_ACCELERATION*interval*Math.cos(this.angle);
		}
		if (this.move_command_state & CONST.COMMAND_STRAFE_RIGHT)
		{
			this.v_x -= CONST.PLAYER_ACCELERATION*interval*Math.sin(this.angle);
			this.v_y += CONST.PLAYER_ACCELERATION*interval*Math.cos(this.angle);
		}
		/*
		if (this.fire_battery <= 0 && this.move_command_state & CONST.COMMAND_FIRE)
		{
			this.request_state += CONST.COMMAND_FIRE;
			this.fire_battery = CONST.PLAYER_FIRE_BATTERY;
			this.v_x -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.cos(this.angle)/this.mass;
			this.v_y -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.sin(this.angle)/this.mass;
		}*/

		this.pos_x += this.v_x*interval;
		this.pos_y += this.v_y*interval;

		if (this.pos_x - this.radius <= 0)
			{this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}
		else if (this.pos_x + this.radius >= CONST.MAP_WIDTH)
			{this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = CONST.MAP_WIDTH-this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}
		if (this.pos_y - this.radius <= 0)
			{this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}
		else if (this.pos_y + this.radius >= CONST.MAP_HEIGHT)
			{this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = CONST.MAP_HEIGHT-this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}
	};
	return this;
}

})();
