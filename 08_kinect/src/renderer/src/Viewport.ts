export class Viewport extends EventTarget {
  public pixelRatio = Math.min(window.devicePixelRatio, 2);
  public width = window.innerWidth * this.pixelRatio;
  public height = window.innerHeight * this.pixelRatio;

  constructor() {
    super();

    window.addEventListener('resize', () => {
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);
      this.width = window.innerWidth * this.pixelRatio;
      this.height = window.innerHeight * this.pixelRatio;

      this.dispatchEvent(new CustomEvent('resize'));
    });
  }

  public on(type: 'resize', callback: () => void) {
    this.addEventListener(type, callback);
  }
}
