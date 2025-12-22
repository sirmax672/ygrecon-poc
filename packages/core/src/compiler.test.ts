import { describe, it, expect } from 'vitest';
import { compileGraph } from './compiler.js';
import type { GraphDSL } from '@ygrecon/dsl';

describe('Graph Compiler', () => {
  const validDSL: GraphDSL = {
    dslVersion: '0.2',
    meta: { name: 'Test', seed: 123 },
    resources: [],
    nodes: [
      { id: 'n1', type: 'core.Source', params: {} },
      { id: 'n2', type: 'core.Pool', params: {} },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', params: {} },
    ],
  };

  it('should compile a valid graph', () => {
    const { graph, issues } = compileGraph(validDSL);
    expect(graph.nodes.size).toBe(2);
    expect(graph.edges.size).toBe(1);
    expect(graph.adjacency.get('n1')).toEqual(['e1']);
    expect(graph.reverseAdjacency.get('n2')).toEqual(['e1']);
    expect(issues.length).toBeGreaterThanOrEqual(0); // May have UNKNOWN_NODE_TYPE warnings
  });

  it('should detect duplicate node IDs', () => {
    const dsl: GraphDSL = {
      ...validDSL,
      nodes: [
        { id: 'n1', type: 'core.Source', params: {} },
        { id: 'n1', type: 'core.Pool', params: {} },
      ],
    };
    const { issues } = compileGraph(dsl);
    expect(issues.some((i) => i.code === 'DUPLICATE_NODE_ID')).toBe(true);
  });

  it('should detect missing node references', () => {
    const dsl: GraphDSL = {
      ...validDSL,
      edges: [
        { id: 'e1', from: 'n1', to: 'nonexistent', params: {} },
      ],
    };
    const { issues } = compileGraph(dsl);
    expect(issues.some((i) => i.code === 'MISSING_NODE_REF')).toBe(true);
  });
});


