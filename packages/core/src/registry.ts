import type { NodeTypeDefinition } from './types.js';

/**
 * Global node type registry.
 * Node type packages register their definitions here.
 */
class NodeTypeRegistry {
  private types = new Map<string, NodeTypeDefinition>();

  /**
   * Register a node type definition.
   */
  register(definition: NodeTypeDefinition): void {
    if (this.types.has(definition.typeId)) {
      throw new Error(`Node type ${definition.typeId} is already registered`);
    }
    this.types.set(definition.typeId, definition);
  }

  /**
   * Get a node type definition by ID.
   */
  get(typeId: string): NodeTypeDefinition | undefined {
    return this.types.get(typeId);
  }

  /**
   * Check if a node type is registered.
   */
  has(typeId: string): boolean {
    return this.types.has(typeId);
  }

  /**
   * Get all registered node types.
   */
  getAll(): NodeTypeDefinition[] {
    return Array.from(this.types.values());
  }
}

export const nodeTypeRegistry = new NodeTypeRegistry();


