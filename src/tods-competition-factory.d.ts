/**
 * Ambient type declarations for tods-competition-factory.
 *
 * The package's "exports" map lacks a "types" condition, so bundler-mode
 * moduleResolution can't resolve the .d.ts automatically. This file declares
 * the subset of the API that scoringVisualizations uses.
 *
 * Requires: pnpm link to the local factory build at CourtHive/factory
 * which exports calculateMatchStatistics, toStatObjects, and StatObject.
 */
declare module 'tods-competition-factory' {
  // -- scoreGovernor (used by engine/*.ts) --
  export const scoreGovernor: {
    ScoringEngine: new (...args: any[]) => any;
    [key: string]: any;
  };

  // -- Statistics (used by statistics/matchStatistics.ts) --
  export interface StatObject {
    name: string;
    numerator: [number, number];
    denominator?: [number, number];
    pct?: [number, number];
    [key: string]: any;
  }

  export function calculateMatchStatistics(matchUp: any, points: any[]): any;
  export function toStatObjects(stats: any): StatObject[];

  // -- tools (used by generateId utility) --
  export const tools: {
    generateTimeCode: () => string;
    [key: string]: any;
  };
}
