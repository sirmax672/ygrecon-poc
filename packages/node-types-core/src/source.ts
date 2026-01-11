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
    productionRate: z.number().optional(),
    activation: z.enum(['automatic', 'passive', 'interactive']).optional(),
    activationMode: z.enum(['push-any', 'push-all']).optional(),
    resourceColor: z.string().optional(),
  }),
  ports: {
    inputs: [],
    outputs: ['output'],
  },
};
