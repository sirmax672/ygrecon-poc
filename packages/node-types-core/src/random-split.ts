import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const randomSplit: NodeTypeDefinition = {
  typeId: 'core.RandomSplit',
  display: {
    label: 'Random Split',
    category: 'core',
  },
  paramsSchema: z.object({
    consumeInput: z.boolean().optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output1', 'output2'],
  },
};


