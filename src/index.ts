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
export { matchDashboard } from './visualizations/matchDashboard';

// Statistics
export { computeMatchStats, computeMatchStatsFromMatchUp } from './statistics';
export type { StatObject } from './statistics';
