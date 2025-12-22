import { describe, it, expect } from 'vitest';
import { PlaceholderEngine } from './engine.js';
import type { CompiledGraph } from '@ygrecon/core';

describe('Simulation Engine (Placeholder)', () => {
  it('should create an engine instance', () => {
    const engine = new PlaceholderEngine();
    expect(engine).toBeDefined();
  });

  it('should return empty state', () => {
    const engine = new PlaceholderEngine();
    const state = engine.getState();
    expect(state.nodeState.size).toBe(0);
    expect(state.tokens.length).toBe(0);
    expect(state.currentTime).toBe(0);
  });

  it('should accept reset without errors', () => {
    const engine = new PlaceholderEngine();
    const graph: CompiledGraph = {
      nodes: new Map(),
      edges: new Map(),
      adjacency: new Map(),
      reverseAdjacency: new Map(),
    };
    engine.reset(graph, { seed: 12345 });
    // Should not throw
  });
});


