import { z } from 'zod';
import type { NodeTypeDefinition, ValidationIssue } from '@ygrecon/core';
import type { GraphDSL } from '@ygrecon/dsl';

export const trader: NodeTypeDefinition = {
  typeId: 'core.Trader',
  display: {
    label: 'Trader',
    category: 'core',
  },
  paramsSchema: z.object({
    offerResourceId: z.string(),
    offerAmount: z.number(),
    requestResourceId: z.string(),
    requestAmount: z.number(),
    activationMode: z.enum(['automatic', 'interactive', 'onStart', 'onReceive']).optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
  validateConnection: (): ValidationIssue[] => {
    // Trader can connect to/from any node type (no restrictions)
    return [];
  },
};

