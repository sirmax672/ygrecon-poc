import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const randomSplit: NodeTypeDefinition = {
  typeId: 'core.RandomSplit',
  display: {
    label: 'Random Split',
    category: 'core',
  },
  paramsSchema: z.object({
    weights: z.array(z.number()),
    consumeInput: z.boolean().optional(),
    activation: z.enum(['automatic', 'passive', 'interactive']).optional(),
    activationMode: z.enum(['pull-any', 'push-all']).optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output1', 'output2'],
  },
};
