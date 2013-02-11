
window['Gravity']={};

(function(){

"use strict";

var CONST = CONSTANTS['getConstants']();


var tick = new Howl({'urls': ['./files/tick1.mp3', './files/tick1.ogg']});
var blast = new Howl({'urls': ['./files/bomb_blast1.mp3', './files/bomb_blast1.ogg']});
var g_obj = new Howl({'urls': ['./files/g_obj1.mp3', './files/g_obj1.ogg']});


var key_arr = {
	r_cc:CONST.KEY_CODE_ROTATE_CC,
	f:CONST.KEY_CODE_MOVE_FORWARD,
	r_cw:CONST.KEY_CODE_ROTATE_CW,
	bk:CONST.KEY_CODE_MOVE_BACKWARD,
	s_l:CONST.KEY_CODE_STRAFE_LEFT,
	s_r:CONST.KEY_CODE_STRAFE_RIGHT,
	fr:CONST.KEY_CODE_FIRE,
	g:CONST.KEY_CODE_G_OBJECT,
	b:CONST.KEY_CODE_BOMB};

Gravity['options'] = function()
{
	var temp = key_arr.r_cc;
	key_arr.r_cc = key_arr.r_cw;
	key_arr.r_cw = temp;
}

Gravity['about'] = function()
{
	alert(CONST.ABOUT);
}

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
};//*/

function Background ()
{
	//var background_canvas = $("<canvas id='background_canvas' width='" + CONST.MAP_WIDTH + "' height='" + CONST.MAP_HEIGHT + "'></canvas>");
	//var background_context = background_canvas.get(0).getContext('2d');

	var sf_0 = [];
	var pf_0 = [];

	this.initialize = function () {
		//console.log("Generating background...");
		/*var gradient = background_context.createLinearGradient(0,0,CONST.MAP_WIDTH,CONST.MAP_HEIGHT);
		gradient.addColorStop(0.0,"black");
		gradient.addColorStop(0.3,"black");
		gradient.addColorStop(0.5,"purple");
		gradient.addColorStop(0.7,"black");
		gradient.addColorStop(1.0,"black");
		background_context.fillStyle = gradient;
		background_context.fillRect(0,0,CONST.MAP_WIDTH,CONST.MAP_HEIGHT);//*/
		
		//console.log("Generating star field...");
		//background_context.fillStyle = 'white';
		for (var i = 0; i < CONST.BACKGROUND_STARS0; i++){
			var star = {x:Math.random()*CONST.MAP_WIDTH, y: Math.random()*CONST.MAP_HEIGHT, star_size:Math.floor(1 + 2*Math.random())};
			sf_0.push(star);
			//background_context.fillRect(sf_0[i].x, sf_0[i].y, sf_0[i].star_size, sf_0[i].star_size);
		}
		/*
		for (var i = 0; i < CONST.BACKGROUND_PLANETS0; i++){
			var planet = {x:Math.random()*CONST.MAP_WIDTH, y: Math.random()*CONST.MAP_HEIGHT, planet_radius:CONST.BACKGROUND_PLANET_SIZE_MIN + CONST.BACKGROUND_PLANET_SIZE_RANGE*Math.random()};
			pf_0.push(planet);
		}
		*/
	}

	this.draw = function (context, map_pos_x, map_pos_y) {
		var gradient = context.createLinearGradient(-map_pos_x,-map_pos_y,CONST.MAP_WIDTH-map_pos_x,CONST.MAP_HEIGHT-map_pos_y);
		gradient.addColorStop(0.0,"black");
		gradient.addColorStop(0.3,"black");
		gradient.addColorStop(0.5,"purple");
		gradient.addColorStop(0.7,"black");
		gradient.addColorStop(1.0,"black");
		context.fillStyle = gradient;//'black';
		context.fillRect(0,0,CONST.CANVAS_WIDTH,CONST.CANVAS_HEIGHT);
		context.fillStyle = 'white';
		for (var i = 0; i < CONST.BACKGROUND_STARS0; i++)
			if (sf_0[i].x >= map_pos_x && sf_0[i].x <= map_pos_x + CONST.CANVAS_WIDTH && sf_0[i].y >= map_pos_y && sf_0[i].y <= map_pos_y + CONST.CANVAS_HEIGHT)
				context.fillRect(sf_0[i].x - map_pos_x, sf_0[i].y - map_pos_y, sf_0[i].star_size, sf_0[i].star_size);
		//*/
	}
	return this;
}

function Player(team){
	var pos_x = 0,
		pos_y = 0,
		angle = 0,
		v_x = 0,
		v_y = 0,
		radius = CONST.PLAYER_RADIUS,
		team = team,
		
		canvas_pos_x = CONST.CANVAS_WIDTH/2,
		canvas_pos_y = CONST.CANVAS_HEIGHT/2,
		
		mass = CONST.PLAYER_MASS,
		
		health = CONST.PLAYER_MAX_HEALTH,
		health_then = CONST.PLAYER_MAX_HEALTH,
		shield_fade = 0,
		fire_battery = 0,
		
		stat = 0,
		
		has_power_up_array = [0,0,0,0];
	
	this.map_pos_x = pos_x - CONST.CANVAS_WIDTH/2;
	this.map_pos_y = pos_y - CONST.CANVAS_HEIGHT/2;
	var move_command_state = 0;
	this.server_set = true;
	
	this.set_command_state = function(key_down)
	{
		if (key_down[key_arr.r_cc]) move_command_state |= CONST.COMMAND_ROTATE_CC;
		if (key_down[key_arr.f]) move_command_state |= CONST.COMMAND_MOVE_FORWARD;
		if (key_down[key_arr.r_cw]) move_command_state |= CONST.COMMAND_ROTATE_CW;
		if (key_down[key_arr.bk]) move_command_state |= CONST.COMMAND_MOVE_BACKWARD;
		if (key_down[key_arr.s_l]) move_command_state |= CONST.COMMAND_STRAFE_LEFT;
		if (key_down[key_arr.s_r]) move_command_state |= CONST.COMMAND_STRAFE_RIGHT;
		if (key_down[key_arr.fr]) move_command_state |= CONST.COMMAND_FIRE;
		if (key_down[key_arr.g]) move_command_state |= CONST.COMMAND_G_OBJECT;
		if (key_down[key_arr.b]) move_command_state |= CONST.COMMAND_BOMB;
	};
	
	this.move_command_state = function(){return move_command_state;};
	
	this.server_update = function(data)
	{
		var diff_x = data['x'] - pos_x;
		var diff_y = data['y'] - pos_y;
		var diff_a = data['angle'] - angle;
		
		if (Math.abs(diff_x) > CONST.POSITION_CORRECT_X)
			pos_x = data['x'];
		else pos_x += diff_x*CONST.POSITION_CORRECTION_PERCENT;
		
		if (Math.abs(diff_y) > CONST.POSITION_CORRECT_Y)
			pos_y = data['y'];
		else pos_y += diff_y*CONST.POSITION_CORRECTION_PERCENT;

		angle = data['angle'];
		v_x = data['v_x'];
		v_y = data['v_y'];
		health = data['health'];
		stat = data['stat'];
		this.server_set = true;
	};
	
	this.refresh = function (interval) {
		has_power_up_array[CONST.POWER_UP_CLOAK] = stat & CONST.PLAYER_STATUS_CLOAKED;
		has_power_up_array[CONST.POWER_UP_INVINCIBLE] = stat & CONST.PLAYER_STATUS_INVINCIBLE;
		has_power_up_array[CONST.POWER_UP_G_OBJECT] = stat & CONST.PLAYER_STATUS_HAS_G_OBJECT;
		has_power_up_array[CONST.POWER_UP_BOMB] = stat & CONST.PLAYER_STATUS_HAS_BOMB;

		v_x -= CONST.PLAYER_FRICTION*v_x*interval;
		v_y -= CONST.PLAYER_FRICTION*v_y*interval;
		
		if (stat & CONST.PLAYER_STATUS_DEAD)
		{
			move_command_state = 0;
			angle -= CONST.PLAYER_ROTATE_SPEED*interval;
		}
		
		if (shield_fade > 0) shield_fade -= interval;
		if (fire_battery > 0) fire_battery -= interval;
		
		if (move_command_state & CONST.COMMAND_ROTATE_CC) angle -= CONST.PLAYER_ROTATE_SPEED*interval;
		if (move_command_state & CONST.COMMAND_MOVE_FORWARD)
		{
			v_x += CONST.PLAYER_ACCELERATION*interval*Math.cos(angle);
			v_y += CONST.PLAYER_ACCELERATION*interval*Math.sin(angle);
		}
		if (move_command_state & CONST.COMMAND_ROTATE_CW) angle += CONST.PLAYER_ROTATE_SPEED*interval;
		if (move_command_state & CONST.COMMAND_MOVE_BACKWARD)
		{
			v_x -= CONST.PLAYER_ACCELERATION*interval*Math.cos(angle);
			v_y -= CONST.PLAYER_ACCELERATION*interval*Math.sin(angle);
		}
		if (move_command_state & CONST.COMMAND_STRAFE_LEFT)
		{
			v_x += CONST.PLAYER_ACCELERATION*interval*Math.sin(angle);
			v_y -= CONST.PLAYER_ACCELERATION*interval*Math.cos(angle);
		}
		if (move_command_state & CONST.COMMAND_STRAFE_RIGHT)
		{
			v_x -= CONST.PLAYER_ACCELERATION*interval*Math.sin(angle);
			v_y += CONST.PLAYER_ACCELERATION*interval*Math.cos(angle);
		}
		
		if (fire_battery <= 0 && move_command_state & CONST.COMMAND_FIRE)
		{
			fire_battery = CONST.PLAYER_FIRE_BATTERY;
			v_x -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.cos(angle)/mass;
			v_y -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.sin(angle)/mass;
		}
		if (stat & CONST.PLAYER_STATUS_HAS_G_OBJECT && move_command_state & CONST.COMMAND_G_OBJECT)
		{
			v_x -= CONST.G_OBJECT_LAUNCH_MASS*CONST.G_OBJECT_INITIAL_VELOCITY*Math.cos(angle)/mass;
			v_y -= CONST.G_OBJECT_LAUNCH_MASS*CONST.G_OBJECT_INITIAL_VELOCITY*Math.sin(angle)/mass;	
		}
		if (stat & CONST.PLAYER_STATUS_HAS_BOMB && move_command_state & CONST.COMMAND_BOMB)
		{
			v_x -= CONST.BOMB_LAUNCH_MASS*CONST.BOMB_INITIAL_VELOCITY*Math.cos(angle)/mass;
			v_y -= CONST.BOMB_LAUNCH_MASS*CONST.BOMB_INITIAL_VELOCITY*Math.sin(angle)/mass;	
		}

		pos_x += v_x*interval;
		pos_y += v_y*interval;

		if (health < health_then) shield_fade = CONST.PLAYER_SHIELD_FADE_MAX;
		health_then = health;

		// Handles wall bounce
		if (pos_x - radius <= 0)
			{v_x = -CONST.PLAYER_WALL_LOSS*v_x; pos_x = radius;}
		else if (pos_x + radius >= CONST.MAP_WIDTH)
			{v_x = -CONST.PLAYER_WALL_LOSS*v_x; pos_x = CONST.MAP_WIDTH-radius;}
		if (pos_y - radius <= 0)
			{v_y = -CONST.PLAYER_WALL_LOSS*v_y; pos_y = radius;}
		else if (pos_y + radius >= CONST.MAP_HEIGHT)
			{v_y = -CONST.PLAYER_WALL_LOSS*v_y; pos_y = CONST.MAP_HEIGHT-radius;}

		// Handles map location for drawing
		if (pos_x <= CONST.CANVAS_WIDTH/2)
			{this.map_pos_x = 0; canvas_pos_x = pos_x;}
		else if (pos_x >= CONST.MAP_WIDTH - CONST.CANVAS_WIDTH/2)
			{this.map_pos_x = CONST.MAP_WIDTH - CONST.CANVAS_WIDTH; canvas_pos_x = CONST.CANVAS_WIDTH - CONST.MAP_WIDTH + pos_x;}
		else {this.map_pos_x = pos_x - CONST.CANVAS_WIDTH/2; canvas_pos_x = CONST.CANVAS_WIDTH/2;}

		if (pos_y <= CONST.CANVAS_HEIGHT/2)
			{this.map_pos_y = 0; canvas_pos_y = pos_y;}
		else if (pos_y >= CONST.MAP_HEIGHT - CONST.CANVAS_HEIGHT/2)
			{this.map_pos_y = CONST.MAP_HEIGHT - CONST.CANVAS_HEIGHT; canvas_pos_y = CONST.CANVAS_HEIGHT - CONST.MAP_HEIGHT + pos_y;}
		else {this.map_pos_y = pos_y - CONST.CANVAS_HEIGHT/2; canvas_pos_y = CONST.CANVAS_HEIGHT/2;}

		move_command_state = 0;
	};
	
	function draw_player(context)
	{
		var gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1*radius);
		gradient.addColorStop(0, CONST.TEAM_DARK[team]);
		gradient.addColorStop(1, "black");
		
		context.beginPath();
		context.moveTo(radius,0);
		context.lineTo(CONST.PLAYER_WING_ANGLE_COS,CONST.PLAYER_WING_ANGLE_SIN);
		context.lineTo(0,0);
		context.lineTo(CONST.PLAYER_WING_ANGLE_COS,-CONST.PLAYER_WING_ANGLE_SIN);
		context.lineTo(radius,0);
		context.closePath();
	
		context.fillStyle = gradient;
		context.fill();
		context.lineWidth = 1;
		context.strokeStyle = "gray";
		context.stroke();
	}
	
	function draw_moving(context)
	{
		var gradient;
		context.beginPath();
		context.moveTo(0,0);
		context.lineTo(CONST.PLAYER_WING_ANGLE_COS,CONST.PLAYER_WING_ANGLE_SIN);
		context.arc(0,0,radius,-CONST.PLAYER_WING_ANGLE,CONST.PLAYER_WING_ANGLE,true);
		context.lineTo(CONST.PLAYER_WING_ANGLE_COS,-CONST.PLAYER_WING_ANGLE_SIN);
		context.moveTo(0,0);
		context.closePath();
		gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
		gradient.addColorStop(0, CONST.TEAM_LIGHT[team]);
		gradient.addColorStop(0.4+0.3*Math.random(), CONST.TEAM_LIGHT[team]);
		gradient.addColorStop(1, "transparent");
		context.strokeStyle = "transparent";
		context.fillStyle = gradient;
		context.fill();
		context.stroke();
	}
	
	function draw_cloaked(context)
	{
		var gradient;
		context.beginPath();
		context.arc(0,0,CONST.PLAYER_SHIELD_RADIUS,0,2*Math.PI,false);
		gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius*2);
		gradient.addColorStop(0, "transparent");
		gradient.addColorStop(1, "violet");
		context.fillStyle = gradient;
		context.fill();
		context.stroke();
	}
	
	function draw_invincible(context)
	{
		var gradient;
		context.beginPath();
		context.arc(0,0,CONST.PLAYER_SHIELD_RADIUS,0,2*Math.PI,false);
		gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius*2);
		gradient.addColorStop(0, "transparent");
		gradient.addColorStop(0.5+0.1*Math.random(), "white");
		gradient.addColorStop(1, "transparent");
		context.fillStyle = gradient;
		context.fill();
		context.stroke();
	}
	
	function draw_shield_fade(context)
	{
		var gradient;
		context.beginPath();
		context.arc(0,0,CONST.PLAYER_SHIELD_RADIUS,0,2*Math.PI,false);
		gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius*2);
		gradient.addColorStop(0, "transparent");
		gradient.addColorStop(1-shield_fade/CONST.PLAYER_SHIELD_FADE_MAX, CONST.TEAM_LIGHT[team]);
		gradient.addColorStop(1, "transparent");
		context.fillStyle = gradient;
		context.fill();
		context.stroke();
	}
	
	this.draw = function (context) {
		context.save();
		context.translate(canvas_pos_x, canvas_pos_y);
		context.rotate(angle);

		var gradient;
		
		draw_player(context);
		if (stat & CONST.PLAYER_STATUS_MOVING) draw_moving(context);
		if (has_power_up_array[CONST.POWER_UP_CLOAK])draw_cloaked(context);
		if (has_power_up_array[CONST.POWER_UP_INVINCIBLE]) draw_invincible(context);
		if (shield_fade > 0) draw_shield_fade(context);
		
		context.restore();

		if (health > 0){
		for (var i = -1; i <= 1; i += 2){
			context.save();
			context.translate(CONST.HEALTH_LOCATION_X,CONST.HEALTH_LOCATION_Y);
			context.scale(i,1)
			context.beginPath();
			gradient = context.createLinearGradient(0,0,CONST.HEALTH_WIDTH,0);
			gradient.addColorStop(0, CONST.TEAM_DARK[team]);
			gradient.addColorStop(1, CONST.TEAM_LIGHT[team]);
			context.rect(0,0,CONST.HEALTH_WIDTH*health/CONST.PLAYER_MAX_HEALTH, CONST.HEALTH_HEIGHT);
			context.fillStyle = gradient;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = CONST.TEAM_DARK[team];
			context.stroke();
			context.restore();
		}}
		
		for (var u in has_power_up_array)
		{
			if (has_power_up_array[u])
			{
				context.save();
				context.translate(CONST.HAS_LOC_X[u], CONST.HAS_LOC_Y[u]);
				gradient = context.createRadialGradient(CONST.INFO_BOX_SIDE/2, CONST.INFO_BOX_SIDE/2, 0, CONST.INFO_BOX_SIDE/2, CONST.INFO_BOX_SIDE/2, CONST.INFO_BOX_SIDE);
				gradient.addColorStop(0, CONST.TEAM_LIGHT[CONST.TEAM0]);
				gradient.addColorStop(1, CONST.TEAM_DARK[CONST.TEAM0]);
				context.fillStyle = gradient;
				context.lineWidth = 1;
				context.strokeStyle = CONST.TEAM_DARK[CONST.TEAM0];
				context.fillRect(0, 0, CONST.INFO_BOX_SIDE, CONST.INFO_BOX_SIDE);
				
				context.fillStyle = CONST.POWER_UP_TEXT_COLOR;
				context.font = CONST.POWER_UP_FONT;
				context.fillText(CONST.POWER_UP_CHAR[u],3,CONST.INFO_BOX_SIDE-5);
				
				context.restore();
			}
		}
	};
	
	this.net_draw = function(context, map_pos_x, map_pos_y){
		if (stat & CONST.PLAYER_STATUS_CLOAKED) return;
		var x = pos_x - map_pos_x;
		var y = pos_y - map_pos_y;
		if (x >= (-radius) && x <= (CONST.CANVAS_WIDTH + radius) && y >= (-radius) && y <= (CONST.CANVAS_HEIGHT + radius))
		{
			context.save();
			
			context.translate(x, y);
			context.rotate(angle);
			
			draw_player(context);
			if (stat & CONST.PLAYER_STATUS_MOVING) draw_moving(context);
			if (shield_fade > 0) draw_shield_fade(context);
			if (has_power_up_array[CONST.POWER_UP_INVINCIBLE]) draw_invincible(context);
			
			context.restore();
		}
	};
	return this;
}

function Particle(p_id,x,y,v_x,v_y,p_color){
	var id = p_id,
		pos_x = x,
		pos_y = y,
		v_x = v_x,
		v_y = v_y,
		mass = CONST.PARTICLE_MASS,
		charge = CONST.PARTICLE_CHARGE,
		p_color = p_color,
		size = CONST.PARTICLE_SIZE,
		half_size = size/2;
	
	this.server_update = function(data)
	{
		var diff_x = data['x'] - pos_x;
		var diff_y = data['y'] - pos_y;
		
		if (Math.abs(diff_x) > CONST.PARTICLE_CORRECT_X)
			pos_x = data['x'];
		else pos_x += diff_x*CONST.PARTICLE_CORRECTION_PERCENT;
		
		if (Math.abs(diff_y) > CONST.PARTICLE_CORRECT_Y)
			pos_y = data['y'];
		else pos_y += diff_y*CONST.PARTICLE_CORRECTION_PERCENT;
		
		v_x = data['v_x'];
		v_y = data['v_y'];
	};
	
	this.refresh = function(interval) {
		pos_x += v_x*interval;
		pos_y += v_y*interval;
		
		if (pos_x >= CONST.MAP_WIDTH) {pos_x = CONST.MAP_WIDTH - 1; v_x = -v_x*CONST.PARTICLE_WALL_LOSS;}
		else if (pos_x <= 0) {pos_x = 1; v_x = -v_x*CONST.PARTICLE_WALL_LOSS;}
		
		if (pos_y >= CONST.MAP_HEIGHT) {pos_y = CONST.MAP_HEIGHT - 1; v_y = -v_y*CONST.PARTICLE_WALL_LOSS;}
		else if (pos_y <= 0) {pos_y = 1; v_y = -v_y*CONST.PARTICLE_WALL_LOSS;}
	};

	this.draw = function(context, map_pos_x, map_pos_y) {
		var gradient;
		var x = pos_x - map_pos_x;
		var y = pos_y - map_pos_y;
		if (x >= 0 && x <= CONST.CANVAS_WIDTH && y >= 0 && y <= CONST.CANVAS_HEIGHT)
		{
			context.save();
			context.translate(x, y);
			context.beginPath();
			context.arc(0,0,size,0,2*Math.PI,false);
			gradient = context.createRadialGradient(0, 0, 0, 0, 0, size);
			gradient.addColorStop(0, "black");
			gradient.addColorStop(1, p_color);
			context.fillStyle = gradient;
			context.fill();
			context.lineWidth = 1;
			context.strokeStyle = p_color;
			context.stroke();
			context.restore();
		}
	};
	return this;
}

function G_Object(x, y, v_x, v_y, team)
{
	var pos_x = x,
		pos_y = y,
		v_x = v_x,
		v_y = v_y,
		radius = CONST.G_OBJECT_MIN_RADIUS,
		mass = CONST.G_OBJECT_MASS,

		object_type = CONST.OBJ_G_OBJECT,
		team = team,

		timer = CONST.G_OBJECT_TIME_TO_DET,
		stat = 0,

		timer_ceil = Math.ceil(timer/1000),
		blast_played = false;

	this.server_update = function(data)
	{
		var diff_x = data['x'] - pos_x;
		var diff_y = data['y'] - pos_y;

		if (Math.abs(diff_x) > CONST.OBJECT_POSITION_CORRECT_X)
			pos_x = data['x'];
		else pos_x += diff_x*CONST.POSITION_CORRECTION_PERCENT;

		if (Math.abs(diff_y) > CONST.OBJECT_POSITION_CORRECT_Y)
			pos_y = data['y'];
		else pos_y += diff_y*CONST.POSITION_CORRECTION_PERCENT;

		v_x = data['v_x'];
		v_y = data['v_y'];
		stat = data['stat'];
		timer = data['timer'];
	};
	
	this.refresh = function(interval, par_col, player_list, obj_ids_to_del)
	{		
		if (pos_x - radius <= 0)
			{v_x = -CONST.G_OBJECT_WALL_LOSS*v_x; pos_x = radius;}
		else if (pos_x + radius >= CONST.MAP_WIDTH)
			{v_x = -CONST.G_OBJECT_WALL_LOSS*v_x; pos_x = CONST.MAP_WIDTH-radius;}
		if (pos_y - radius <= 0)
			{v_y = -CONST.G_OBJECT_WALL_LOSS*v_y; pos_y = radius;}
		else if (pos_y + radius >= CONST.MAP_HEIGHT)
			{v_y = -CONST.G_OBJECT_WALL_LOSS*v_y; pos_y = CONST.MAP_HEIGHT-radius;}
			
		pos_x += v_x*interval;
		pos_y += v_y*interval;

		if (stat & CONST.G_OBJECT_STATUS_DETONATED) radius = CONST.G_OBJECT_MAX_RADIUS;

		timer -= interval;
		if (timer < 0) timer = 0;
	}
	
	this.draw = function (context, map_pos_x, map_pos_y)
	{
		var x = pos_x - map_pos_x;
		var y = pos_y - map_pos_y;

		if (x >= (-radius) && x <= (CONST.CANVAS_WIDTH + radius) && y >= (-radius) && y <= (CONST.CANVAS_HEIGHT + radius))
		{
			if (Math.ceil(timer/1000) < timer_ceil && !(stat & CONST.G_OBJECT_STATUS_DETONATED))
			{
				tick.play();
				timer_ceil = Math.ceil(timer/1000);
			}
			else if (stat & CONST.G_OBJECT_STATUS_DETONATED && !blast_played)
			{
				g_obj.play();
				blast_played = true;
			}
			
			context.save();
			context.translate(x, y);

			var gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1*radius);
			if (stat == 0){
				gradient.addColorStop(0, CONST.TEAM_LIGHT[team]);
				gradient.addColorStop(1, CONST.TEAM_DARK[team]);
			} else if (stat & CONST.G_OBJECT_STATUS_DETONATED){
				gradient.addColorStop(0, "transparent");
				gradient.addColorStop(1 - timer/CONST.G_OBJECT_TIME_TO_LAST, CONST.TEAM_DARK[team]);
				gradient.addColorStop(1, "transparent");
			}
			context.beginPath();
			context.arc(0,0,radius,0,2*Math.PI,false);
			context.fillStyle = gradient;
			context.fill();
			context.stroke();
			if (stat == 0){
				context.fillStyle = CONST.POWER_UP_TEXT_COLOR;
				context.font = CONST.POWER_UP_FONT;
				context.fillText(timer_ceil,-6,5);
			}
			context.restore();
		}
	}
	
	return this;
};

function Bomb(x, y, v_x, v_y, team, obj_id, player_id)
{
	var pos_x = x,
		pos_y = y,
		v_x = v_x,
		v_y = v_y,
		radius = CONST.BOMB_MIN_RADIUS,
		mass = CONST.BOMB_MASS,

		object_type = CONST.OBJ_BOMB,
		team = team,
		obj_id = obj_id,
		player_id = player_id,

		timer = CONST.BOMB_TIME_TO_DET,
		stat = 0,
		
		timer_ceil = Math.ceil(timer/1000),
		blast_played = false;
	
	this.server_update = function(data)
	{
		var diff_x = data['x'] - pos_x;
		var diff_y = data['y'] - pos_y;

		if (Math.abs(diff_x) > CONST.OBJECT_POSITION_CORRECT_X)
			pos_x = data['x'];
		else pos_x += diff_x*CONST.POSITION_CORRECTION_PERCENT;

		if (Math.abs(diff_y) > CONST.OBJECT_POSITION_CORRECT_Y)
			pos_y = data['y'];
		else pos_y += diff_y*CONST.POSITION_CORRECTION_PERCENT;

		v_x = data['v_x'];
		v_y = data['v_y'];
		stat = data['stat'];
		timer = data['timer'];
	};
	
	this.refresh = function(interval, par_col, player_list, obj_ids_to_del)
	{		
		if (pos_x - CONST.BOMB_MIN_RADIUS <= 0)
			{v_x = -CONST.BOMB_WALL_LOSS*v_x; pos_x = radius;}
		else if (pos_x + CONST.BOMB_MIN_RADIUS >= CONST.MAP_WIDTH)
			{v_x = -CONST.BOMB_WALL_LOSS*v_x; pos_x = CONST.MAP_WIDTH-radius;}
		if (pos_y - CONST.BOMB_MIN_RADIUS <= 0)
			{v_y = -CONST.BOMB_WALL_LOSS*v_y; pos_y = radius;}
		else if (pos_y + CONST.BOMB_MIN_RADIUS >= CONST.MAP_HEIGHT)
			{v_y = -CONST.BOMB_WALL_LOSS*v_y; pos_y = CONST.MAP_HEIGHT-radius;}

		if (stat & CONST.BOMB_STATUS_DETONATED)
		{
			radius = CONST.BOMB_BLAST_RADIUS;
			v_x = v_y = 0;
		}
		pos_x += v_x*interval;
		pos_y += v_y*interval;
		
		timer -= interval;
		if (timer < 0) timer = 0;
	};
	
	this.draw = function (context, map_pos_x, map_pos_y)
	{
		var x = pos_x - map_pos_x;
		var y = pos_y - map_pos_y;

		if (x >= (-radius) && x <= (CONST.CANVAS_WIDTH + radius) && y >= (-radius) && y <= (CONST.CANVAS_HEIGHT + radius))
		{
			if (Math.ceil(timer/1000) < timer_ceil && !(stat & CONST.G_OBJECT_STATUS_DETONATED))
			{
				tick.play();
				timer_ceil = Math.ceil(timer/1000);
			}
			else if (stat & CONST.G_OBJECT_STATUS_DETONATED && !blast_played)
			{
				blast.play();
				blast_played = true;
			}
			context.save();
			context.translate(x, y);

			var gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1*radius);
			if (stat == 0){
				gradient.addColorStop(0, CONST.TEAM_LIGHT[team]);
				gradient.addColorStop(1, CONST.TEAM_DARK[team]);
			} else if (stat & CONST.BOMB_STATUS_DETONATED){
				gradient.addColorStop(0, "transparent");
				gradient.addColorStop(1 - timer/CONST.BOMB_TIME_TO_LAST, CONST.TEAM_LIGHT[team]);
				gradient.addColorStop(1, "transparent");
			}
			context.beginPath();
			context.arc(0,0,radius,0,2*Math.PI,false);
			context.fillStyle = gradient;
			context.fill();
			context.lineWidth = 0;
			context.strokeStyle = "transparent";
			context.stroke();
			if (stat == 0){
				context.fillStyle = CONST.POWER_UP_TEXT_COLOR;
				context.font = CONST.POWER_UP_FONT;
				context.fillText(timer_ceil,-6,5);
			}
			context.restore();
		}
	}
	
	return this;
}

function Power_Up_Object(x, y, v_x, v_y, power_up_type)
{
	var pos_x = x,
		pos_y = y,
		v_x = v_x,
		v_y = v_y,
		radius = CONST.POWER_UP_RADIUS,
		type = CONST.OBJ_POWER_UP,
		power_up_type = power_up_type,
		text = CONST.POWER_UP_CHAR[power_up_type];
	
	this.server_update = function(data)
	{
		var diff_x = data['x'] - pos_x;
		var diff_y = data['y'] - pos_y;

		if (Math.abs(diff_x) > CONST.OBJECT_POSITION_CORRECT_X)
			pos_x = data['x'];
		else pos_x += diff_x*CONST.POSITION_CORRECTION_PERCENT;

		if (Math.abs(diff_y) > CONST.OBJECT_POSITION_CORRECT_Y)
			pos_y = data['y'];
		else pos_y += diff_y*CONST.POSITION_CORRECTION_PERCENT;

		v_x = data['v_x'];
		v_y = data['v_y'];
	};
	
	this.refresh = function(interval)
	{		
		if (pos_x - radius <= 0)
			{v_x = -CONST.G_OBJECT_WALL_LOSS*v_x; pos_x = radius;}
		else if (pos_x + radius >= CONST.MAP_WIDTH)
			{v_x = -CONST.G_OBJECT_WALL_LOSS*v_x; pos_x = CONST.MAP_WIDTH-radius;}
		if (pos_y - radius <= 0)
			{v_y = -CONST.G_OBJECT_WALL_LOSS*v_y; pos_y = radius;}
		else if (pos_y + radius >= CONST.MAP_HEIGHT)
			{v_y = -CONST.G_OBJECT_WALL_LOSS*v_y; pos_y = CONST.MAP_HEIGHT-radius;}
			
		pos_x += v_x*interval;
		pos_y += v_y*interval;
	};
	
	this.draw = function (context, map_pos_x, map_pos_y)
	{
		var x = pos_x - map_pos_x;
		var y = pos_y - map_pos_y;

		if (x >= (-radius) && x <= (CONST.CANVAS_WIDTH + radius) && y >= (-radius) && y <= (CONST.CANVAS_HEIGHT + radius))
		{
			context.save();
			context.translate(x, y);

			var gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1*radius);
			gradient.addColorStop(0, CONST.TEAM_LIGHT[CONST.TEAM0]);
			gradient.addColorStop(1, CONST.TEAM_DARK[CONST.TEAM0]);
				
			context.beginPath();
			context.arc(0,0,radius,0,2*Math.PI,false);
			context.fillStyle = gradient;
			context.fill();
			context.stroke();
			
			context.fillStyle = CONST.POWER_UP_TEXT_COLOR;
			context.font = CONST.POWER_UP_FONT;
			context.fillText(text,-6,5);
		
			context.restore();
		}
	}
};

function Game()
{
	var request_id;
	var interval_id;
	
	var main_canvas = $("<canvas id='main_canvas' width='" + CONST.CANVAS_WIDTH + "' height='" + CONST.CANVAS_HEIGHT + "'>Update your browser</canvas>");
	var main_context = main_canvas.get(0).getContext('2d');
	
	var server_url = 'http://' + (window.location.hostname || "localhost") + ':8080';
	var socket;
	var socket_worker;

	var key_down = {};

	var background = new Background();
	
	var draw_timer = new Timer();
	var refresh_timer = new Timer();
	var ping_timer = new Timer();
	var ping = 0;
	var ping_arr = [];
	
	for (var i=0; i<200;i++) ping_arr.push(0);
	
	var debug = false;
	var frame_rates = false;
	var quit = false;
	
	var player_col = {};
	var player_id = 0;

	var par_col = {};
	var obj_col = {};
	
	function draw_ping (context)
	{
		var ping_max = 200;
		context.save();
		context.fillStyle = "lime";
		context.fillText(ping_max, 10, 10);
		context.fillText((1000/ping_timer.frame_rate).toFixed(1), 10, 30);
		context.fillText("0", 10, 50);
		for (var i = 0, len = ping_arr.length; i < len; i++)
		{
			context.beginPath();
			context.strokeStyle = "lime";
			context.lineWidth = 1;
			context.moveTo(40+i,ping_max-ping_arr[i]>0?50*(ping_max-ping_arr[i])/ping_max:0);
			context.lineTo(40+i,50);
			context.stroke();
		}
		context.restore();
	}
	
	this.initialize = function () {
	
		background.initialize();
		
		$(window)['keydown'](function (key_code) {
			if (debug) console.log("Key down: " + key_code.keyCode);
			key_down[key_code.keyCode]=true;
			});
		$(window)['keyup'](function (key_code) {
			if (key_code.keyCode==CONST.KEY_CODE_DEBUG) { debug = !debug; console.log("Debug " + (debug?"on.":"off.")); }
			if (key_code.keyCode==CONST.KEY_CODE_FRAMERATE) frame_rates = !frame_rates;
			if (debug) console.log("Key up: " + key_code.keyCode);
			key_down[key_code.keyCode]=false;
			});
		
		console.log("Attempting to connect to " + server_url);
		
		socket = io['connect'](server_url);
		//if (socket) console.log("Server is down");
		socket['on']("connect", function(){console.log("connected...");});
		socket['on']("error", function(){console.log("connection error...");});
		
		socket['on']("player_id", function(data){ player_id = data['p_id']; player_col[player_id] = new Player(data['team']); });
		
		socket['on']("player_list", function(data){
			for (var u in data) if (typeof player_col[u] === 'undefined') player_col[u] = new Player(data[u]);
		});
		socket['on']("player_removed", function(data){delete player_col[data]; });
		
		socket['on']("par", function(data){
			if (typeof par_col[data['id']] === 'undefined') par_col[data['id']] = new Particle(data['id'],data['x'],data['y'],data['v_x'],data['v_y'],CONST.PARTICLE_COLOR);
			par_col[data['id']].server_update(data);
		});
		socket['on']("par_delete", function(data) { delete par_col[data]; });

		socket['on']("obj", function(data){
			if (typeof obj_col[data['id']] === 'undefined'){
				switch (data['type']){
					case CONST.OBJ_POWER_UP:
						obj_col[data['id']] = new Power_Up_Object(data['x'], data['y'], data['v_x'], data['v_y'], data['p_t']);
					break;
					case CONST.OBJ_G_OBJECT:
						obj_col[data['id']] = new G_Object(data['x'], data['y'], data['v_x'], data['v_y'], data['team']);
					break;
					case CONST.OBJ_BOMB:
						obj_col[data['id']] = new Bomb(data['x'], data['y'], data['v_x'], data['v_y'], data['team']);
					break;
				}
			}
			
			obj_col[data['id']].server_update(data);
		});
		socket['on']("obj_delete", function(data) { delete obj_col[data]; });
		
		var init_wait = function(){
			if (player_id != 0){
				socket['on']("pong", function(data){
					if (player_id == 0) return;
					if (typeof player_col[data['p_id']] === 'undefined')
					{
						socket['emit']("request_player_list", player_id);
						return;
					}
					if (data['p_id']==player_id)
					{
						ping = ping_timer.interval;
						ping_arr.shift();
						ping_arr.push(ping);
						if (debug) console.log(ping);
					}
					
					player_col[data['p_id']].server_update(data);
				});
				
				main_canvas['appendTo']("body");
				refresh();
				interval_id = setInterval(refresh, 1000/CONST.UPS);
				draw();
			} else setTimeout(init_wait, 500);
		};
		
		init_wait();
	};

	function refresh() {
		var refresh_interval = refresh_timer.interval;
		
		player_col[player_id].set_command_state(key_down);

		if (player_col[player_id].server_set)
		{
			socket['emit']("ping", player_col[player_id].move_command_state());
			player_col[player_id].server_set = false;
		}
		
		for (var u in player_col) player_col[u].refresh(refresh_interval);
		for (var u in par_col) par_col[u].refresh(refresh_interval);
		for (var u in obj_col) obj_col[u].refresh(refresh_interval);

		if (frame_rates) console.log("refresh interval: " + refresh_interval + " frame rate: " + refresh_timer.frame_rate.toFixed(2));
		if (key_down[81]) {quit = true; clearInterval(interval_id); console.log("Quit command sent");}
		//if (!socket.socket.connected) {console.log("socket not connected, quitting"); quit = true;clearInterval(interval_id);}
	};

	function draw() {
		if (!quit) request_id = window.requestAnimFrame(draw);//self.draw);
		
		var draw_interval = draw_timer.interval;
		background.draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		for (var u in obj_col) obj_col[u].draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		for (var u in par_col) par_col[u].draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		for (var u in player_col) if (u != player_id) player_col[u].net_draw(main_context, player_col[player_id].map_pos_x, player_col[player_id].map_pos_y);
		player_col[player_id].draw(main_context);
		
		if (debug) draw_ping(main_context);
		if (frame_rates) console.log("draw interval: " + draw_interval + " frame rate: " + draw_timer.frame_rate.toFixed(2));
	};

	return this;
}

var main_game = new Game();

main_game.initialize();

})();
