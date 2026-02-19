export interface EpisodePoint {
  winner: number;
  server: number;
  pointNumber: number;
  index: number;
  isBreakpoint: boolean;
  score: string;
  set: number;
  game: number;
  // Fields from ScoringEngine / MCP data
  rallyLength?: number;
  result?: string;
  notation?: string;
  tiebreak?: boolean;
  serve?: 1 | 2; // 1 = first serve, 2 = second serve (from ScoringEngine)
  points?: [number, number];
  setCumulativePoints?: [number, number];
}

export interface EpisodeGame {
  complete: boolean;
  winner: number | undefined;
  games: number[];
  index: number;
}

export interface EpisodeSet {
  complete: boolean;
  winner: number | undefined;
  sets: number[][];
  index: number;
}

export interface EpisodeNeeded {
  pointsToGame: number[];
  pointsToSet: number[];
  gamesToSet: number[];
}

export interface Episode {
  action: 'addPoint';
  point: EpisodePoint;
  game: EpisodeGame;
  set: EpisodeSet;
  needed: EpisodeNeeded;
  nextService: number;
  result: boolean;
  complete: boolean;
}
