var fs = require('fs');
var __settings__speed = 15000;
var staticFilesPort = process.env.PORT || 8000;
var socketioPort = 9000;

var io = require('socket.io').listen(socketioPort);

var clients = {};
var clientOrder = [];
var getOrder = function(id) {
	for (var i=0;i<clientOrder.length; i++) {
		if (clientOrder[i] === id)
			return i;
	}
}

var thing = {
	absX: 0,
	absY: 0,
	x: 0,
	y: 0,
	screen: 0
}


var bigscreen = {
	width: 0,
	height: 0,
	update: function() {
		this.width = 0;
		for (var i in clients) {
			var cl = clients[i];
			this.width += cl.width;
			this.height = Math.max(this.height, cl.height);
		}
	},
	screenXY: function(posX, posY) {
		var w = 0;
		for (var i=0;i<clientOrder.length;i++) {
			var cl = clients[clientOrder[i]];
			w+=cl.width;
			if (posX<=w)
				return {x: posX+w-cl.width, y:posY, screen: i};
		}
	}
};

io.sockets.on('connection', function (socket) {

	var order = clientOrder.length;

	clients[socket.id] = {width:undefined, height:undefined, order: order};
	clientOrder[clientOrder.length] = socket.id;

	socket.on("myResolution", function(data) {
		var sendAfter = false;
		if (clients[socket.id].width === undefined || clients[socket.id].height === undefined) {
			sendAfter = true;
		}
		clients[socket.id].width = data.width;
		clients[socket.id].height = data.height;

		if (sendAfter)
			socket.emit("clients", {clients: clients, thing: thing});

		bigscreen.update();

		socket.broadcast.emit("screenData", {id: socket.id, width: data.width, height:data.height});

	});

	socket.on("click", function(data) {
		thing = data;
		socket.broadcast.emit("movething", thing);
	});

	socket.on("disconnect", function() { 
		clientOrder.splice(clients[socket.id].order,1);
		delete clients[socket.id];

		// update orders
		for (var sid in clients) {
			clients[sid].order = getOrder(sid);
		}

		// bigscreen update
		bigscreen.update();

		socket.broadcast.emit("clientDisconnected", socket.id);
	});


});


// fake clicks -- yay
// uni of southampton scrolling demo, fake clicks

var lastPosition = false;
setInterval(function() {
    console.log("fake click happened");
	if (clientOrder.length === 0) return false;

	var middle = (bigscreen.height / 2) - 77;
	lastPosition = !lastPosition;
	var newx = lastPosition === false ? bigscreen.width-831 : 10;
	var scrx = bigscreen.screenXY(newx, middle);
	var dest = {
		absX: newx,
		absY: middle,
		x: scrx.x,
		y: middle,
		screen: scrx.screen
	};
	io.sockets.emit("movething", dest);
}, __settings__speed);

// Static file server:
var http = require('http'),
    finalhandler = require('finalhandler'),
    serveStatic = require('serve-static');

var serve = serveStatic('./public');

var server = http.createServer(function(req, res) {
  var done = finalhandler(req, res);
  serve(req, res, done);
});


// Nice greeting so you know it works:
console.log("Server started at http://localhost:" + staticFilesPort);
console.log("Socket.io is on port " + socketioPort);

server.listen(staticFilesPort);
