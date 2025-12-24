import { describe, it, expect } from 'vitest';
import { parseDSL, validateDSL } from './validate.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

describe('DSL Validation', () => {
  it('should validate a valid DSL v0.2 graph', () => {
    const validGraph = {
      dslVersion: '0.2' as const,
      meta: {
        name: 'Test Graph',
        seed: 12345,
      },
      resources: [
        { id: 'chicken', label: 'Chicken' },
        { id: 'egg', label: 'Egg' },
      ],
      nodes: [
        { id: 'src1', type: 'core.Source', params: {} },
      ],
      edges: [
        { id: 'e1', from: 'src1', to: 'pool1', params: {} },
      ],
    };

    const result = parseDSL(validGraph);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.meta.name).toBe('Test Graph');
      expect(result.value.dslVersion).toBe('0.2');
    }
  });

  it('should reject invalid dslVersion', () => {
    const invalid = {
      dslVersion: '0.1',
      meta: { name: 'Test', seed: 123 },
      resources: [],
      nodes: [],
      edges: [],
    };

    const result = parseDSL(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('should reject missing required fields', () => {
    const invalid = {
      dslVersion: '0.2',
      // missing meta
      resources: [],
      nodes: [],
      edges: [],
    };

    const result = parseDSL(invalid);
    expect(result.ok).toBe(false);
  });

  it('should validate the chicken-eggs example', () => {
    const examplePath = join(__dirname, '../../examples/chicken-eggs.v0.2.json');
    const jsonContent = readFileSync(examplePath, 'utf-8');
    const result = validateDSL(jsonContent);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.meta.name).toBe('Daily chicken -> 50/50 egg drop');
      expect(result.value.nodes.length).toBeGreaterThan(0);
      expect(result.value.edges.length).toBeGreaterThan(0);
    }
  });

  it('should handle invalid JSON gracefully', () => {
    const result = validateDSL('{ invalid json }');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('JSON_PARSE_ERROR');
    }
  });

  it('should validate and preserve edge points (polyline geometry)', () => {
    const graphWithPoints = {
      dslVersion: '0.2' as const,
      meta: {
        name: 'Graph with polyline edges',
        seed: 12345,
      },
      resources: [],
      nodes: [
        { id: 'src1', type: 'core.Source', params: {} },
        { id: 'pool1', type: 'core.Pool', params: {} },
      ],
      edges: [
        {
          id: 'e1',
          from: 'src1',
          to: 'pool1',
          params: {
            points: [
              { x: 100, y: 150 },
              { x: 200, y: 180 },
            ],
          },
        },
      ],
    };

    const result = parseDSL(graphWithPoints);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const edge = result.value.edges[0];
      expect(edge.params.points).toBeDefined();
      const points = edge.params.points as Array<{ x: number; y: number }>;
      expect(points).toHaveLength(2);
      expect(points[0]).toEqual({ x: 100, y: 150 });
      expect(points[1]).toEqual({ x: 200, y: 180 });
    }
  });

  it('should round-trip edge points through JSON serialization', () => {
    const graphWithPoints = {
      dslVersion: '0.2' as const,
      meta: {
        name: 'Round-trip test',
        seed: 12345,
      },
      resources: [],
      nodes: [
        { id: 'src1', type: 'core.Source', params: {} },
        { id: 'pool1', type: 'core.Pool', params: {} },
      ],
      edges: [
        {
          id: 'e1',
          from: 'src1',
          to: 'pool1',
          params: {
            points: [
              { x: 50, y: 100 },
              { x: 150, y: 120 },
              { x: 250, y: 140 },
            ],
          },
        },
      ],
    };

    // Serialize to JSON and back
    const jsonString = JSON.stringify(graphWithPoints);
    const result = validateDSL(jsonString);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const edge = result.value.edges[0];
      const points = edge.params.points as Array<{ x: number; y: number }>;
      expect(points).toHaveLength(3);
      expect(points[0]).toEqual({ x: 50, y: 100 });
      expect(points[1]).toEqual({ x: 150, y: 120 });
      expect(points[2]).toEqual({ x: 250, y: 140 });
    }
  });

  it('should validate and preserve node positions', () => {
    const graphWithPositions = {
      dslVersion: '0.2' as const,
      meta: {
        name: 'Graph with node positions',
        seed: 12345,
      },
      resources: [],
      nodes: [
        { id: 'src1', type: 'core.Source', params: {}, position: { x: 100, y: 200 } },
        { id: 'pool1', type: 'core.Pool', params: {}, position: { x: 300, y: 200 } },
      ],
      edges: [
        { id: 'e1', from: 'src1', to: 'pool1', params: {} },
      ],
    };

    const result = parseDSL(graphWithPositions);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nodes[0].position).toEqual({ x: 100, y: 200 });
      expect(result.value.nodes[1].position).toEqual({ x: 300, y: 200 });
      // Nodes without position should still be valid
      expect(result.value.nodes[0].position).toBeDefined();
    }
  });

  it('should validate nodes without positions (optional field)', () => {
    const graphWithoutPositions = {
      dslVersion: '0.2' as const,
      meta: {
        name: 'Graph without positions',
        seed: 12345,
      },
      resources: [],
      nodes: [
        { id: 'src1', type: 'core.Source', params: {} },
      ],
      edges: [],
    };

    const result = parseDSL(graphWithoutPositions);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.nodes[0].position).toBeUndefined();
    }
  });
});

