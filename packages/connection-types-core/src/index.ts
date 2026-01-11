/**
 * @ygrecon/connection-types-core - Core connection type plugins
 *
 * This package exports core connection type definitions:
 * - resource (Resource Connection)
 * - state (State Connection)
 * - trigger (Trigger Connection)
 */

import { connectionTypeRegistry } from './registry.js';
import { resourceConnection } from './resource.js';
import { stateConnection } from './state.js';
import { triggerConnection } from './trigger.js';

// Register all core connection types
connectionTypeRegistry.register(resourceConnection);
connectionTypeRegistry.register(stateConnection);
connectionTypeRegistry.register(triggerConnection);

export { resourceConnection, stateConnection, triggerConnection };
export { connectionTypeRegistry } from './registry.js';
export type { ConnectionTypeDefinition } from './types.js';
