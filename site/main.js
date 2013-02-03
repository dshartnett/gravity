(function () {

"use strict";
var CONST = constants.getConstants();

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

function Player(team){
	this.pos_x = 500;
	this.pos_y = 500;
	this.angle = 0;
	this.v_x = 0;
	this.v_y = 0;
	this.radius = CONST.PLAYER_RADIUS;
	this.wing_angle = CONST.PLAYER_WING_ANGLE;
	
	this.team = team;
	
	this.map_pos_x = this.pos_x - CONST.CANVAS_WIDTH/2;
	this.map_pos_y = this.pos_y - CONST.CANVAS_HEIGHT/2;
	this.canvas_pos_x = CONST.CANVAS_WIDTH/2;
	this.canvas_pos_y = CONST.CANVAS_HEIGHT/2;
	
	this.mass = CONST.PLAYER_MASS;
	
	this.shield_fade = 0;
	this.fire_battery = 0;
	
	this.move_command_state = 0;
	
	this.request_state = 0;
	
	this.server_set = true;
	
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
		gradient.addColorStop(0, this.team);
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
	
	this.net_draw = function(context, pos_x, pos_y){
		var x = this.pos_x - pos_x;
		var y = this.pos_y - pos_y;
		if (x >= 0 && x <= CONST.CANVAS_WIDTH && y >= 0 && y <= CONST.CANVAS_HEIGHT)
		{
			context.save();
			context.translate(x, y);
			context.rotate(this.angle);

			var gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1*this.radius);
			gradient.addColorStop(0, this.team);
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
			
			context.restore();
		}
	};
	return this;
}

function Particle(p_id,x,y,v_x,v_y,color){
	this.id = p_id;
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
	
	var player_col = {};
	var player_id = 0;

	var par_col = {}; // we'll try an object instead of a strict array
	par_col[0] = new Particle(0,10,10,100,100,"lime");
	
	var par_arr = [];
	var par_arr_index = 0;
	var par_arr_size = 0;

	this.initialize = function () {
	
		background.initialize();

		
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
		
		socket.on("connected", function(data){ player_id = data.p_id; player_col[player_id] = new Player(data.team); });
		
		//socket.on("player_added", function(data){ player_col[data] = new Player(); });
		socket.on("player_list", function(data){
			for (var u in data)
			{
				if (typeof player_col[u] === 'undefined') player_col[u] = new Player(data[u]);
			}
		});
		socket.on("player_removed", function(data){delete player_col[data]; });
		
		
		var init_wait = function(){
			if (background.background_ready && player_id != 0){
			
				
				//console.log("reached declaration");
				socket.on("pong", function(data){
					if (player_id == 0) return;
					if (typeof player_col[data.p_id] === 'undefined')
					{
						socket.emit("request_player_list", player_id);
						return;
					}
					if (debug) console.log(data);
					var diff_x = data.x - player_col[data.p_id].pos_x;
					var diff_y = data.y - player_col[data.p_id].pos_y;
					var diff_a = data.angle - player_col[data.p_id].angle;
					
					if (Math.abs(diff_x) > CONST.POSITION_CORRECT_X)
						player_col[data.p_id].pos_x = data.x;
					else player_col[data.p_id].pos_x += diff_x*CONST.POSITION_CORRECTION_PERCENT;
					
					if (Math.abs(diff_y) > CONST.POSITION_CORRECT_Y)
						player_col[data.p_id].pos_y = data.y;
					else player_col[data.p_id].pos_y += diff_y*CONST.POSITION_CORRECTION_PERCENT;
					
					//if (Math.abs(diff_a) > CONST.POSITION_CORRRECT_ANGLE)
						player_col[data.p_id].angle = data.angle;
					//else player_col[data.p_id].angle += diff_a*CONST.POSITION_CORRECTION_PERCENT;
					
					player_col[data.p_id].v_x = data.v_x;
					player_col[data.p_id].v_y = data.v_y;
					player_col[data.p_id].server_set = true;
					//socket.emit("ping", player_col[player_id].move_command_state);
				});
				//socket.emit("ping", player_col[player_id].move_command_state);
				
				main_canvas.appendTo("body");
				self.update();
				interval_id = setInterval(self.update, 1000/CONST.UPS);//*/
				self.draw();
			} else setTimeout(init_wait, 500);
		};
		
		init_wait();
	};

	this.update = function () {
		if (key_down[37]) player_col[player_id].move_command_state += CONST.COMMAND_ROTATE_CC;
		if (key_down[38]) player_col[player_id].move_command_state += CONST.COMMAND_MOVE_FORWARD;
		if (key_down[39]) player_col[player_id].move_command_state += CONST.COMMAND_ROTATE_CW;
		if (key_down[40]) player_col[player_id].move_command_state += CONST.COMMAND_MOVE_BACKWARD;
		if (key_down[69]) player_col[player_id].move_command_state += CONST.COMMAND_STRAFE_LEFT;
		if (key_down[82]) player_col[player_id].move_command_state += CONST.COMMAND_STRAFE_RIGHT;
		if (key_down[83]) player_col[player_id].move_command_state += CONST.COMMAND_FIRE;
		
		var update_interval = update_timer.interval;

//		if (player_col[player_id].move_command_state > 0) socket_worker.postMessage(player_col[player_id].move_command_state);
		if (player_col[player_id].server_set)
		{
			socket.emit("ping", player_col[player_id].move_command_state);
			player_col[player_id].server_set = false;
		}
		
		//player_col[player_id].net_update(update_interval);
		//player_col[player_id].update(update_interval);
		for (var i in player_col) player_col[i].update(update_interval);
		
//		for (var i = 0; i < par_arr_size; i++) par_arr[i].update(update_interval);
		for (var i in par_col) par_col[i].update(update_interval);
		
		/*if (player_col[player_id].request_state & CONST.COMMAND_FIRE)
		{
			if (par_arr_index >= CONST.PARTICLE_ARRAY_MAX_SIZE) par_arr_index = 0;
			par_arr[par_arr_index] = new Particle(
			 player_col[player_id].pos_x + CONST.PLAYER_RADIUS*Math.cos(player_col[player_id].angle),
			 player_col[player_id].pos_y + CONST.PLAYER_RADIUS*Math.sin(player_col[player_id].angle),
			 player_col[player_id].v_x + CONST.PARTICLE_INITIAL_VELOCITY*Math.cos(player_col[player_id].angle),
			 player_col[player_id].v_y + CONST.PARTICLE_INITIAL_VELOCITY*Math.sin(player_col[player_id].angle),'lime');
			par_arr_index++;
			if (par_arr_size < CONST.PARTICLE_ARRAY_MAX_SIZE) par_arr_size++;
			player_col[player_id].request_state -= CONST.COMMAND_FIRE;
		}*/
		
		//socket.emit('ping', interval);

		if (frame_rates) console.log("update interval: " + update_interval + " frame rate: " + update_timer.frame_rate.toFixed(2));
		if (key_down[81]) {quit = true; clearInterval(interval_id); console.log("Quit command sent");}
	};

	this.draw = function () {
		if (!quit) request_id = window.requestAnimFrame(self.draw);

		var draw_interval = draw_timer.interval;

		background.draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		//for (var i = 0; i < par_arr_size; i++) par_arr[i].draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		for (var i in par_col) par_col[i].draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		player_col[player_id].draw(main_context);
		for (var i in player_col) if (i != player_id) player_col[i].net_draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		
		if (frame_rates) console.log("draw interval: " + draw_interval + " frame rate: " + draw_timer.frame_rate.toFixed(2));
	};

	return this;
}

var main_game = new Game();

main_game.initialize();

})();
