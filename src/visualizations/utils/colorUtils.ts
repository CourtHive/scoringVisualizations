/**
 * Color manipulation utilities
 *
 * Extracted from gameTree.ts — used for gradient calculations
 * in game tree node coloring.
 */

/**
 * Shade a hex color by a percentage.
 * Positive percent lightens, negative darkens.
 */
export function shadeColor2(color: string, percent: number): string {
  const f = Number.parseInt(color.slice(1), 16);
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  const R = f >> 16;
  const G = (f >> 8) & 0x00ff;
  const B = f & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Shade an RGB color string by a percentage.
 */
export function shadeRGBColor(color: string, percent: number): string {
  const f = color.split(',');
  const t = percent < 0 ? 0 : 255;
  const p = percent < 0 ? percent * -1 : percent;
  const R = Number.parseInt(f[0].slice(4));
  const G = Number.parseInt(f[1]);
  const B = Number.parseInt(f[2]);
  return (
    'rgb(' +
    (Math.round((t - R) * p) + R) +
    ',' +
    (Math.round((t - G) * p) + G) +
    ',' +
    (Math.round((t - B) * p) + B) +
    ')'
  );
}

/**
 * Blend two hex colors by a percentage.
 */
export function blendColors(c0: string, c1: string, p: number): string {
  const f = Number.parseInt(c0.slice(1), 16);
  const t = Number.parseInt(c1.slice(1), 16);
  const R1 = f >> 16;
  const G1 = (f >> 8) & 0x00ff;
  const B1 = f & 0x0000ff;
  const R2 = t >> 16;
  const G2 = (t >> 8) & 0x00ff;
  const B2 = t & 0x0000ff;
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((R2 - R1) * p) + R1) * 0x10000 +
      (Math.round((G2 - G1) * p) + G1) * 0x100 +
      (Math.round((B2 - B1) * p) + B1)
    )
      .toString(16)
      .slice(1)
  );
}

/**
 * Blend two RGB color strings by a percentage.
 */
export function blendRGBColors(c0: string, c1: string, p: number): string {
  const f = c0.split(',');
  const t = c1.split(',');
  const R = Number.parseInt(f[0].slice(4));
  const G = Number.parseInt(f[1]);
  const B = Number.parseInt(f[2]);
  return (
    'rgb(' +
    (Math.round((Number.parseInt(t[0].slice(4)) - R) * p) + R) +
    ',' +
    (Math.round((Number.parseInt(t[1]) - G) * p) + G) +
    ',' +
    (Math.round((Number.parseInt(t[2]) - B) * p) + B) +
    ')'
  );
}

/**
 * Auto-detect color format (hex vs RGB) and shade accordingly.
 */
export function colorShade(color: string, percent: number): string {
  if (color.length > 7) return shadeRGBColor(color, percent);
  return shadeColor2(color, percent);
}

/**
 * Auto-detect color format and blend accordingly.
 */
export function colorBlend(color1: string, color2: string, percent: number): string {
  if (color1.length > 7) return blendRGBColors(color1, color2, percent);
  return blendColors(color1, color2, percent);
}

/**
 * Convert a named CSS color to hex using a temporary DOM element.
 */
export function getHexColor(colorStr: string): string | false {
  const a = document.createElement('div');
  a.style.color = colorStr;
  const colors = window
    .getComputedStyle(document.body.appendChild(a))
    .color.match(/\d+/g)
    ?.map((c) => Number.parseInt(c, 10));
  document.body.removeChild(a);
  if (!colors || colors.length < 3) return false;
  return '#' + ((1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2]).toString(16).substr(1);
}
