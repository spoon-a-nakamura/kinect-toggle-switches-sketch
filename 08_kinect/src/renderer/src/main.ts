import GUI from "lil-gui";
import { Clock } from "./Clock";
import { Pixels, aspectRatio } from "./Pixels";
import { clamp, lerp, lerpColor, normalize } from "./mathUtils";
import { Viewport } from "./Viewport";
import { Person } from "./person";
import { Osc } from "./osc";

const clock = new Clock();
const viewport = new Viewport();

const gui = new GUI();
const variables = {
	threshold: 0.1,
	width: 100,
	color: 0x2dcb45,
	invert: false,
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const canvasEl = document.querySelector("canvas")!;
const ctx = canvasEl.getContext("2d")!;
/* eslint-enable @typescript-eslint/no-non-null-assertion */

function resizeCanvas() {
	canvasEl.setAttribute("width", `${viewport.width}px`);
	canvasEl.setAttribute("height", `${viewport.height}px`);
	Object.assign(canvasEl.style, {
		width: `${viewport.width / viewport.pixelRatio}px`,
		height: `${viewport.height / viewport.pixelRatio}px`,
	});
}
resizeCanvas();

viewport.addEventListener("resize", resizeCanvas);

const pixels = new Pixels(variables.width);

gui.add(variables, "threshold", 0, 1);
gui.add(variables, "width", 4, 150, 1).onChange((value: number) => {
	pixels.changeWidth(value);
});
gui.addColor(variables, "color");
gui.add(variables, "invert");

// function convertToZeroTo150(value) {
// 	const newValue = value + 10;
// 	const convertedValue = (newValue / 20) * 150;
// 	return convertedValue;
// }

// function convertToRGB(value) {
// 	const red = Math.floor((value / 150) * 255);
// 	const green = Math.floor((value / 150) * 255);
// 	const blue = Math.floor((value / 150) * 255);

// 	return { red: red, green: green, blue: blue };
// }

// // 例: 0から150までの値をRGBに変換して表示する
// for (let i = 0; i <= 150; i += 10) {
// 	const rgb = convertToRGB(i);
// 	console.log(i + " => RGB(" + rgb.red + ", " + rgb.green + ", " + rgb.blue + ")");
// }

class State {
	private video = document.createElement("video");
	public brightnesses: Float32Array;
	private persons: Person[] = [];
	private osc: Osc = new Osc();

	constructor(
		private width: number,
		private height: number,
	) {
		this.brightnesses = new Float32Array(width * height);
		navigator.mediaDevices
			.getUserMedia({
				video: {
					aspectRatio,
				},
				audio: false,
			})
			.then((stream) => {
				this.video.srcObject = stream;
				this.video.play();
			});
	}

	private oscMessage() {
		this.persons = [];

		this.osc.on(this.osc.MESSAGE, (address: string, args: []) => {
			// this.oscText = `address: ${address}\nargs:\n${JSON.stringify(args)}\n`;
			for (let i = 2; i < args.length; i += 96) {
				const p = new Person(args.splice(i, 96));
				if (p.id != "0") {
					this.persons.push(p);
				}
			}
			// const leftHandX = this.persons[0].hand_l.tx;
			// const rightHandX = this.persons[0].hand_r.tx;
			// const headX = this.persons[0].head.tx;
			// console.log("左手");
			// console.log(leftHandX * 100);
			// console.log("右手");
			// console.log(rightHandX * 100);
			// for (let i = -10; i <= 10; i++) {
			// variables.width = convertToZeroTo150(headX * 100);
			// console.log(convertToZeroTo150(headX * 100));
			// }
		});
	}
	private updateDataSize() {
		if (this.width !== pixels.width || this.height !== pixels.height) {
			this.width = pixels.width;
			this.height = pixels.height;
			this.brightnesses = new Float32Array(this.width * this.height);
		}
	}

	public update() {
		this.updateDataSize();

		ctx.drawImage(this.video, 0, 0, this.width, this.height);
		const src = ctx.getImageData(0, 0, this.width, this.height);
		for (let i = 0; i < src.data.length; i += 4) {
			const index = i / 4;
			const bi = variables.invert
				? index
				: Math.ceil(index / this.width) * this.width - 1 - (index % this.width);
			this.brightnesses[bi] = normalize(
				0,
				255,
				0.2126 * src.data[i] + 0.7152 * src.data[i + 1] + 0.0722 * src.data[i + 2],
			);
		}
		ctx.clearRect(0, 0, this.width, this.height);
		this.oscMessage();
	}
}

const state = new State(pixels.width, pixels.height);

class ToggleSwitch {
	private active = 0;
	public draw(x: number, y: number, width: number, selected: boolean) {
		this.active = clamp(lerp(this.active, selected ? 1 : 0, clock.delta * 0.01), 0, 1);
		const height = width / 1.6;
		const radius = height / 2;
		ctx.fillStyle = lerpColor(0xe6e6e6, variables.color, this.active);
		ctx.save();
		ctx.translate(x, y);
		ctx.beginPath();
		ctx.moveTo(radius, 0);
		ctx.lineTo(width - radius, 0);
		ctx.arc(width - radius, height / 2, radius, -Math.PI / 2, Math.PI / 2, false);
		ctx.lineTo(radius, height);
		ctx.arc(radius, height / 2, radius, Math.PI / 2, -Math.PI / 2, false);
		ctx.closePath();
		ctx.fill();
		ctx.fillStyle = "#fff";
		ctx.shadowColor = "#00000056";
		ctx.shadowOffsetY = radius / 25;
		ctx.shadowBlur = radius / 10;
		ctx.beginPath();

		ctx.arc(lerp(radius, width - radius, this.active), radius, radius * 0.9, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
}

class ToggleSwitches {
	private brightnessesLength: number;
	private toggleSwitches?: ToggleSwitch[];

	constructor() {
		this.brightnessesLength = state.brightnesses.length;
		this.reInitToggleSwitches();
	}

	private reInitToggleSwitches() {
		this.toggleSwitches = [...state.brightnesses].map(() => new ToggleSwitch());
	}

	public update() {
		if (this.brightnessesLength !== state.brightnesses.length) {
			this.brightnessesLength = state.brightnesses.length;
			this.reInitToggleSwitches();
		}

		const viewportAspectRatio = viewport.width / viewport.height;
		const videoAspectRatio = pixels.width / pixels.height;
		const scale = Math.max(
			viewportAspectRatio / videoAspectRatio,
			videoAspectRatio / viewportAspectRatio,
		);
		const size = Math.ceil(viewport.width / pixels.width) * scale;
		const switchScale = 0.9;
		const switchSize = size * switchScale;
		const offsetX = (size * pixels.width - viewport.width) / 2 - ((1 - switchScale) / 2) * size;
		const offsetY = (size * pixels.height - viewport.height) / 2;

		this.toggleSwitches?.forEach((toggleSwitch, i) => {
			const x = (i % pixels.width) * size - offsetX;
			const y = Math.floor(i / pixels.width) * size - offsetY;
			toggleSwitch.draw(x, y, switchSize, state.brightnesses[i] <= variables.threshold);
		});
	}
}

const toggleSwitches = new ToggleSwitches();

function update() {
	ctx.clearRect(0, 0, viewport.width, viewport.height);
	state.update();
	toggleSwitches.update();
}

clock.on("tick", update);
