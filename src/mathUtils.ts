export function lerp(x: number, y: number, p: number) {
  return x + (y - x) * p;
}

export function normalize(x: number, y: number, p: number) {
  return (p - x) / (y - x);
}

export function lerpColor(colorX: number, colorY: number, p: number) {
  const ar = (colorX & 0xff0000) >> 16,
    ag = (colorX & 0x00ff00) >> 8,
    ab = colorX & 0x0000ff,
    br = (colorY & 0xff0000) >> 16,
    bg = (colorY & 0x00ff00) >> 8,
    bb = colorY & 0x0000ff,
    rr = ar + p * (br - ar),
    rg = ag + p * (bg - ag),
    rb = ab + p * (bb - ab);

  return `#${((rr << 16) + (rg << 8) + (rb | 0))
    .toString(16)
    .padStart(6, '0')
    .slice(-6)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(Math.min(value, max), min);
}
