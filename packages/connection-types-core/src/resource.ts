import { z } from 'zod';
import type { ConnectionTypeDefinition } from './types.js';

export const resourceConnection: ConnectionTypeDefinition = {
  typeId: 'resource',
  display: {
    label: 'Resource Connection',
    category: 'connections',
  },
  paramsSchema: z.object({
    batch: z.number().optional(),
    weight: z.number().optional(),
    label: z.string().optional(),
    condition: z.string().optional(),
    interval: z.number().optional(),
    transfer: z.enum(['interval-based', 'pull-any', 'push-any']).optional(),
    outResourceId: z.string().optional(),
    colorCoding: z.boolean().optional(),
    colorCodingColor: z.string().optional(),
    shuffleSource: z.boolean().optional(),
    limitsMin: z.number().optional(),
    limitsMax: z.number().optional(),
  }),
};
