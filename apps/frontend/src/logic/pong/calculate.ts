export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const clamp = (x: number) => {
  return Math.max(0, Math.min(1, x));
};
