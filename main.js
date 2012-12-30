(function () {

"use strict";

var CONST =
{
FPS: 60,
UPS: 33,
TIME_INTERVAL: 1000,
FRAME_MAX: 30,

CANVAS_WIDTH: 960,
CANVAS_HEIGHT: 320,

MAP_WIDTH: 3000,
MAP_HEIGHT: 3000,

BACKGROUND_STARS0: 10000,
BACKGROUND_STARS1: 1000,

PLAYER_RADIUS: 20,
PLAYER_ACCELERATION: 0.0007,
PLAYER_ROTATE_SPEED: 1/360,
PLAYER_FRICTION: 0.001,
PLAYER_WALL_LOSS: 0.5,

COMMAND_ROTATE_CC: 1,
COMMAND_MOVE_FORWARD: 2,
COMMAND_ROTATE_CW: 4,
COMMAND_MOVE_BACKWARD: 8,
COMMAND_STRAFE_RIGHT: 16,
COMMAND_STRAFE_LEFT: 32,
COMMAND_P_FIRE: 64
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

var key_down = {};
$(window).keydown(function (key_code) {console.log("Key down: " + key_code.keyCode);/**/ key_down[key_code.keyCode]=true;});
$(window).keyup(function (key_code) {/*console.log("Key up: " + key_code.keyCode);/**/ key_down[key_code.keyCode]=false;});

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

		this.time_array_index++;
		if (this.time_array_index >= CONST.FRAME_MAX) this.time_array_index = 0;

		if (this.frame_count >= CONST.FRAME_MAX) this.time_count -= this.time_array[this.time_array_index];
		else this.frame_count++;

		this.time_array[this.time_array_index] = i;

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

	this.initialize = function () {
		console.log("Generating background...");
		var gradient = background_context.createLinearGradient(0,0,0,CONST.MAP_HEIGHT);
		gradient.addColorStop(0.0,"black");
		gradient.addColorStop(0.3,"black");
		gradient.addColorStop(0.5,"white");
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
		
		console.log("Loading background to memory...");
		background_img.src = background_canvas.get(0).toDataURL();

		background_img.onload = function() {self.ready();};
	}

	this.ready = function () {console.log("Background loaded."); this.background_ready = true;}

	this.draw = function (context, pos_x, pos_y) {
		context.drawImage(background_img, pos_x, pos_y, CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT, 0, 0, CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT);
	}
}

function Game()
{
	var self = this;
	var request_id;
	
	var main_canvas = $("<canvas id='main_canvas' width='" + CONST.CANVAS_WIDTH + "' height='" + CONST.CANVAS_HEIGHT + "'>Update your browser :P</canvas>");
	var main_context = main_canvas.get(0).getContext('2d');
	
	var map_pos_x = 0, map_pos_y = 0;

	var background = new Background();
	var player_arr = [];
	
	var draw_timer = new Timer();
	var update_timer = new Timer();
	var interval_id;
	var debug = true;
	var quit = false;

	this.initialize = function () {

		player_arr[0] = new Player();

		background.initialize();

		main_canvas.appendTo("body");
		self.update();
		interval_id = setInterval(self.update, 1000/CONST.UPS);
		self.draw();
	};

	this.update = function () {
		if(key_down[37]) player_arr[0].move_command_state += CONST.COMMAND_ROTATE_CC;
		if(key_down[38]) player_arr[0].move_command_state += CONST.COMMAND_MOVE_FORWARD;
		if(key_down[39]) player_arr[0].move_command_state += CONST.COMMAND_ROTATE_CW;
		if(key_down[40]) player_arr[0].move_command_state += CONST.COMMAND_MOVE_BACKWARD;
		if(key_down[69]) player_arr[0].move_command_state += CONST.COMMAND_STRAFE_LEFT;
		if(key_down[82]) player_arr[0].move_command_state += CONST.COMMAND_STRAFE_RIGHT;
		//console.log(player_arr[0].move_command_state);
		
		var interval = update_timer.interval;
		player_arr[0].update(interval);
		//console.log("update interval: " + interval + " frame rate: " + update_timer.frame_rate.toFixed(2));
		if (key_down[81]) {quit = true; clearInterval(interval_id); console.log("Quit command sent");}
	};

	this.draw = function () {
		if (!quit) request_id = window.requestAnimFrame(self.draw);

		background.draw(main_context, player_arr[0].map_pos_x, player_arr[0].map_pos_y);		
		player_arr[0].draw(main_context);

		//console.log("draw interval: " + draw_timer.interval + " frame rate: " + draw_timer.frame_rate.toFixed(2));
	};

	return this;
}

function Player()
{
	this.pos_x = 500;
	this.pos_y = 500;
	this.map_pos_x = this.pos_x - CONST.CANVAS_WIDTH/2;
	this.map_pos_y = this.pos_y - CONST.CANVAS_HEIGHT/2;
	this.canvas_pos_x = CONST.CANVAS_WIDTH/2;
	this.canvas_pos_y = CONST.CANVAS_HEIGHT/2;
	this.v_x = 0;
	this.v_y = 0;
	this.angle = 0;
	this.radius = CONST.PLAYER_RADIUS;
	this.team_color = 'red';
	this.move_command_state = 0;
	
	this.update = function (interval) {
		this.v_x -= CONST.PLAYER_FRICTION*this.v_x*interval;
		this.v_y -= CONST.PLAYER_FRICTION*this.v_y*interval;

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

		this.pos_x += this.v_x*interval;
		this.pos_y += this.v_y*interval;

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

		if (this.pos_x - this.radius <= 0) {this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = this.radius;}
		else if (this.pos_x + this.radius >= CONST.MAP_WIDTH) {this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = CONST.MAP_WIDTH-this.radius;}
		if (this.pos_y - this.radius <= 0) {this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = this.radius;}
		else if (this.pos_y + this.radius >= CONST.MAP_HEIGHT) {this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = CONST.MAP_HEIGHT-this.radius;}

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
		context.lineTo(this.radius*Math.cos(5*Math.PI/6),this.radius*Math.sin(5*Math.PI/6));
		context.lineTo(0,0);
		context.lineTo(this.radius*Math.cos(7*Math.PI/6),this.radius*Math.sin(7*Math.PI/6));
		context.lineTo(this.radius,0);
		context.closePath();
	
		context.fillStyle = gradient;
		context.fill();
		context.lineWidth = 1;
		context.strokeStyle = "gray";
		context.stroke();

		context.restore();
	};
}

var main_game = new Game();

main_game.initialize();

})();
