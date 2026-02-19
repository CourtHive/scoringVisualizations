/**
 * Array utilities
 *
 * Extracted from coronaChart.ts — helpers for slicing and indexing arrays.
 */

/** Sum all values in a numeric array */
export function sum(arr: number[]): number {
  return arr.reduce((total, val) => total + Number.parseFloat(val.toString()), 0);
}

/**
 * Create ranges from a list of indices.
 * Each range spans [indices[i], indices[i+1]], with the last range
 * extending to the end of someArray.
 */
export function createRanges(indices: number[], someArray: number[]): number[][] {
  const ranges: number[][] = [];
  for (let r = 0; r < indices.length - 1; r++) {
    ranges.push([indices[r], indices[r + 1]]);
  }
  const lastIndex = indices.at(-1) ?? 0;
  ranges.push([lastIndex, someArray.length]);
  return ranges;
}

/** Slice data into sub-arrays based on index ranges */
export function sliceData(ranges: number[][], data: number[]): number[][] {
  const slices: number[][] = [];
  for (const range of ranges) {
    const slice = data.slice(range[0], range[1] + 1);
    slices.push(slice);
  }
  return slices;
}

/** Find all indices of zero values in a data array */
export function indicesOf(_something: number, data: number[]): number[] {
  let next = 0;
  let position = -1;
  const indices: number[] = [];
  while (next >= 0) {
    next = data.slice(position + 1).indexOf(0);
    position += next + 1;
    if (next >= 0) indices.push(position);
  }
  return indices;
}
