// Episode transform
export { buildEpisodes } from './episodes/buildEpisodes';
export type { Episode, EpisodePoint, EpisodeGame, EpisodeSet, EpisodeNeeded } from './episodes/types';

// ScoringEngine integration
export { feedMatchUp, feedAllMatchUps, getMcpFixture, extractRallyLengths, extractGamePoints } from './engine/feedMatchUp';
