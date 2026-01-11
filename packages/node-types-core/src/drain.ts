import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const drain: NodeTypeDefinition = {
  typeId: 'core.Drain',
  display: {
    label: 'Drain',
    category: 'core',
  },
  paramsSchema: z.object({
    resourceId: z.string().optional(),
    consumptionRate: z.number().optional(),
    activation: z.enum(['automatic', 'passive', 'interactive']).optional(),
    activationMode: z.enum(['pull-any']).optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: [],
  },
};
