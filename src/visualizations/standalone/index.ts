/**
 * Standalone Visualizations Index
 * 
 * Central export point for all standalone D3 visualizations.
 * These are self-contained versions with sample data for development and testing.
 */

// Visualizations (All migrated to D3 v4!)
export { simpleChart } from './simpleChart';
export { gameFish } from './gameFish';
export { gameTree } from './gameTree';
export { momentumChart } from './momentumChart';
export { ptsMatch } from './ptsChart';
export { coronaChart } from './coronaChart.ts';
export { rallyTree } from './RallyTree.ts';

// Utilities
export { groupGames } from './groupGames';
export { rallyCount } from './legacyRally';

// Data generators
export {
  sampleGamePoints,
  deuceGamePoints,
  tiebreakGamePoints,
  sampleGameGroup,
  deuceGameGroup,
  tiebreakGameGroup,
  pointsToEpisodes,
} from './data/sampleGame';

export {
  generateSampleMatch,
  generateSimpleChartData,
} from './data/sampleMatch';

// Types
export type {
  Point,
  Episode,
  GameGroup,
  SetData,
  Player,
  MatchMetadata,
} from './types';
