import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const pool: NodeTypeDefinition = {
  typeId: 'core.Pool',
  display: {
    label: 'Pool',
    category: 'core',
  },
  paramsSchema: z.object({
    resourceId: z.string(),
    initial: z.number().optional(),
    capacity: z.number().optional(),
    activation: z.enum(['automatic', 'passive', 'interactive']).optional(),
    activationMode: z.enum(['push-all', 'pull-any', 'push-any']).optional(),
    overflow: z.enum(['block', 'allow']).optional(),
    showInChart: z.boolean().optional(),
    resourceColor: z.string().optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
};
