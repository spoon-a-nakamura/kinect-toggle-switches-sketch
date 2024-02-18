import GUI from 'lil-gui';
import { Clock } from './Clock';
import { Pixels, aspectRatio } from './Pixels';
import { clamp, lerp, lerpColor, normalize } from './mathUtils';
import { Viewport } from './Viewport';

const clock = new Clock();
const viewport = new Viewport();

const gui = new GUI();
const variables = {
  threshold: 0.5,
  width: 100,
  color: 0x2dcb45,
  invert: false,
};

/* eslint-disable @typescript-eslint/no-non-null-assertion */
const canvasEl = document.querySelector('canvas')!;
const ctx = canvasEl.getContext('2d')!;
/* eslint-enable @typescript-eslint/no-non-null-assertion */

function resizeCanvas() {
  canvasEl.setAttribute('width', `${viewport.width}px`);
  canvasEl.setAttribute('height', `${viewport.height}px`);
  Object.assign(canvasEl.style, {
    width: `${viewport.width / viewport.pixelRatio}px`,
    height: `${viewport.height / viewport.pixelRatio}px`,
  });
}
resizeCanvas();

viewport.addEventListener('resize', resizeCanvas);

const pixels = new Pixels(variables.width);

gui.add(variables, 'threshold', 0, 1);
gui.add(variables, 'width', 4, 150, 1).onChange((value: number) => {
  pixels.changeWidth(value);
});
gui.addColor(variables, 'color');
gui.add(variables, 'invert');

class State {
  private video = document.createElement('video');
  public brightnesses: Float32Array;
  constructor(private width: number, private height: number) {
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
    console.log(this.video);
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
        0.2126 * src.data[i] +
          0.7152 * src.data[i + 1] +
          0.0722 * src.data[i + 2],
      );
    }
    ctx.clearRect(0, 0, this.width, this.height);
    console.log(state);
  }
}

const state = new State(pixels.width, pixels.height);

class ToggleSwitch {
  private active = 0;
  public draw(x: number, y: number, width: number, selected: boolean) {
    this.active = clamp(
      lerp(this.active, selected ? 1 : 0, clock.delta * 0.01),
      0,
      1,
    );
    const height = width / 1.6;
    const radius = height / 2;
    ctx.fillStyle = lerpColor(0xe6e6e6, variables.color, this.active);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.arc(
      width - radius,
      height / 2,
      radius,
      -Math.PI / 2,
      Math.PI / 2,
      false,
    );
    ctx.lineTo(radius, height);
    ctx.arc(radius, height / 2, radius, Math.PI / 2, -Math.PI / 2, false);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#00000056';
    ctx.shadowOffsetY = radius / 25;
    ctx.shadowBlur = radius / 10;
    ctx.beginPath();

    ctx.arc(
      lerp(radius, width - radius, this.active),
      radius,
      radius * 0.9,
      0,
      Math.PI * 2,
    );
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
    const offsetX =
      (size * pixels.width - viewport.width) / 2 -
      ((1 - switchScale) / 2) * size;
    const offsetY = (size * pixels.height - viewport.height) / 2;

    this.toggleSwitches?.forEach((toggleSwitch, i) => {
      const x = (i % pixels.width) * size - offsetX;
      const y = Math.floor(i / pixels.width) * size - offsetY;
      toggleSwitch.draw(
        x,
        y,
        switchSize,
        state.brightnesses[i] <= variables.threshold,
      );
    });
  }
}

const toggleSwitches = new ToggleSwitches();

function update() {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  state.update();
  toggleSwitches.update();
}

clock.on('tick', update);
