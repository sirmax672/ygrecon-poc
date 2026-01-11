import type { ConnectionTypeDefinition } from './types.js';

/**
 * Global connection type registry.
 * Connection type packages register their definitions here.
 */
class ConnectionTypeRegistry {
  private types = new Map<string, ConnectionTypeDefinition>();

  /**
   * Register a connection type definition.
   */
  register(definition: ConnectionTypeDefinition): void {
    if (this.types.has(definition.typeId)) {
      throw new Error(`Connection type ${definition.typeId} is already registered`);
    }
    this.types.set(definition.typeId, definition);
  }

  /**
   * Get a connection type definition by ID.
   */
  get(typeId: string): ConnectionTypeDefinition | undefined {
    return this.types.get(typeId);
  }

  /**
   * Check if a connection type is registered.
   */
  has(typeId: string): boolean {
    return this.types.has(typeId);
  }

  /**
   * Get all registered connection types.
   */
  getAll(): ConnectionTypeDefinition[] {
    return Array.from(this.types.values());
  }
}

export const connectionTypeRegistry = new ConnectionTypeRegistry();
