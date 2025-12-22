import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const gate: NodeTypeDefinition = {
  typeId: 'core.Gate',
  display: {
    label: 'Gate',
    category: 'core',
  },
  paramsSchema: z.object({
    condition: z.string().optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
};


