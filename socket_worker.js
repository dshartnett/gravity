importScripts("/socket.io/socket.io.js");

var socket = io.connect("http://localhost:8080");
socket.on("pong", function (e) {postMessage(e);});

onmessage = function (e) {
	if (e.data == "do something") postMessage(e.data);
	if (e.data == "ping") socket.emit("ping", "ping");
};
