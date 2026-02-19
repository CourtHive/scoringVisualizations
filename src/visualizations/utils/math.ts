/**
 * Math utilities
 *
 * Extracted from gameTree.ts — generic array min/max helpers.
 */

/** Apply Math.max to an array */
export function applyMax(arr: number[]): number {
  return Math.max.apply(null, arr);
}

/** Apply Math.min to an array */
export function applyMin(arr: number[]): number {
  return Math.min.apply(null, arr);
}
