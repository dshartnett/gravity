importScripts("./socket.io/socket.io.js");

var socket;

onmessage = function (e) {
	if (e.data.command == "connect")
	{
		socket = io.connect(e.data.server);
		postMessage(socket?"successfully connected":"connect failed");
		if (socket) socket.on("pong", function (e) {postMessage(e);});
	}
	else if (e.data == "ping") socket.emit("ping", "ping");
	else postMessage(e.data);
};
