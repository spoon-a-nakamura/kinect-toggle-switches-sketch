export const aspectRatio = 16 / 9;

export class Pixels {
  private _height: number;
  constructor(private _width: number) {
    this._height = this.getHeight();
  }

  private getHeight() {
    return Math.ceil(this._width / aspectRatio);
  }

  public get width() {
    return this._width;
  }

  public get height() {
    return this._height;
  }

  public changeWidth(width: number) {
    this._width = width;
    this._height = this.getHeight();
  }
}
