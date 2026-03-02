// Episode transform
export { buildEpisodes } from './episodes/buildEpisodes';
export type { Episode, EpisodePoint, EpisodeGame, EpisodeSet, EpisodeNeeded } from './episodes/types';

// ScoringEngine integration
export { feedMatchUp, feedAllMatchUps, getMcpFixture, extractRallyLengths, extractGamePoints } from './engine/feedMatchUp';

// Reactive engine
export { LiveEngine } from './engine/LiveEngine';
export { createPlaybackEngine } from './engine/createPlaybackEngine';
export type { PlaybackControls } from './engine/createPlaybackEngine';

// MatchUp transforms
export { buildSetMap } from './engine/buildSetMap';
export type { SetMap } from './engine/buildSetMap';

// Visualizations
export { coronaChart, coronaChartFromMatchUp } from './visualizations/coronaChart';
export { ptsHorizon, ptsHorizonFromMatchUp } from './visualizations/ptsHorizon';
export { horizonChart } from './visualizations/horizonChart';
export { gameTree } from './visualizations/gameTree';
export { rallyTree } from './visualizations/rallyTree';
export { momentumChart } from './visualizations/momentumChart';
export { ptsMatch } from './visualizations/ptsChart';
export { gameFish } from './visualizations/gameFish';
export { statView } from './visualizations/statView';
export { matchUpDashboard } from './visualizations/matchUpDashboard';
export { simpleChart } from './visualizations/simpleChart';

// Statistics
export { computeMatchStats, computeMatchStatsFromMatchUp } from './statistics';
export type { StatObject } from './statistics';

// Visualization event types
export type { PtsChartEvents, GameFishEvents, GameTreeEvents, MomentumChartEvents } from './visualizations/types/events';

// Parsers & Validators
export {
  validateProTrackerMatch,
  validateProTrackerBuffer,
  parsePTFContent,
  parsePTFPoint,
  mapPTFFormat,
  classifyResult,
  mapServeLocation,
  decodeUTF16LE,
  splitPTFRows,
  validateIONSportMatch,
  parseIONSportMatch,
  parseIONSportPoint,
  mapIONSportFormat,
  isTimedFormat,
  extractPlayersFromSide,
  extractPlayers,
  buildSubstitutionEvents,
} from './parsers';
export type {
  PointResult,
  StrokeType,
  ServeLocation,
  RallyShot,
  ProTrackerValidationResult,
  ProTrackerValidationOptions,
  IONSportValidationResult,
  IONSportValidationOptions,
  PTFMatch,
  ParsedPTFPoint,
  ParsedIONSportMatch,
  PlayerInfo,
  SubstitutionInfo,
} from './parsers';

// Format utilities
export { supportsGameVisualizations } from './utils/supportsGameVisualizations';
export { supportsPointsToVisualization } from './utils/supportsPointsToVisualization';

// Dropzone
export { createFileDropzone } from './visualizations/helpers/FileDropzone';
export type { FileDropzoneOptions } from './visualizations/helpers/FileDropzone';
