import { describe, it, expect } from 'vitest';
import { nodeTypeRegistry } from '@ygrecon/core';
import { source, pool, drain, gate, randomSplit } from './index.js';

describe('Node Types Core', () => {
  it('should register all core node types', () => {
    expect(nodeTypeRegistry.has('core.Source')).toBe(true);
    expect(nodeTypeRegistry.has('core.Pool')).toBe(true);
    expect(nodeTypeRegistry.has('core.Drain')).toBe(true);
    expect(nodeTypeRegistry.has('core.Gate')).toBe(true);
    expect(nodeTypeRegistry.has('core.RandomSplit')).toBe(true);
  });

  it('should export node type definitions', () => {
    expect(source.typeId).toBe('core.Source');
    expect(pool.typeId).toBe('core.Pool');
    expect(drain.typeId).toBe('core.Drain');
    expect(gate.typeId).toBe('core.Gate');
    expect(randomSplit.typeId).toBe('core.RandomSplit');
  });
});

