import type { CompiledGraph } from '@ygrecon/core';

/**
 * Seeded RNG interface for deterministic randomness.
 */
export interface RNG {
  /**
   * Generate a random number in [0, 1)
   */
  random(): number;

  /**
   * Generate a random integer in [min, max] (inclusive)
   */
  randomInt(min: number, max: number): number;
}

/**
 * Simulation settings
 */
export interface SimulationSettings {
  seed: number;
  timeUnit?: string;
}

/**
 * Runtime state for a node
 */
export interface NodeState {
  counters: Record<string, number>;
  [key: string]: unknown; // Allow plugins to extend
}

/**
 * Runtime state for an edge
 */
export interface EdgeState {
  queuedTransfers: unknown[]; // Will be typed in Iteration B
  [key: string]: unknown;
}

/**
 * Active token in transit (for visualization)
 */
export interface Token {
  id: string;
  resourceId: string;
  edgeId: string;
  progress: number; // 0-1 along edge
  startTime: number;
}

/**
 * Simulation state snapshot
 */
export interface SimulationState {
  nodeState: Map<string, NodeState>;
  edgeState: Map<string, EdgeState>;
  tokens: Token[];
  currentTime: number;
  eventCount: number;
}

/**
 * Event listener for simulation updates
 */
export type SimulationListener = (state: SimulationState) => void;


