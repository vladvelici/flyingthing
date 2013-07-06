var fs = require('fs');

var staticFilesPort = process.env.PORT || 8000;
var socketioPort = 9000;

var io = require('socket.io').listen(socketioPort);

var clients = {};
var clientOrder = [];
var getOrder = function(id) {
	for (var i=0;i<clientOrder.length; clientOrder++) {
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
		for (var i=0;i<clients.length;i++) {
			w+=clients[i].width;
			if (posX<=w)
				return {x: posX+w-clients[i].width, y:posY, screen: i};
		}
	}
};

io.sockets.on('connection', function (socket) {

	var order = clientOrder.length;

	clients[socket.id] = {width:undefined, height:undefined, order: order};

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
		// console.log("clikeddd!");
		thing = data;
		// console.log(thing);
		socket.broadcast.emit("movething", thing);
	});

	socket.on("disconnect", function() { 
		delete clients[socket.id];
		clientOrder.splice(socket.id,1);

		// update orders
		for (var sid in clients) {
			clients[sid].order = getOrder(sid);
		}

		// bigscreen update
		bigscreen.update();

		socket.broadcast.emit("clientDisconnected", socket.id);
	});
});

// Static file server:
var connect = require('connect'),
    http = require('http');

connect()
	.use(connect.static('public'))
	.listen(staticFilesPort);

// Nice greeting so you know it works:
console.log("Server started at http://localhost:" + staticFilesPort);
console.log("Socket.io is on port " + socketioPort);
