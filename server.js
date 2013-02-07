(function(){

"use strict";

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

var CONST = require('./site/constants.js').getConstants();
var app = require('http').createServer(handler);
var io = require('socket.io').listen(app);
var staticReq = require('node-static'); // for serving files

// This will make all the files in the current folder accessible
var fileServer = new staticReq.Server('./site/');
	
// http://localhost:8080
app.listen(8080);

// If the URL of the socket server is opened in a browser
function handler(request, response) {request.addListener('end', function () {fileServer.serve(request, response);}); }
//function handler(request, response) {response.writeHeader(200, {'Content-Type': 'text/plain'});  response.end('Hello World\n');}

// Delete this row if you want to see debug messages
io.set('log level', 1);

var PLAYER_ID = 0;
var player_list = {};

var PAR_ID = 0;
var par_col = {};
var par_ids_to_del = [];

var OBJ_ID = 0;
var obj_col = {};
var obj_ids_to_del = [];

var main_timer = new Timer();

setInterval(function () {
	//console.log(Date.now() + "    " + Math.random()*Math.pow(2,32));
	var server_interval = main_timer.interval;
//	if(100*Math.random() < 1) obj_col[++OBJ_ID] = new G_Object(Math.random()*CONST.MAP_WIDTH, Math.random()*CONST.MAP_HEIGHT, 0, 0, 0, OBJ_ID, 0);
	if(100*Math.random() < 1) obj_col[++OBJ_ID] = new Power_Up_Object(OBJ_ID, Math.random()*CONST.MAP_WIDTH, Math.random()*CONST.MAP_HEIGHT, Math.random()*0.1, Math.random()*0.1, CONST.POWER_UP_G_OBJECT);
	for (var u in player_list) player_list[u].player.update(server_interval, par_col, obj_col, par_ids_to_del);
	for (var u in par_col) par_col[u].update(server_interval);
	for (var i = 0, len = par_ids_to_del.length; i < len; i++) {
		console.log("deleting particle " + par_ids_to_del[0] + " and emitting delete");
		io.sockets.emit("par_delete", par_ids_to_del[0]);
		delete par_col[par_ids_to_del.shift()];
	}
	for (var u in obj_col) obj_col[u].update(server_interval, par_col, player_list, obj_ids_to_del);
	for (var i = 0, len = obj_ids_to_del.length; i < len; i++) {
		console.log("deleting object " + obj_ids_to_del[0] + " and emitting delete");
		io.sockets.emit("obj_delete", obj_ids_to_del[0]);
		delete obj_col[obj_ids_to_del.shift()];
	}
//	console.log(server_interval);
},1000/CONST.UPS);

// Listen for incoming connections from clients
io.sockets.on('connection', function (socket) {
	++PLAYER_ID;

	player_list[socket.id] = {
		start_interval: Date.now(),
		end_interval: null,
		player:new Player(PLAYER_ID, Math.ceil(2*Math.random()))
	};

	console.log("player " + player_list[socket.id].player.player_id + " connected on socket " + socket.id + ". ponging now...");
	
	socket.emit("connected",{p_id:player_list[socket.id].player.player_id, team:player_list[socket.id].player.team});
	//socket.broadcast.emit('player_added', player_list[socket.id].player.player_id);
	socket.emit("pong",player_list[socket.id].player.data());

	socket.on("request_player_list", function(data) {
		var p_list = {};
		for (var u in player_list) p_list[player_list[u].player.player_id] = player_list[u].player.team;
		socket.emit("player_list", p_list);
	});
	
	socket.on("ping", function(data) {
		player_list[socket.id].end_interval = Date.now();
		var interval = player_list[socket.id].end_interval - player_list[socket.id].start_interval;
		//console.log("pinged with: " + data + " player id: " + player_list[socket.id].player.player_id + "  socket id: " + socket.id + " interval: " + interval);

		player_list[socket.id].player.move_command_state = data;
		//player_list[socket.id].player.update(interval);

		player_list[socket.id].start_interval = Date.now();

		//socket.volatile.emit("pong", player_list[socket.id].player.data());
		for (var u in player_list) socket.volatile.emit("pong", player_list[u].player.data());
		for (var u in par_col) socket.volatile.emit("par", par_col[u].data());
		for (var u in obj_col) socket.volatile.emit("obj", obj_col[u].data());
		//setTimeout(function(){socket.emit("pong", player_list[socket.id].player.data());}, 200);
	});

	socket.on('disconnect', function(){
		console.log("player " + player_list[socket.id].player.player_id + " disconnected");
		socket.broadcast.emit('player_removed', player_list[socket.id].player.player_id);
		player_list[socket.id].player.disconnect(par_ids_to_del);
		delete player_list[socket.id];
	});
});

function Particle(x,y,v_x,v_y,team,particle_id,player_id){
        this.pos_x = x;
        this.pos_y = y;
		this.last_pos_x = x;
		this.last_pos_y = y;
        this.v_x = v_x;
        this.v_y = v_y;
        this.mass = CONST.PARTICLE_MASS;
        this.charge = CONST.PARTICLE_CHARGE;
        this.size = CONST.PARTICLE_SIZE;
        this.half_size = this.size/2;
		
        this.team = team;
		this.particle_id = particle_id;
		this.player_id = player_id;

		this.data = function() {return {id:this.particle_id, x:this.pos_x, y:this.pos_y, v_x:this.v_x, v_y:this.v_y};};
		
        this.update = function(interval) {
				this.last_pos_x = this.pos_x;
				this.last_pos_y = this.pos_y;
                this.pos_x += this.v_x*interval;
                this.pos_y += this.v_y*interval;

                if (this.pos_x >= CONST.MAP_WIDTH) {this.pos_x = CONST.MAP_WIDTH - 1; this.v_x = -this.v_x*CONST.PARTICLE_WALL_LOSS;}
                else if (this.pos_x <= 0) {this.pos_x = 1; this.v_x = -this.v_x*CONST.PARTICLE_WALL_LOSS;}

                if (this.pos_y >= CONST.MAP_HEIGHT) {this.pos_y = CONST.MAP_HEIGHT - 1; this.v_y = -this.v_y*CONST.PARTICLE_WALL_LOSS;}
                else if (this.pos_y <= 0) {this.pos_y = 1; this.v_y = -this.v_y*CONST.PARTICLE_WALL_LOSS;}
        }
        return this;
}

function Player(player_id, team){
	this.player_id = player_id;
	this.team = team;
	
	this.pos_x = (0.1 + Math.random()*0.8)*CONST.MAP_WIDTH;
	this.pos_y = (0.1 + Math.random()*0.8)*CONST.MAP_HEIGHT;
	this.angle = 0;
	this.v_x = 0;
	this.v_y = 0;
	
	this.radius = CONST.PLAYER_RADIUS;
	this.wing_angle = CONST.PLAYER_WING_ANGLE;
	
	this.health = CONST.PLAYER_MAX_HEALTH;
	this.mass = CONST.PLAYER_MASS;
	
	this.dying_counter = 0;
	this.fire_battery = 0;
	this.g_object = 1;
	this.bomb = 1;
	this.status = 0;
	
	this.move_command_state = 0;
	
	this.server_set = false;
	
	var particle_ids = [];

	this.disconnect = function(par_ids_to_del)
	{
		for (var i in particle_ids) par_ids_to_del.push(particle_ids[i]);
	};
	
	this.spawn = function()
	{
		this.health = CONST.PLAYER_MAX_HEALTH;
		this.v_x = 0;
		this.v_y = 0;
		this.angle = Math.random()*2*Math.PI;
		this.pos_x = (0.1 + Math.random()*0.8)*CONST.MAP_WIDTH;
		this.pos_y = (0.1 + Math.random()*0.8)*CONST.MAP_HEIGHT;
		this.dying_counter = 0;
		this.fire_battery = 0;
		this.status = 0;
		this.g_object = 1;
		this.bomb = 1;
	};

	this.data = function(){
	return {p_id:this.player_id,
		x:this.pos_x,
		y:this.pos_y,
		v_x:this.v_x,
		v_y:this.v_y,
		angle:this.angle,
		health:this.health,
		status:this.status};
	};

	this.update = function (interval, par_col, obj_col, par_ids_to_del) {
		this.v_x -= CONST.PLAYER_FRICTION*this.v_x*interval;
		this.v_y -= CONST.PLAYER_FRICTION*this.v_y*interval;

		if (this.status & CONST.PLAYER_STATUS_DEAD)
		{
			this.dying_counter -= interval;
			this.move_command_state = 0;
		}
		
		if (this.dying_counter < 0) this.spawn();
		
		//if (this.shield_fade > 0) this.shield_fade -= interval;
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
			//this.request_state += CONST.COMMAND_FIRE;
			//this.fire_request = true;
			var temp_v_x = this.v_x;
			var temp_v_y = this.v_y;
			this.fire_battery = CONST.PLAYER_FIRE_BATTERY;
			this.v_x -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.cos(this.angle)/this.mass;
			this.v_y -= CONST.PARTICLE_MASS*CONST.PARTICLE_INITIAL_VELOCITY*Math.sin(this.angle)/this.mass;
			par_col[++PAR_ID] = new Particle(
				this.pos_x,// + CONST.PLAYER_RADIUS*Math.cos(this.angle),
				this.pos_y,// + CONST.PLAYER_RADIUS*Math.sin(this.angle),
				temp_v_x + CONST.PARTICLE_INITIAL_VELOCITY*Math.cos(this.angle),
				temp_v_y + CONST.PARTICLE_INITIAL_VELOCITY*Math.sin(this.angle),
				this.team, PAR_ID, this.player_id);
				
			console.log("player " + this.player_id + " fired particle " + PAR_ID);
			particle_ids.push(PAR_ID);
			if (particle_ids.length > CONST.PLAYER_MAX_BULLETS){
				var last_p = particle_ids.shift();
				console.log("deleting particle " + last_p + " from player " + this.player_id);
				par_ids_to_del.push(last_p);
				//delete par_col[last_p];
			}
		}
		//else this.fire_request = false;
		if (this.g_object > 0 && this.move_command_state & CONST.COMMAND_G_OBJECT)
		{
			var temp_v_x = this.v_x;
			var temp_v_y = this.v_y;
			this.v_x -= CONST.G_OBJECT_LAUNCH_MASS*CONST.G_OBJECT_INITIAL_VELOCITY*Math.cos(this.angle)/this.mass;
			this.v_y -= CONST.G_OBJECT_LAUNCH_MASS*CONST.G_OBJECT_INITIAL_VELOCITY*Math.sin(this.angle)/this.mass;
			obj_col[++OBJ_ID] = new G_Object(
				this.pos_x,// + CONST.PLAYER_RADIUS*Math.cos(this.angle),
				this.pos_y,// + CONST.PLAYER_RADIUS*Math.sin(this.angle),
				temp_v_x + CONST.G_OBJECT_INITIAL_VELOCITY*Math.cos(this.angle),
				temp_v_y + CONST.G_OBJECT_INITIAL_VELOCITY*Math.sin(this.angle),
				this.team, OBJ_ID, this.player_id);
			console.log("player " + this.player_id + " launched G_Object " + OBJ_ID);
			this.g_object--;
		}

		this.pos_x += this.v_x*interval;
		this.pos_y += this.v_y*interval;
		if (this.health < CONST.PLAYER_MAX_HEALTH && !(this.status & CONST.PLAYER_STATUS_DEAD)) this.health += CONST.PLAYER_HEALTH_REGEN*interval;
		if (this.health > CONST.PLAYER_MAX_HEALTH) this.health = CONST.PLAYER_MAX_HEALTH;
		
		for (var i in par_col)
		{
			if (par_col[i].team != this.team)
			{
				var diff_x = par_col[i].pos_x - this.pos_x;
				var diff_y = par_col[i].pos_y - this.pos_y;
				if (diff_x*diff_x + diff_y*diff_y < this.radius*this.radius)
				{
					this.health -= CONST.PARTICLE_DAMAGE;
					par_ids_to_del.push(i);
					console.log("collision");
				}
			}
		}
		
		for (var u in obj_col)
		{
			if (obj_col[u].object_type == CONST.OBJ_POWER_UP)
			{
				var diff_x = obj_col[u].pos_x - this.pos_x;
				var diff_y = obj_col[u].pos_y - this.pos_y;
				if (diff_x*diff_x + diff_y*diff_y < this.radius*this.radius)
				{
					switch(obj_col[u].power_up_type)
					{
						case CONST.POWER_UP_CLOAK:
						break;
						case CONST.POWER_UP_INVINCIBLE:
						break;
						case CONST.POWER_UP_G_OBJECT:
							if (this.g_object < 1)
							{
								this.g_object = obj_col[u].power_up();
							}
						break;
						case CONST.POWER_UP_BOMB:
						break;
					}
				}
			}
		}

		if (this.pos_x - this.radius <= 0)
			{this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = this.radius; this.health -= CONST.WALL_DAMAGE_MULTIPLIER*this.v_x + CONST.WALL_DAMAGE_MINIMUM;}
		else if (this.pos_x + this.radius >= CONST.MAP_WIDTH)
			{this.v_x = -CONST.PLAYER_WALL_LOSS*this.v_x; this.pos_x = CONST.MAP_WIDTH-this.radius; this.health -= -CONST.WALL_DAMAGE_MULTIPLIER*this.v_x + CONST.WALL_DAMAGE_MINIMUM;}
		if (this.pos_y - this.radius <= 0)
			{this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = this.radius; this.health -= CONST.WALL_DAMAGE_MULTIPLIER*this.v_y + CONST.WALL_DAMAGE_MINIMUM;}
		else if (this.pos_y + this.radius >= CONST.MAP_HEIGHT)
			{this.v_y = -CONST.PLAYER_WALL_LOSS*this.v_y; this.pos_y = CONST.MAP_HEIGHT-this.radius; this.health -= -CONST.WALL_DAMAGE_MULTIPLIER*this.v_y + CONST.WALL_DAMAGE_MINIMUM;}

		if (this.health < 0 && !(this.status & CONST.PLAYER_STATUS_DEAD)) {this.status |= CONST.PLAYER_STATUS_DEAD; this.dying_counter = CONST.PLAYER_DEAD_COUNTER_MAX;}
	};
	return this;
}

function Power_Up_Object(obj_id, x, y, v_x, v_y, power_up_type)
{
	this.obj_id = obj_id;
	this.pos_x = x;
	this.pos_y = y;
	this.v_x = v_x;
	this.v_y = v_y;
	this.radius = CONST.POWER_UP_RADIUS;
	this.object_type = CONST.OBJ_POWER_UP;
	this.power_up_type = power_up_type;
	
	this.item = 1;
	
	this.power_up = function()
	{
		var to_ret = this.item;
		this.item = 0;
		return to_ret;
	}
	
	this.data = function(){
		return {id:this.obj_id,
			type:this.object_type,
			p_t: this.power_up_type,
			x:this.pos_x,
			y:this.pos_y,
			v_x:this.v_x,
			v_y:this.v_y};
	};
	
	this.update = function(interval, par_col, player_list, obj_ids_to_del)
	{		
		if (this.pos_x - this.radius <= 0)
			{this.v_x = -CONST.G_OBJECT_WALL_LOSS*this.v_x; this.pos_x = this.radius;}
		else if (this.pos_x + this.radius >= CONST.MAP_WIDTH)
			{this.v_x = -CONST.G_OBJECT_WALL_LOSS*this.v_x; this.pos_x = CONST.MAP_WIDTH-this.radius;}
		if (this.pos_y - this.radius <= 0)
			{this.v_y = -CONST.G_OBJECT_WALL_LOSS*this.v_y; this.pos_y = this.radius;}
		else if (this.pos_y + this.radius >= CONST.MAP_HEIGHT)
			{this.v_y = -CONST.G_OBJECT_WALL_LOSS*this.v_y; this.pos_y = CONST.MAP_HEIGHT-this.radius;}
			
		this.pos_x += this.v_x*interval;
		this.pos_y += this.v_y*interval;
		
		if (this.item == 0) obj_ids_to_del.push(this.obj_id);
	};
};

// Gravity object class
function G_Object(x, y, v_x, v_y, team, obj_id, player_id)
{
	this.pos_x = x;
	this.pos_y = y;
	this.v_x = v_x;
	this.v_y = v_y;
	this.radius = CONST.G_OBJECT_MIN_RADIUS;
	this.mass = CONST.G_OBJECT_MASS;

	this.object_type = CONST.OBJ_G_OBJECT;
	this.team = team;
	this.obj_id = obj_id;
	this.player_id = player_id;

	this.timer = CONST.G_OBJECT_TIME_TO_DET;
	this.status = 0;

	this.data = function(){
		return {id:this.obj_id,
			type:this.object_type,
			x:this.pos_x,
			y:this.pos_y,
			v_x:this.v_x,
			v_y:this.v_y,
			team:this.team,
			status:this.status,
			timer:this.timer};
	};

	this.update = function(interval, par_col, player_list, obj_ids_to_del)
	{		
		if (this.pos_x - this.radius <= 0)
			{this.v_x = -CONST.G_OBJECT_WALL_LOSS*this.v_x; this.pos_x = this.radius;}
		else if (this.pos_x + this.radius >= CONST.MAP_WIDTH)
			{this.v_x = -CONST.G_OBJECT_WALL_LOSS*this.v_x; this.pos_x = CONST.MAP_WIDTH-this.radius;}
		if (this.pos_y - this.radius <= 0)
			{this.v_y = -CONST.G_OBJECT_WALL_LOSS*this.v_y; this.pos_y = this.radius;}
		else if (this.pos_y + this.radius >= CONST.MAP_HEIGHT)
			{this.v_y = -CONST.G_OBJECT_WALL_LOSS*this.v_y; this.pos_y = CONST.MAP_HEIGHT-this.radius;}
			
		this.pos_x += this.v_x*interval;
		this.pos_y += this.v_y*interval;

		this.timer -= interval;
		if (this.timer < 0){
			if (this.status == 0){
				this.status |= CONST.G_OBJECT_STATUS_DETONATED;
				this.timer = CONST.G_OBJECT_TIME_TO_LAST;
				this.radius = CONST.G_OBJECT_MAX_RADIUS;
				console.log("boom!");
			}
			else if (this.status & CONST.G_OBJECT_STATUS_DETONATED)//add to objects to delete
			{
			//	this.pos_x = this.pos_y = 100;
			//	this.v_x = this.v_y = 0.01;
			//	this.timer = CONST.G_OBJECT_TIME_TO_DET;
			//	this.status = 0;
				obj_ids_to_del.push(this.obj_id);
				console.log("object added to delete array");
			}
		}

		if (this.status & CONST.G_OBJECT_STATUS_DETONATED)
		{
			var disX, disY, distance2, distance, force;
			for (var i in par_col)
			{
					disX = this.pos_x - par_col[i].pos_x;
					disY = this.pos_y - par_col[i].pos_y;
					distance2 = disX*disX + disY*disY;
					if (distance2 > this.radius*this.radius)
					{
						distance = Math.sqrt(distance2);
						force = this.mass/distance2;
						par_col[i].v_x += interval*disX*force/distance;
						par_col[i].v_y += interval*disY*force/distance;
					}
					else
					{
						par_col[i].v_x -= CONST.G_OBJECT_FRICTION*par_col[i].v_x*interval;
						par_col[i].v_y -= CONST.G_OBJECT_FRICTION*par_col[i].v_y*interval;
					}
			}
			for (var i in player_list){
				if (this.team != player_list[i].player.team){
					disX = this.pos_x - player_list[i].player.pos_x;
					disY = this.pos_y - player_list[i].player.pos_y;
					distance2 = disX*disX + disY*disY;
					if (distance2 > this.radius*this.radius){
						distance = Math.sqrt(distance2);
						force = this.mass/distance2;
						player_list[i].player.v_x += interval*disX*force/distance;
						player_list[i].player.v_y += interval*disY*force/distance;
					}
				}
			}
		}
	};
	return this;
}

})();
