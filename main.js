(function () {

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

BACKGROUND_STARS0: 10000,
BACKGROUND_STARS1: 1000,
BACKGROUND_PLANETS0: 10,
BACKGROUND_PLANET_SIZE_MIN: 30,
BACKGROUND_PLANET_SIZE_RANGE: 20,

PARTICLE_SIZE: 4,
PARTICLE_WALL_LOSS: 0.5,
PARTICLE_MASS: 100,
PARTICLE_CHARGE: 100,
PARTICLE_INITIAL_VELOCITY: 0.7, // pixels per millisecond
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

window.requestAnimFrame = (function () {
 return window.requestAnimationFrame
 					|| window.webkitRequestAnimationFrame
 					|| window.mozRequestAnimationFrame
 					|| window.oRequestAnimationFrame
 					|| window.msRequestAnimationFrame
 					|| function(callback){window.setTimeout(callback, 1000 / CONST.FPS);};
}
)();

function Timer()
{
	this.then = Date.now();
	this.int_count = 0;

	this.time_array = [];
	this.time_array_index = 0;
	this.frame_count = 0;
	this.time_count = 0;
}

Timer.prototype = {
	get interval(){
		var i = Date.now() - this.then;
		this.then = Date.now();

// alternate method is a bit more elegant but slower... array shifting is bad
/*		this.time_array.push(i);
		if (this.frame_count == CONST.FRAME_MAX)
			this.time_count -= this.time_array.shift();
		else
			this.frame_count++;
//*/
		this.time_array_index++;
		if (this.time_array_index >= CONST.FRAME_MAX) this.time_array_index = 0;

		if (this.frame_count >= CONST.FRAME_MAX) this.time_count -= this.time_array[this.time_array_index];
		else this.frame_count++;

		this.time_array[this.time_array_index] = i;
//*/

		this.time_count += i;
		this.int_count++;
		return i;
	},
	get i_count(){return this.int_count;},
	get frame_rate(){return 1000*this.frame_count/this.time_count;}
};

function Background ()
{
	var self = this;
	this.background_ready = false;

	var background_canvas = $("<canvas id='background_canvas' width='" + CONST.MAP_WIDTH + "' height='" + CONST.MAP_HEIGHT + "'>Update your browser :P</canvas>");
	var background_context = background_canvas.get(0).getContext('2d');
	var background_img = new Image();

	var sf_0 = [];
	var pf_0 = [];

	this.initialize = function () {
		console.log("Generating background...");
		var gradient = background_context.createLinearGradient(0,0,CONST.MAP_WIDTH,CONST.MAP_HEIGHT);
		gradient.addColorStop(0.0,"black");
		gradient.addColorStop(0.3,"black");
		gradient.addColorStop(0.5,"purple");
		gradient.addColorStop(0.7,"black");
		gradient.addColorStop(1.0,"black");
		background_context.fillStyle = gradient;
		background_context.fillRect(0,0,CONST.MAP_WIDTH,CONST.MAP_HEIGHT);//*/
		
		console.log("Generating star field...");
		background_context.fillStyle = 'white';
		for (var i = 0; i < CONST.BACKGROUND_STARS0; i++){
			var star = {x:Math.random()*CONST.MAP_WIDTH, y: Math.random()*CONST.MAP_HEIGHT, star_size:Math.floor(1 + 2*Math.random())};
			sf_0.push(star);
			background_context.fillRect(sf_0[i].x, sf_0[i].y, sf_0[i].star_size, sf_0[i].star_size);
		}
		
		for (var i = 0; i < CONST.BACKGROUND_PLANETS0; i++){
			var planet = {x:Math.random()*CONST.MAP_WIDTH, y: Math.random()*CONST.MAP_HEIGHT, planet_radius:CONST.BACKGROUND_PLANET_SIZE_MIN + CONST.BACKGROUND_PLANET_SIZE_RANGE*Math.random()};
			pf_0.push(planet);
		}
		
		console.log("Loading background to memory...");
		background_img.onload = function() {self.ready();};
		background_img.src = background_canvas.get(0).toDataURL();
	}

	this.ready = function () {console.log("Background loaded."); this.background_ready = true;}

	this.draw = function (context, pos_x, pos_y) {
		context.drawImage(background_img, pos_x, pos_y, CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT, 0, 0, CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT);
		/*context.fillStyle = 'black';
		context.fillRect(0,0,CONST.CANVAS_WIDTH,CONST.CANVAS_HEIGHT);
		context.fillStyle = 'white';
		for (var i = 0; i < CONST.BACKGROUND_STARS0; i++)
			if (sf_0[i].x >= pos_x && sf_0[i].x <= pos_x + CONST.CANVAS_WIDTH && sf_0[i].y >= pos_y && sf_0[i].y <= pos_y + CONST.CANVAS_HEIGHT)
				context.fillRect(sf_0[i].x - pos_x, sf_0[i].y - pos_y, sf_0[i].star_size, sf_0[i].star_size);
		//*/
	}
	return this;
}

function Player(){
	this.pos_x = 500;
	this.pos_y = 500;
	this.angle = 0;
	this.v_x = 0;
	this.v_y = 0;
	this.radius = CONST.PLAYER_RADIUS;
	this.wing_angle = CONST.PLAYER_WING_ANGLE;
	this.team_color = 'lime';
	
	this.map_pos_x = this.pos_x - CONST.CANVAS_WIDTH/2;
	this.map_pos_y = this.pos_y - CONST.CANVAS_HEIGHT/2;
	this.canvas_pos_x = CONST.CANVAS_WIDTH/2;
	this.canvas_pos_y = CONST.CANVAS_HEIGHT/2;
	
	this.mass = CONST.PLAYER_MASS;
	
	this.shield_fade = 0;
	this.fire_battery = 0;
	
	this.move_command_state = 0;
	
	this.request_state = 0;
	
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
		
		if (this.fire_battery <= 0 && this.move_command_state & CONST.COMMAND_FIRE)
		{
			this.request_state += CONST.COMMAND_FIRE;
			this.fire_battery = CONST.PLAYER_FIRE_BATTERY;
			this.v_x -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.cos(this.angle)/this.mass;
			this.v_y -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.sin(this.angle)/this.mass;
		}

		this.pos_x += this.v_x*interval;
		this.pos_y += this.v_y*interval;

		// Handles wall bounce
		if (this.pos_x - this.radius <= 0)
			{this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}
		else if (this.pos_x + this.radius >= CONST.MAP_WIDTH)
			{this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = CONST.MAP_WIDTH-this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}
		if (this.pos_y - this.radius <= 0)
			{this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}
		else if (this.pos_y + this.radius >= CONST.MAP_HEIGHT)
			{this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = CONST.MAP_HEIGHT-this.radius; this.shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;}

		// Handles map location for drawing
		if (this.pos_x <= CONST.CANVAS_WIDTH/2)
			{this.map_pos_x = 0; this.canvas_pos_x = this.pos_x;}
		else if (this.pos_x >= CONST.MAP_WIDTH - CONST.CANVAS_WIDTH/2)
			{this.map_pos_x = CONST.MAP_WIDTH - CONST.CANVAS_WIDTH; this.canvas_pos_x = CONST.CANVAS_WIDTH - CONST.MAP_WIDTH + this.pos_x;}
		else {this.map_pos_x = this.pos_x - CONST.CANVAS_WIDTH/2; this.canvas_pos_x = CONST.CANVAS_WIDTH/2;}

		if (this.pos_y <= CONST.CANVAS_HEIGHT/2)
			{this.map_pos_y = 0; this.canvas_pos_y = this.pos_y;}
		else if (this.pos_y >= CONST.MAP_HEIGHT - CONST.CANVAS_HEIGHT/2)
			{this.map_pos_y = CONST.MAP_HEIGHT - CONST.CANVAS_HEIGHT; this.canvas_pos_y = CONST.CANVAS_HEIGHT - CONST.MAP_HEIGHT + this.pos_y;}
		else {this.map_pos_y = this.pos_y - CONST.CANVAS_HEIGHT/2; this.canvas_pos_y = CONST.CANVAS_HEIGHT/2;}

		this.move_command_state = 0;
	};
	
	this.net_update = function (interval) {
	
	//	this.pos_x += this.v_x*interval;
	//	this.pos_y += this.v_y*interval;

		// Handles map location for drawing
		if (this.pos_x <= CONST.CANVAS_WIDTH/2)
			{this.map_pos_x = 0; this.canvas_pos_x = this.pos_x;}
		else if (this.pos_x >= CONST.MAP_WIDTH - CONST.CANVAS_WIDTH/2)
			{this.map_pos_x = CONST.MAP_WIDTH - CONST.CANVAS_WIDTH; this.canvas_pos_x = CONST.CANVAS_WIDTH - CONST.MAP_WIDTH + this.pos_x;}
		else {this.map_pos_x = this.pos_x - CONST.CANVAS_WIDTH/2; this.canvas_pos_x = CONST.CANVAS_WIDTH/2;}

		if (this.pos_y <= CONST.CANVAS_HEIGHT/2)
			{this.map_pos_y = 0; this.canvas_pos_y = this.pos_y;}
		else if (this.pos_y >= CONST.MAP_HEIGHT - CONST.CANVAS_HEIGHT/2)
			{this.map_pos_y = CONST.MAP_HEIGHT - CONST.CANVAS_HEIGHT; this.canvas_pos_y = CONST.CANVAS_HEIGHT - CONST.MAP_HEIGHT + this.pos_y;}
		else {this.map_pos_y = this.pos_y - CONST.CANVAS_HEIGHT/2; this.canvas_pos_y = CONST.CANVAS_HEIGHT/2;}
		
		this.move_command_state = 0;
	};
	
	this.draw = function (context) {
		context.save();
		context.translate(this.canvas_pos_x, this.canvas_pos_y);
		context.rotate(this.angle);

		var gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1*this.radius);
		gradient.addColorStop(0, this.team_color);
		gradient.addColorStop(1, "black");
		
		context.beginPath();
		context.moveTo(this.radius,0);
		context.lineTo(CONST.PLAYER_WING_ANGLE_COS,CONST.PLAYER_WING_ANGLE_SIN);
		context.lineTo(0,0);
		context.lineTo(CONST.PLAYER_WING_ANGLE_COS,-CONST.PLAYER_WING_ANGLE_SIN);
		context.lineTo(this.radius,0);
		context.closePath();
	
		context.fillStyle = gradient;
		context.fill();
		context.lineWidth = 1;
		context.strokeStyle = "gray";
		context.stroke();

		if (this.shield_fade > 0)
		{
			context.beginPath();
			context.arc(0,0,CONST.PLAYER_SHIELD_RADIUS,0,2*Math.PI,false);
			gradient = context.createRadialGradient(0, 0, 0, 0, 0, this.radius*2);
			gradient.addColorStop(0, "transparent");
			gradient.addColorStop(1-this.shield_fade/CONST.PLAYER_SHIELD_FADE_MAX, "cyan");
			gradient.addColorStop(1, "transparent");
			context.fillStyle = gradient;
			context.fill();
//			context.lineWidth = 0;
//			context.strokeStyle = "white";
			context.stroke();
		}
		context.restore();
	};
	return this;
}

function Particle(x,y,v_x,v_y,color){
	this.pos_x = x;
	this.pos_y = y;
	this.v_x = v_x;
	this.v_y = v_y;
	this.mass = CONST.PARTICLE_MASS;
	this.charge = CONST.PARTICLE_CHARGE;
	this.color = color;
	this.size = CONST.PARTICLE_SIZE;
	this.half_size = this.size/2;
	
	this.update = function(interval) {
		this.pos_x += this.v_x*interval;
		this.pos_y += this.v_y*interval;
		
		if (this.pos_x >= CONST.MAP_WIDTH) {this.pos_x = CONST.MAP_WIDTH - 1; this.v_x = -this.v_x*CONST.PARTICLE_WALL_LOSS;}
		else if (this.pos_x <= 0) {this.pos_x = 1; this.v_x = -this.v_x*CONST.PARTICLE_WALL_LOSS;}
		
		if (this.pos_y >= CONST.MAP_HEIGHT) {this.pos_y = CONST.MAP_HEIGHT - 1; this.v_y = -this.v_y*CONST.PARTICLE_WALL_LOSS;}
		else if (this.pos_y <= 0) {this.pos_y = 1; this.v_y = -this.v_y*CONST.PARTICLE_WALL_LOSS;}
	}

	this.draw = function(context, pos_x, pos_y) {
		context.fillStyle = this.color;
		var x = this.pos_x - pos_x;
		var y = this.pos_y - pos_y;
		if (x >= 0 && x <= CONST.CANVAS_WIDTH && y >= 0 && y <= CONST.CANVAS_HEIGHT)
			context.fillRect(x - this.half_size, y - this.half_size, this.size, this.size);
	}
	return this;
}

function Game()
{
	var self = this;
	var request_id;
	
	var main_canvas = $("<canvas id='main_canvas' width='" + CONST.CANVAS_WIDTH + "' height='" + CONST.CANVAS_HEIGHT + "'>Update your browser :P</canvas>");
	var main_context = main_canvas.get(0).getContext('2d');

	var server_url = 'http://' + (window.location.hostname || "localhost") + ':8080';
	var socket;
	var socket_worker;

	var key_down = {};

	var background = new Background();
	
	var draw_timer = new Timer();
	var update_timer = new Timer();
	var interval_id;
	
	var debug = true;
	var frame_rates = false;
	var quit = false;
	
	var player_arr = [];
	var player_arr_size = 0;
	
	var par_arr = [];
	var par_arr_index = 0;
	var par_arr_size = 0;

	this.initialize = function () {
	
		background.initialize();

		var bg_wait = function(){
			if (background.background_ready){
				main_canvas.appendTo("body");
				self.update();
				interval_id = setInterval(self.update, 1000/CONST.UPS);//*/
				self.draw();
			} else setTimeout(bg_wait, 500);
		};
		bg_wait();
		
		player_arr[0] = new Player();
		player_arr_size = 1;
		
		$(window).keydown(function (key_code) {
			if (debug) console.log("Key down: " + key_code.keyCode);
			key_down[key_code.keyCode]=true;
			});
		$(window).keyup(function (key_code) {
			if (key_code.keyCode==68) { debug = !debug; console.log("Debug " + (debug?"on.":"off.")); }
			if (key_code.keyCode==70) frame_rates = !frame_rates;
			if (debug) console.log("Key up: " + key_code.keyCode);
			key_down[key_code.keyCode]=false;
			});
		
		console.log("Attempting to connect to " + server_url);
		
		socket = io.connect(server_url);
		if (!socket) console.log("Server is down");
		socket.on("pong", function(data){
			console.log(data);
			player_arr[0].pos_x = data.x;
			player_arr[0].pos_y = data.y;
			player_arr[0].v_x = data.v_x;
			player_arr[0].v_y = data.v_y;
			player_arr[0].angle = data.angle;
			player_arr[0].server_set = true;
			//socket.emit("ping", player_arr[0].move_command_state);
		});
		//socket.emit("ping", player_arr[0].move_command_state);
		

		/*socket_worker = new Worker("socket_worker.js");
		socket_worker.onmessage = function(e){ if (debug) console.log(e.data); };
		socket_worker.postMessage({command:"connect",server:server_url});//*/
	};

	this.update = function () {
		if (key_down[37]) player_arr[0].move_command_state += CONST.COMMAND_ROTATE_CC;
		if (key_down[38]) player_arr[0].move_command_state += CONST.COMMAND_MOVE_FORWARD;
		if (key_down[39]) player_arr[0].move_command_state += CONST.COMMAND_ROTATE_CW;
		if (key_down[40]) player_arr[0].move_command_state += CONST.COMMAND_MOVE_BACKWARD;
		if (key_down[69]) player_arr[0].move_command_state += CONST.COMMAND_STRAFE_LEFT;
		if (key_down[82]) player_arr[0].move_command_state += CONST.COMMAND_STRAFE_RIGHT;
		if (key_down[83]) player_arr[0].move_command_state += CONST.COMMAND_FIRE;
		
		var update_interval = update_timer.interval;

//		if (player_arr[0].move_command_state > 0) socket_worker.postMessage(player_arr[0].move_command_state);
		if (player_arr[0].server_set)
		{
			socket.emit("ping", player_arr[0].move_command_state);
			player_arr[0].server_set = false;
		}
		
		player_arr[0].net_update(update_interval);
		
//		for (var i = 0; i < par_arr_size; i++) par_arr[i].update(update_interval);
		
		/*if (player_arr[0].request_state & CONST.COMMAND_FIRE)
		{
			if (par_arr_index >= CONST.PARTICLE_ARRAY_MAX_SIZE) par_arr_index = 0;
			par_arr[par_arr_index] = new Particle(
			 player_arr[0].pos_x + CONST.PLAYER_RADIUS*Math.cos(player_arr[0].angle),
			 player_arr[0].pos_y + CONST.PLAYER_RADIUS*Math.sin(player_arr[0].angle),
			 player_arr[0].v_x + CONST.PARTICLE_INITIAL_VELOCITY*Math.cos(player_arr[0].angle),
			 player_arr[0].v_y + CONST.PARTICLE_INITIAL_VELOCITY*Math.sin(player_arr[0].angle),'lime');
			par_arr_index++;
			if (par_arr_size < CONST.PARTICLE_ARRAY_MAX_SIZE) par_arr_size++;
			player_arr[0].request_state -= CONST.COMMAND_FIRE;
		}*/
		
		//socket.emit('ping', interval);

		if (frame_rates) console.log("update interval: " + update_interval + " frame rate: " + update_timer.frame_rate.toFixed(2));
		if (key_down[81]) {quit = true; clearInterval(interval_id); console.log("Quit command sent");}
	};

	this.draw = function () {
		if (!quit) request_id = window.requestAnimFrame(self.draw);

		var draw_interval = draw_timer.interval;

		background.draw(main_context, player_arr[0].map_pos_x, player_arr[0].map_pos_y);
		//for (var i = 0; i < par_arr_size; i++) par_arr[i].draw(main_context, player_arr[0].map_pos_x, player_arr[0].map_pos_y);		
		player_arr[0].draw(main_context);
		
		if (frame_rates) console.log("draw interval: " + draw_interval + " frame rate: " + draw_timer.frame_rate.toFixed(2));
	};

	return this;
}

var main_game = new Game();

main_game.initialize();

})();
