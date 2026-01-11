import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const gate: NodeTypeDefinition = {
  typeId: 'core.Gate',
  display: {
    label: 'Gate',
    category: 'core',
  },
  paramsSchema: z.object({
    distribution: z.enum(['dice', 'deterministic']),
    distributionMode: z.enum(['probabilistic', 'deterministic']).optional(),
    weights: z.array(z.number()).optional(),
    condition: z.string().optional(),
    activation: z.enum(['automatic', 'passive', 'interactive']).optional(),
    activationMode: z.enum(['pull-any', 'push-all']).optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
};
