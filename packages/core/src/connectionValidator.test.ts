import { describe, it, expect } from 'vitest';
import { validateConnections } from './connectionValidator.js';
import type { GraphDSL } from '@ygrecon/dsl';

describe('connectionValidator', () => {
  const createBaseDSL = (): GraphDSL => ({
    dslVersion: '0.2',
    meta: {
      name: 'Test Graph',
      seed: 123,
    },
    resources: [],
    nodes: [
      { id: 'node1', type: 'core.Source', params: {} },
      { id: 'node2', type: 'core.Pool', params: {} },
      { id: 'node3', type: 'core.Drain', params: {} },
    ],
    edges: [],
  });

  it('should pass validation for valid connections', () => {
    const dsl: GraphDSL = {
      ...createBaseDSL(),
      edges: [
        {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          params: { sourceHandle: 'output', targetHandle: 'input' },
        },
        {
          id: 'edge2',
          from: 'node2',
          to: 'node3',
          params: { sourceHandle: 'output', targetHandle: 'input' },
        },
      ],
    };

    const issues = validateConnections(dsl);
    expect(issues).toHaveLength(0);
  });

  it('should detect duplicate connections in same direction', () => {
    const dsl: GraphDSL = {
      ...createBaseDSL(),
      edges: [
        {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          params: { sourceHandle: 'output', targetHandle: 'input' },
        },
        {
          id: 'edge2',
          from: 'node1',
          to: 'node2',
          params: { sourceHandle: 'output', targetHandle: 'input' },
        },
      ],
    };

    const issues = validateConnections(dsl);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('DUPLICATE_CONNECTION');
    expect(issues[0].edgeId).toBe('edge2');
  });

  it('should detect reverse connection on same handles', () => {
    const dsl: GraphDSL = {
      ...createBaseDSL(),
      edges: [
        {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          params: { sourceHandle: 'output', targetHandle: 'input' },
        },
        {
          id: 'edge2',
          from: 'node2',
          to: 'node1',
          params: { sourceHandle: 'input', targetHandle: 'output' },
        },
      ],
    };

    const issues = validateConnections(dsl);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('REVERSE_CONNECTION_ON_SAME_HANDLES');
    expect(issues[0].edgeId).toBe('edge2');
  });

  it('should allow reverse connection on different handles', () => {
    const dsl: GraphDSL = {
      ...createBaseDSL(),
      edges: [
        {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          params: { sourceHandle: 'output', targetHandle: 'input' },
        },
        {
          id: 'edge2',
          from: 'node2',
          to: 'node1',
          params: { sourceHandle: 'output', targetHandle: 'input' },
        },
      ],
    };

    const issues = validateConnections(dsl);
    expect(issues).toHaveLength(0);
  });

  it('should skip validation for edges with missing nodes', () => {
    const dsl: GraphDSL = {
      ...createBaseDSL(),
      edges: [
        {
          id: 'edge1',
          from: 'missing',
          to: 'node2',
          params: {},
        },
      ],
    };

    const issues = validateConnections(dsl);
    expect(issues).toHaveLength(0);
  });

  it('should handle edges without handles', () => {
    const dsl: GraphDSL = {
      ...createBaseDSL(),
      edges: [
        {
          id: 'edge1',
          from: 'node1',
          to: 'node2',
          params: {},
        },
        {
          id: 'edge2',
          from: 'node1',
          to: 'node2',
          params: {},
        },
      ],
    };

    const issues = validateConnections(dsl);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('DUPLICATE_CONNECTION');
  });
});

