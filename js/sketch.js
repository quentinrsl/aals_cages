'use strict';

let scaleSize = 300
let CAGES = []

let marked_nodes = [];
let hide_marked = false;
let color_marked ;

let settings = {
	displayTiles: false,
	displayNodes: true,
	displayEdges: true,
	edgesWeight: 5,
	nodesSize: 10,
	nodesGradient: false,
	backgroundColour: "#FFFFFF",
	cage: 0,
	orthogonal_view: false,
	hue: 15,
	brightness: 100,
	saturation: 100,
	deltasaturation: 0,
	deltahue: 10,
	deltabrighness: 30,
}

function map(value, start1, stop1, start2, stop2) {
	return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

//GUI

let probaController;

let gui = new dat.GUI({ name: 'AaLS cage interaction network', width: 300 });
let tilesGui = gui.addFolder('Tiles');
let nodesGui = gui.addFolder('Nodes');
let edgesGui = gui.addFolder('Edges');
let colourGui = gui.addFolder('Colours');

gui.add(settings, 'cage', 0, 5, 1).name("Cage type");

colourGui.addColor(settings, "backgroundColour").name("background")
colourGui.add(settings, 'orthogonal_view', 0, 1, 1).name("Orthogonal view").onChange(function (value) {
	if (value) {
		ortho(-width / 2, width / 2, height / 2, -height / 2, 0, 10000)
	} else {
		perspective(PI / 3, width / height, 0.1, 10000)
	}
})
colourGui.add(settings, 'hue', 0, 100, 1).name("hue");
colourGui.add(settings, 'brightness', 0, 100, 1).name("brightness");
colourGui.add(settings, 'saturation', 0, 100, 1).name("saturation");
colourGui.add(settings, 'deltasaturation', 0, 100, 1).name("saturation gradient");
colourGui.add(settings, 'deltahue', 0, 100, 1).name("hue gradient");
colourGui.add(settings, 'deltabrighness', 0, 100, 1).name("brightness gradient");

tilesGui.add(settings, 'displayTiles', 0, 1, 1).name("show tiles");

nodesGui.add(settings, 'displayNodes', 0, 1, 1).name("show nodes");
nodesGui.add(settings, 'nodesSize', 0, 100, 1).name("nodes size");
nodesGui.add(settings, 'nodesGradient', 0, 1, 1).name("nodes gradient");

edgesGui.add(settings, 'displayEdges', 0, 1, 1).name("show edges");
edgesGui.add(settings, 'edgesWeight', 0, 10, 1).name("edges weight");

let test = {
	nodes: {
		0: { x: 0.5253100848194354, y: -0.8497332215263427, z: 5.5384355067954216e-06 },
		1: { x: -0.5248620253869116, y: 0.8507151861417487, z: 0.0001716915007193944 },
	},
	edges: [[0, 1]],
}

function preload() {
	CAGES = [AaLS_12, AaLS_24, AaLS_36, AaLS_48, AaLS_60, AaLS_72]
}
function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	perspective(PI / 3, width / height, 0.1, 10000);
	color_marked = color(255, 0, 0)
}

function gradientColor(z) {
	let s = map(z, -1, 1,max(settings.saturation - settings.deltasaturation, 0), settings.saturation)
	let h = map(z, -1, 1,settings.hue - settings.deltahue, settings.hue)
	let b = map(z, -1, 1,max(settings.brightness - settings.deltabrighness, 0), settings.brightness)
	return color(h,s,b)
}

function draw() {
	let cage = CAGES[settings.cage]
	colorMode(RGB, 255)
	smooth();
	orbitControl(3, 3,.2)
	background(settings.backgroundColour);


	//Set lighting
	ambientLight(200, 200, 200);
	ambientMaterial(255);
	strokeWeight(3);
	pointLight(255, 255, 255, 220, -420, 420);

	if (settings.displayTiles) {
		let tileColour = color(255)
		for (let points of cage.faces) {
			beginShape();
			fill(tileColour)
			noStroke()
			for (let pid of points) {
				let { x, y, z } = cage.nodes[pid]
				x = x * scaleSize
				y = y * scaleSize
				z = z * scaleSize
				let r = Math.sqrt(x * x + y * y + z * z)
				let scaled_x = (r - settings.nodesSize / 8) * x / r
				let scaled_y = (r - settings.nodesSize / 8) * y / r
				let scaled_z = (r - settings.nodesSize / 8) * z / r
				vertex(scaled_x, scaled_y, scaled_z)
			}
			endShape(CLOSE)
		}
	}

	if (settings.displayEdges) {
		noStroke()
		for (let [pid1, pid2] of cage.edges) {
			let v1 = createVector(cage.nodes[pid1].x * scaleSize, cage.nodes[pid1].y * scaleSize, cage.nodes[pid1].z * scaleSize)
			let v2 = createVector(cage.nodes[pid2].x * scaleSize, cage.nodes[pid2].y * scaleSize, cage.nodes[pid2].z * scaleSize)
			let direction = p5.Vector.sub(v2, v1);
			let midpoint = p5.Vector.lerp(v1, v2, 0.5);
			let axis = createVector(0, 1, 0).cross(direction).normalize()
			let angle = direction.angleBetween(createVector(0, 1, 0))
			colorMode(HSB, 100)
			let c = gradientColor(midpoint.z / scaleSize)
			fill(c)
			if(marked_nodes.indexOf(pid1) != -1 || marked_nodes.indexOf(pid2) != -1) {
				if(hide_marked) continue;
				fill(color_marked)
			}
			push()
			translate(midpoint.x, midpoint.y, midpoint.z);
			rotate(abs(angle), axis)
			cylinder(settings.edgesWeight, direction.mag() );
			pop()
		}
	}


	if (settings.displayNodes) {
		for (let pid of Object.keys(cage.nodes)) {
			let { x, y, z } = cage.nodes[pid]
			// stroke(settings.nodesColour)
			colorMode(HSB, 100)
			let c;
			if(settings.nodesGradient){
				c = gradientColor(z)
			}else{
				c = color(50,0,10)
			}
			noStroke()
			fill(c)
			if(marked_nodes.indexOf(Number(pid)) != -1) {
				if(hide_marked) continue;
				fill(color_marked)
			}
			// strokeWeight(settings.nodesSize);
			// point(scaleSize * x, scaleSize * y, scaleSize * z);
			push()
			translate(x * scaleSize, y * scaleSize, z * scaleSize);
			sphere(settings.nodesSize)
			pop()
		}

	}
}

function mouseDragged() {
	orbitControl();
}