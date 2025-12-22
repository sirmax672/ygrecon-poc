import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const source: NodeTypeDefinition = {
  typeId: 'core.Source',
  display: {
    label: 'Source',
    category: 'core',
  },
  paramsSchema: z.object({
    resourceId: z.string(),
    mode: z.enum(['interval', 'instant']).optional(),
    intervalMs: z.number().optional(),
    amount: z.number().optional(),
  }),
  ports: {
    inputs: [],
    outputs: ['output'],
  },
};


