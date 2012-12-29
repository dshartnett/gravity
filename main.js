(function () {

"use strict";

var CONST =
{
FPS: 60,
UPS: 33,
TIME_INTERVAL: 1000,
FRAME_MAX: 30,

CANVAS_WIDTH: 960,
CANVAS_HEIGHT: 640,

MAP_WIDTH: 3000,
MAP_HEIGHT: 3000,

C_MOVE_UP: 1,
C_MOVE_DOWN: 2,
C_ROTATE_CW: 4,
C_ROTATE_CC: 8,
C_S_RIGHT: 16,
C_S_LEFT: 32,
C_P_FIRE: 64
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
$(window).keyup(function (key_code) {console.log("Key up: " + key_code.keyCode);/**/ key_down[key_code.keyCode]=false;});

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

function Game()
{
	var self = this;
	var request_id;
	
	var main_canvas = $("<canvas id='main_canvas' width='" + CONST.CANVAS_WIDTH + "' height='" + CONST.CANVAS_HEIGHT + "'>Update your browser :P</canvas>");
	var main_context = main_canvas.get(0).getContext('2d');
	
	var background_canvas = $("<canvas id='background_canvas' width='" + CONST.MAP_WIDTH + "' height='" + CONST.MAP_HEIGHT + "'>Update your browser :P</canvas>");
	var background_context = background_canvas.get(0).getContext('2d');
	var background_img = new Image();
	
	var map_pos_x = 0, map_pos_y = 0;
	
	var draw_timer = new Timer();
	var update_timer = new Timer();
	var interval_id;
	var debug = true;
	var quit = false;

	this.initialize = function () {
	
		console.log("Generating background...");
		var gradient = background_context.createLinearGradient(0,0,0,CONST.MAP_HEIGHT);
		gradient.addColorStop(0,"black");
		gradient.addColorStop(.3,"black");
		gradient.addColorStop(.5,"white");
		gradient.addColorStop(.7,"black");
		gradient.addColorStop(1,"black");
		background_context.fillStyle = gradient;
		background_context.fillRect(0,0,CONST.MAP_WIDTH,CONST.MAP_HEIGHT);//*/
		background_context.fillStyle = 'white';
		
		console.log("Generating star field...");
		for (var i = 0; i < 10000; i++){
			var yp = Math.floor(1 + 2*Math.random()); 
			background_context.fillRect(Math.random()*CONST.MAP_WIDTH, Math.random()*CONST.MAP_HEIGHT, yp, yp);
		}
		
		console.log("Loading image to memory...");
		background_img.src = background_canvas.get(0).toDataURL();
		
		background_img.onload = function(){
			main_canvas.appendTo("body");
			self.update();
			interval_id = setInterval(self.update, 1000/CONST.UPS);
			self.draw();
		}
	};

	this.update = function () {
		if(key_down[37]) map_pos_x -= map_pos_x>0?10:0;
		if(key_down[38]) map_pos_y -= map_pos_y>0?10:0;
		if(key_down[39]) map_pos_x += map_pos_x<(CONST.MAP_WIDTH-CONST.CANVAS_WIDTH)?10:0;
		if(key_down[40]) map_pos_y += map_pos_y<(CONST.MAP_HEIGHT-CONST.CANVAS_HEIGHT)?10:0;
		
		console.log("update interval: " + update_timer.interval + " frame rate: " + update_timer.frame_rate.toFixed(2));
		if (key_down[81]) {quit = true; clearInterval(interval_id); console.log("Quit command sent");}
	};

	this.draw = function () {
		if (!quit) request_id = window.requestAnimFrame(self.draw);
		
		main_context.drawImage(background_img, map_pos_x, map_pos_y, CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT, 0, 0, CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT);		
		
		console.log("draw interval: " + draw_timer.interval + " frame rate: " + draw_timer.frame_rate.toFixed(2));
	};

	return this;
}

function Player()
{
	this.x = 0;
	this.y = 0;
	this.velocity_x = 0;
	this.velocity_y = 0;
	
	this.update = function () {};
	this.draw = function () {};
}

var main_game = new Game();

main_game.initialize();

})();
