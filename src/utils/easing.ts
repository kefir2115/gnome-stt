type EasingFn = (t: number) => number;
type AnimateCallback = (value: number) => void;

const FRAME_MS = 16;

export const eases: Record<string, EasingFn> = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => 1 - (1 - t) * (1 - t),
    easeInOutQuad: (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export function animate(
  callback: AnimateCallback,
  duration: number,
  easing: EasingFn = eases.linear,
  from: number = 0,
  to: number = 1,
): () => void {
  const start = Date.now();
  let cancelled = false;

  const tick = () => {
    if (cancelled) return;

    const elapsed = Date.now() - start;
    const t = Math.min(elapsed / duration, 1);
    callback(from + (to - from) * easing(t));

    if (t < 1) {
      setTimeout(tick, FRAME_MS);
    }
  };

  tick();

  return () => {
    cancelled = true;
  };
}

export function ease(callback: AnimateCallback, duration: number, from?: number, to?: number) {
  return animate(callback, duration, eases.linear, from, to);
}

export function easeIn(callback: AnimateCallback, duration: number, from?: number, to?: number) {
  return animate(callback, duration, eases.easeInQuad, from, to);
}

export function easeOut(callback: AnimateCallback, duration: number, from?: number, to?: number) {
  return animate(callback, duration, eases.easeOutQuad, from, to);
}

export function easeInOut(callback: AnimateCallback, duration: number, from?: number, to?: number) {
  return animate(callback, duration, eases.easeInOutQuad, from, to);
}
