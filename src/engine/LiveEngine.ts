/**
 * LiveEngine — Reactive wrapper around ScoringEngine
 *
 * Adds pub/sub to the ScoringEngine so visualizations (and hive-eye-tracker)
 * can subscribe to state changes. Every mutation auto-notifies subscribers
 * with the fresh getState() MatchUp.
 *
 * Pattern:
 *   const live = new LiveEngine(engine);
 *   const unsub = live.subscribe(matchUp => chart.matchUp(matchUp));
 *   live.addPoint({ winner: 0 });  // subscriber fires
 *   unsub();                       // stop listening
 */

import { scoreGovernor } from 'tods-competition-factory';

// Use `any` for the engine type to avoid re-exporting factory internals
// in the declaration file. The ScoringEngine API is well-known.
const { ScoringEngine } = scoreGovernor;

type Listener = (matchUp: any) => void;

export class LiveEngine {
  private engine: any;
  private listeners: Set<Listener> = new Set();

  constructor(engine?: any) {
    this.engine = engine ?? new ScoringEngine({ matchUpFormat: 'SET3-S:6/TB7' });
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(cb: Listener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(): void {
    const state = this.engine.getState();
    for (const cb of this.listeners) {
      cb(state);
    }
  }

  // ── Mutations (each notifies subscribers) ──────────────────────

  addPoint(opts: { winner: 0 | 1; server?: 0 | 1; result?: string; rallyLength?: number }): void {
    this.engine.addPoint(opts);
    this.notify();
  }

  undo(count?: number): boolean {
    const result = this.engine.undo(count);
    if (result) this.notify();
    return result;
  }

  redo(count?: number): boolean {
    const result = this.engine.redo(count);
    if (result) this.notify();
    return result;
  }

  editPoint(pointIndex: number, newData: Record<string, any>, options?: { recalculate?: boolean }): void {
    this.engine.editPoint(pointIndex, newData, options);
    this.notify();
  }

  reset(): void {
    this.engine.reset();
    this.notify();
  }

  // ── Queries (no notification) ──────────────────────────────────

  getState(): any {
    return this.engine.getState();
  }

  canUndo(): boolean {
    return this.engine.canUndo();
  }

  canRedo(): boolean {
    return this.engine.canRedo();
  }

  isComplete(): boolean {
    return this.engine.isComplete();
  }

  getPointCount(): number {
    return this.engine.getPointCount();
  }

  getScoreboard(): string {
    return this.engine.getScoreboard();
  }
}
