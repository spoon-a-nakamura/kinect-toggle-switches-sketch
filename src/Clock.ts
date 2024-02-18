export class Clock extends EventTarget {
  private start = Date.now(); // 初期化時刻
  private current = this.start; // 現在時刻
  public elapsed = 0; // 経過時間
  public delta = 16; // 差分: 前回更新時からの経過時間
  private event = new CustomEvent('tick');

  constructor() {
    super();
    this.tick();
  }

  private tick() {
    const currentTime = Date.now();
    this.delta = currentTime - this.current;
    this.current = currentTime;
    this.elapsed = this.current - this.start;
    this.dispatchEvent(this.event);

    requestAnimationFrame(() => {
      this.tick();
    });
  }

  public on(type: 'tick', callback: () => void) {
    this.addEventListener(type, callback);
  }
}
