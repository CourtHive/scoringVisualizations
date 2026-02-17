export interface EpisodePoint {
  winner: number;
  server: number;
  pointNumber: number;
  index: number;
  breakpoint: boolean;
  score: string;
  set: number;
  game: number;
  // Fields from ScoringEngine / MCP data
  rallyLength?: number;
  result?: string;
  notation?: string;
  tiebreak?: boolean;
  points?: [number, number];
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
  points_to_game: number[];
  points_to_set: number[];
  games_to_set: number[];
}

export interface Episode {
  action: 'addPoint';
  point: EpisodePoint;
  game: EpisodeGame;
  set: EpisodeSet;
  needed: EpisodeNeeded;
  next_service: number;
  result: boolean;
  complete: boolean;
}
