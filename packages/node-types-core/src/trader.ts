import { z } from 'zod';
import type { NodeTypeDefinition } from '@ygrecon/core';

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
    trade: z.enum(['single', 'batch']).optional(),
    activation: z.enum(['automatic', 'passive', 'interactive']).optional(),
  }),
  ports: {
    inputs: ['input'],
    outputs: ['output'],
  },
  validateConnection: (): Array<{ code: string; message: string; nodeId?: string; connectionId?: string }> => {
    // Trader can connect to/from any node type (no restrictions)
    return [];
  },
};
