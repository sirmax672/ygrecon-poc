import { z } from 'zod';
import type { NodeTypeDefinition, ValidationIssue } from '@ygrecon/core';
import type { GraphDSL } from '@ygrecon/dsl';

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
    activationMode: z.enum(['automatic', 'interactive', 'onStart', 'onReceive']).optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
  validateConnection: (): ValidationIssue[] => {
    // Converter can connect to/from any node type (no restrictions)
    return [];
  },
};

