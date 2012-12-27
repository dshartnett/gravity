"use strict";

window.requestAnimFrame = (function()
{
 return window.requestAnimationFrame
 || window.webkitRequestAnimationFrame
 || window.mozRequestAnimationFrame
 || window.oRequestAnimationFrame
 || window.msRequestAnimationFrame
 || function(callback){window.setTimeout(callback, 1000 / CONST.FPS);};
}
)();

var CONST = {
FPS:60,
UPS:33,
TIME_INTERVAL:1000,

CANVAS_WIDTH:960,
CANVAS_HEIGHT:360,

MAP_WIDTH:10000,
MAP_HEIGHT:10000,

C_MOVE_UP:1,
C_MOVE_DOWN:2,
C_ROTATE_CW:4,
C_ROTATE_CC:8,
C_S_RIGHT:16,
C_S_LEFT:32,
C_P_FIRE:64
};

var key_down = {};

function Timer()
{
	then:Date.now()
}

Timer.prototype = {
	get interval(){var i = Date.now() - this.then; this.then = Date.now(); return i;}
};
//date_then = Date.now();
//setInterval(function(){time_interval = Date.now() - date_then;/*console.log(time_interval);/**/},CONST.TIME_INTERVAL);


window.onkeydown = function(key_code) {console.log(key_code.keyCode);/**/ key_down[key_code.keyCode]=true;};
window.onkeyup = function(key_code) {console.log(key_code.keyCode);/**/ key_down[key_code.keyCode]=false;};

function Game()
{
	var self = this;
	var request_id;
	
	var canvas = $("<canvas id='canvas_main' width='" + CONST.CANVAS_WIDTH + "' height='" + CONST.CANVAS_HEIGHT + "'>Update your browser :P</canvas>");
	var context = canvas.get(0).getContext('2d');
	
	var draw_timer = new Timer();
	var update_timer = new Timer();
	var frame_count = 0;
	var update_count = 0;
	var debug = true;

	this.initialize = function() {
		canvas.appendTo("body");

		self.update();
		setInterval(self.update, 1000/CONST.UPS);
		self.draw();
	};

	this.update = function(){
		var gradient = context.createLinearGradient(0,0,0,CONST.MAP_HEIGHT);
		gradient.addColorStop(0,"black");
		gradient.addColorStop(.5,"white");
		gradient.addColorStop(1,"black");
		context.fillStyle = gradient;
		
		update_count++;
		console.log("update " + update_timer.interval);
	};

	this.draw = function(){
		request_id = window.requestAnimFrame(self.draw);
		context.fillRect(0,0,CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT);
		
		frame_count++;
		console.log("draw " + draw_timer.interval);
	};

	return this;
}

function Player()
{
	this.x = 0;
	this.y = 0;
	this.velocity_x = 0;
	this.velocity_y = 0;
	
	this.update = function(){};
	this.draw = function(){};
}

var main_game = new Game();

main_game.initialize();


