import { z } from 'zod';
import type { GraphDSL } from './types.js';

/**
 * Zod schema for DSL v0.2
 */
export const graphDSLSchemaV0_2 = z.object({
  dslVersion: z.literal('0.2'),
  meta: z.object({
    name: z.string(),
    seed: z.number().int(),
    timeUnit: z.string().optional(),
    notes: z.string().optional(),
  }),
  resources: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    })
  ),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      params: z.record(z.unknown()),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }).optional(),
    })
  ),
  edges: z.array(
    z.object({
      id: z.string(),
      from: z.string(),
      to: z.string(),
      params: z.record(z.unknown()),
    })
  ),
});

/**
 * Type guard: check if unknown value matches DSL v0.2
 */
export function isGraphDSLV0_2(value: unknown): value is GraphDSL {
  return graphDSLSchemaV0_2.safeParse(value).success;
}


