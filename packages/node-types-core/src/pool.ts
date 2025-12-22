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
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
};


