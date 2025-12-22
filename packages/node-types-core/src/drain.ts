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
  }),
  ports: {
    inputs: ['input'],
    outputs: [],
  },
};


