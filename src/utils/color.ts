export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function hex(str: string): Color {
  str = str.replace("#", "");

  const len = str.length < 6 ? 1 : 2;
  const rlen = str.length < 6 ? 2 : 1;
  const hasAlpha = str.length % 3 !== 0;

  const red = str.substring(0, 1 * len).repeat(rlen);
  const green = str.substring(1 * len, 2 * len).repeat(rlen);
  const blue = str.substring(2 * len, 3 * len).repeat(rlen);
  const alpha = (hasAlpha ? str.substring(3 * len, 4 * len) : "f").repeat(rlen);

  const [r, g, b, a] = [red, green, blue, alpha].map((n) => parseInt(n, 16));

  return { r, g, b, a };
}

export function toHex(color: Color) {
    const r = color.r.toString(16).padStart(2, "0");
    const g = color.g.toString(16).padStart(2, "0");
    const b = color.b.toString(16).padStart(2, "0");
    const a = color.a.toString(16).padStart(2, "0");

    return `#${r}${g}${b}${a === "ff" ? "" : a}`;
}

export function toRgba(color: Color) {
    return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`
}

/**
 * @param amount (0 — 1) value
 */
export function interpolate(from: Color, to: Color, amount: number): Color {
  const [r, g, b, a] = [
    from.r + (to.r - from.r) * amount,
    from.g + (to.g - from.g) * amount,
    from.b + (to.b - from.b) * amount,
    from.a + (to.a - from.a) * amount,
  ].map(Math.floor);

  return { r, g, b, a };
}