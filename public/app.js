var socket, fly, session;
var displays = [];

var displays = {
	arr: [],
	maxDomHeight: 130-4,
	maxHeight: 0,
	dom: document.getElementById('screens'),
	initialScreenData: false,

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
		// console.log("the element", el);
		this.dom.removeChild(el.dom);
		this.updateDom();
	}
}

var init = function() {

	session = socket.socket.sessionid;

	socket.emit("myResolution", {width: window.innerWidth, height: window.innerHeight});

	socket.on("clients", function(data) {
		displays.initialScreenData = true;
		// console.log(data);
		for (var id in data) {
			displays.add(data[id].width, data[id].height, id, data[id].order);
		}
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
}

window.addEventListener("load", function() {
	socket = io.connect("http://localhost:9000");

	socket.on("connect", init);
});

window.addEventListener("resize", function() {
		console.log("resized");
		if (displays.initialScreenData)
			displays.update(session, window.innerWidth, window.innerHeight);
		socket.emit("myResolution", {width: window.innerWidth, height: window.innerHeight});
});