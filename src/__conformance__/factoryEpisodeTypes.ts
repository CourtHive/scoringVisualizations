/**
 * Type conformance against the factory — compile-time only, no runtime cost.
 *
 * `ptsChart` renders `episode.needed.pointsToSet`, and that shape is not ours. The ScoringEngine
 * stamps points-to values onto each point (`calculatePointsTo`), and both the factory's
 * `getEpisodes` and our `buildEpisodes` read them off. Two readers of one contract.
 *
 * We used to declare our own copy of it, and the copy drifted: no `pointsToMatch`, and absent
 * fields defaulted to `[0, 0]` — which does not mean "unknown", it means "already won". Nothing
 * detected either problem. This file does: it is covered by `pnpm check-types`, so the next
 * divergence is a build failure rather than a chart quietly missing data.
 *
 * Deliberately NARROW. Our `Episode` is not the factory's and is not meant to become it — ours
 * carries `game.games` (which the factory has no field for) and a visualization `Point` with UI
 * handlers on it. Only `needed` is a shared contract, so only `needed` is pinned here.
 */
import type { EpisodeNeeded, PointsToDecoration } from 'tods-competition-factory';

import type { Episode } from '../visualizations/types';

/** Compile error if `T` is not assignable to `U`. */
type AssertAssignable<T extends U, U> = T;

/** Our `needed` IS the factory's type — not a structural look-alike. */
export type NeededIsTheFactoryType = AssertAssignable<Episode['needed'], EpisodeNeeded>;

/**
 * The fields `calculatePointsTo` produces are the fields an episode can carry.
 *
 * Fails if the factory adds a points-to field that `EpisodeNeeded` does not surface — the gap that
 * would otherwise strand new data one layer below the renderers.
 */
export type EveryPointsToFieldIsSurfaced = AssertAssignable<
  Exclude<keyof PointsToDecoration, keyof EpisodeNeeded>,
  never
>;

/**
 * Fields we do not yet render. `pointsToMatch` now reaches `buildEpisodes`; no chart plots it.
 * Recorded rather than hidden, so the next person sees the gap without re-deriving it.
 */
export type SurfacedButUnrendered = Exclude<keyof EpisodeNeeded, 'pointsToGame' | 'pointsToSet' | 'gamesToSet'>;
