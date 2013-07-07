var socket, fly, session;
var displays = [];

var __settings__speed = 15000;

var displays = {
	arr: [],
	maxDomHeight: 54-4,
	maxHeight: 0,
	dom: document.getElementById('screens'),
	initialScreenData: false,

	totalWidth: 0,
	totalHeight: 0,

	add: function (w, h, socketId, order) {
		var el = document.createElement("div");
		el.id = 'display_' + socketId;
		el.width = w;
		el.height = h;
		this.dom.appendChild(el);

		this.maxHeight = Math.max(h, this.maxHeight);
		if (order === undefined) {
			order = this.arr.length;
		}
		this.arr.push({width: w, height: h, id: socketId, dom: el, order: order});
		this.totalWidth+=w;
		this.totalHeight = Math.max(h, this.totalHeight);
		// console.log(this.arr);
		this.updateDom();
	},

	update: function(id, w, h) {
		for (var i = 0;i<this.arr.length;i++) {
			if (this.arr[i].id === id) {
				this.arr[i].width = w;
				this.arr[i].height = h;
				this.updateDom();
				return;
			}
		}
		this.add(w,h,id);
	},

	domRatio: function(realW, realH) {
		var ratio = realW / realH;
		var h = (this.maxDomHeight * realH) / this.maxHeight;
		var w = h * ratio;
		return {width: w, height: h};
	},

	updateDom: function() {
		console.log("update dom:", this.arr);
		for (var i = 0; i<this.arr.length; i++) {
			var disp = this.arr[i];
			var res = this.domRatio(disp.width, disp.height);
			disp.dom.style.width = res.width + "px";
			disp.dom.style.height = res.height + "px";
			console.log("height: ", disp.dom.style.height, "maxdomheight:", this.maxDomHeight, "maxh:", this.maxHeight);
		}
	},

	getIndexById: function(id) {
		for (var i = 0;i<this.arr.length;i++) {
			if (this.arr[i].id === id) {
				return i;
			}
		}
	},

	rm: function(id) {
		var index;
		for (var i = 0;i<this.arr.length;i++) {
			if (this.arr[i].id === id) {
				index = i;
				break;
			}
		}
		if (index === undefined) return;
		var el = this.arr.splice(index,1)[0];

		// this.totalWidth-=el.width;
		if (this.totalHeight >= el.height) {
			this.totalHeight = 0;
			for (var i=0;i<this.arr.length;i++) {
				this.totalHeight = Math.max(this.totalHeight, this.arr[i].height);
			}
		}

		// console.log("the element", el);
		this.dom.removeChild(el.dom);
		this.updateDom();
	},

	screenXY: function(x,y,screenId) {
		var offsetx=0;
		// console.log("array", this.arr);
		for (var i=0;i<screenId;i++) {
			offsetx+=this.arr[i].width;
		}
		console.log("offsetX is ", offsetx);
		return {x: x - offsetx, y: y};
	}
}

var thething = {
	pos: {
		absX: 0,
		absY: 0,
		x: 0,
		y: 0,
		screen: 0
	},
	dom: document.getElementById("object"),
	clickAt: function(x,y,screen) {
		this.pos.x = x-354;
		this.pos.y = y-77;
		this.pos.screen = screen;
		this.pos.absY = this.pos.y;
		this.pos.absX = this.pos.x;
		for (var i=0;i<screen;i++) {
			this.pos.absX+=displays.arr[i].width;
		}
	},
	getOnScreenXY: function() {
		return displays.screenXY(this.pos.absX, this.pos.absY, displays.getIndexById(session));
	},
	t: null,
	update: function() {
		var p = this.getOnScreenXY();

		var tmpx = parseInt(this.dom.style.left);
		var tmpy = parseInt(this.dom.style.top);
		var ddom = this.dom;
		t = new TWEEN.Tween({x: tmpx, y:tmpy})
			.to({x: p.x, y: p.y}, __settings__speed).onUpdate(function() {
				ddom.style.left = this.x + "px";
				ddom.style.top = this.y + "px";				
			}).start();
	},
	quickupdate: function() {
		var p = this.getOnScreenXY();

		var ddom = this.dom;
	
		ddom.style.left = p.x + "px";
		ddom.style.top = p.y + "px";
	}
};

var init = function() {

	session = socket.socket.sessionid;

	socket.emit("myResolution", {width: window.innerWidth, height: window.innerHeight});

	socket.on("clients", function(data) {
		displays.initialScreenData = true;
		// console.log(data);
		for (var id in data.clients) {
			displays.add(data.clients[id].width, data.clients[id].height, id, data.clients[id].order);
		}
		// thing
		thething.pos = data.thing;
		thething.quickupdate();
	});

	socket.on("screenData", function(data) {
		if (displays.initialScreenData)
			displays.update(data.id, data.width, data.height);
	});

	socket.on("disconnect", function() {
		console.log("disconnected");
	});

	socket.on("clientDisconnected", function(id) {
		displays.rm(id);
	});

	socket.on("movething", function(data) {
		thething.pos = data;
		thething.update();
		console.log("thing moved");
	});


    animate();
}
	 function animate() {

        requestAnimationFrame( animate ); // js/RequestAnimationFrame.js needs to be included too.
        TWEEN.update();

    }

window.addEventListener("load", function() {
	socket = io.connect("http://192.168.88.6:9000");

	socket.on("connect", init);
});

window.addEventListener("resize", function() {
		console.log("resized");
		if (displays.initialScreenData)
			displays.update(session, window.innerWidth, window.innerHeight);
		socket.emit("myResolution", {width: window.innerWidth, height: window.innerHeight});
});

/*
window.addEventListener("click", function(data) {
	thething.clickAt(data.clientX, data.clientY, displays.getIndexById(session));
	console.log(thething.pos);

	socket.emit("click", thething.pos);
	thething.update();
});
*/
requestAnimationFrame(function() { TWEEN.update(); });