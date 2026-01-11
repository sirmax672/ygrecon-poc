import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

export const converter: NodeTypeDefinition = {
  typeId: 'core.Converter',
  display: {
    label: 'Converter',
    category: 'core',
  },
  paramsSchema: z.object({
    inputResourceId: z.string(),
    outputResourceId: z.string(),
    conversionRate: z.number(),
    conversion: z.enum(['single', 'batch']).optional(),
    activation: z.enum(['automatic', 'passive', 'interactive']).optional(),
    activationMode: z.enum(['pull-any']).optional(),
    resourceColor: z.string().optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
  validateConnection: (): Array<{ code: string; message: string; nodeId?: string; connectionId?: string }> => {
    // Converter can connect to/from any node type (no restrictions)
    return [];
  },
};
