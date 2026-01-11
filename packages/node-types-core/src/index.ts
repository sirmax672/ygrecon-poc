/**
 * @ygrecon/node-types-core - Core node type plugins
 *
 * This package exports core node type definitions:
 * - core.Source
 * - core.Pool
 * - core.Drain
 * - core.Converter
 * - core.Trader
 * - core.Gate
 * - core.RandomSplit
 * - core.Register
 */

import { nodeTypeRegistry } from '@ygrecon/core';
import { source } from './source.js';
import { pool } from './pool.js';
import { drain } from './drain.js';
import { converter } from './converter.js';
import { trader } from './trader.js';
import { gate } from './gate.js';
import { randomSplit } from './random-split.js';
import { register } from './register.js';

// Register all core node types
nodeTypeRegistry.register(source);
nodeTypeRegistry.register(pool);
nodeTypeRegistry.register(drain);
nodeTypeRegistry.register(converter);
nodeTypeRegistry.register(trader);
nodeTypeRegistry.register(gate);
nodeTypeRegistry.register(randomSplit);
nodeTypeRegistry.register(register);

export { source, pool, drain, converter, trader, gate, randomSplit, register };
