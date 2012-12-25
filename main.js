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

function Game()
{
	var self = this;
	var request_id;

	var canvas;
	var context;

	this.initialize = function(canvas_width, canvas_height) {
		var canvas = $("<canvas id='canvas_main' width='" + canvas_width + "' height='" + canvas_height + "'>Update your browser :P</canvas>");
		var context = canvas.get(0).getContext('2d');
		canvas.appendTo("body");

		setInterval(this.update, 1000/CONST.UPS);
		request_id = window.requestAnimFrame(self.draw);
	};

	this.update = function(){
		console.log("update");
	};

	this.draw = function(){
		request_id = window.requestAnimFrame(self.draw);
		console.log("draw");
	};

	return this;
};

var main_game = new Game();

main_game.initialize(CONST.CANVAS_WIDTH, CONST.CANVAS_HEIGHT);


