import type { CompiledGraph } from '@ygrecon/core';
import type {
  SimulationSettings,
  SimulationState,
  SimulationListener,
} from './types.js';

/**
 * Simulation engine interface.
 * Implementation will be provided in Iteration B.
 */
export interface SimulationEngine {
  /**
   * Reset the simulation with a new graph and settings.
   */
  reset(graph: CompiledGraph, settings: SimulationSettings): void;

  /**
   * Process the next event (single step).
   */
  step(): void;

  /**
   * Run simulation for N steps.
   */
  runForSteps(n: number): void;

  /**
   * Run simulation for N milliseconds (simulated time).
   */
  runForMs(ms: number): void;

  /**
   * Pause the simulation.
   */
  pause(): void;

  /**
   * Get current simulation state.
   */
  getState(): SimulationState;

  /**
   * Subscribe to state updates.
   */
  subscribe(listener: SimulationListener): () => void;
}

/**
 * Placeholder implementation (will be replaced in Iteration B).
 */
export class PlaceholderEngine implements SimulationEngine {
  reset(_graph: CompiledGraph, _settings: SimulationSettings): void {
    // TODO: Implement in Iteration B
  }

  step(): void {
    // TODO: Implement in Iteration B
  }

  runForSteps(_n: number): void {
    // TODO: Implement in Iteration B
  }

  runForMs(_ms: number): void {
    // TODO: Implement in Iteration B
  }

  pause(): void {
    // TODO: Implement in Iteration B
  }

  getState(): SimulationState {
    return {
      nodeState: new Map(),
      edgeState: new Map(),
      tokens: [],
      currentTime: 0,
      eventCount: 0,
    };
  }

  subscribe(_listener: SimulationListener): () => void {
    return () => {
      // TODO: Implement in Iteration B
    };
  }
}


