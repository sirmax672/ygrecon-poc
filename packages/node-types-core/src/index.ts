/**
 * @ygrecon/node-types-core - Core node type plugins
 *
 * This package exports core node type definitions:
 * - core.Source
 * - core.Pool
 * - core.Drain
 * - core.Gate
 * - core.RandomSplit
 *
 * Implementation will be added in Iteration B.
 */

import { nodeTypeRegistry } from '@ygrecon/core';
import { source } from './source.js';
import { pool } from './pool.js';
import { drain } from './drain.js';
import { gate } from './gate.js';
import { randomSplit } from './random-split.js';

// Register all core node types
nodeTypeRegistry.register(source);
nodeTypeRegistry.register(pool);
nodeTypeRegistry.register(drain);
nodeTypeRegistry.register(gate);
nodeTypeRegistry.register(randomSplit);

export { source, pool, drain, gate, randomSplit };


