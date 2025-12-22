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
});

