import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const register: NodeTypeDefinition = {
  typeId: 'core.Register',
  display: {
    label: 'Register',
    category: 'core',
  },
  paramsSchema: z.object({
    formula: z.string().optional(),
    interactive: z.boolean().optional(),
    initial: z.number().optional(),
    step: z.number().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    showInChart: z.boolean().optional(),
    forceUpdateEachStep: z.boolean().optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
};
