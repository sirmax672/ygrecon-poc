import { z } from 'zod';
import type { ConnectionTypeDefinition } from './types.js';

export const stateConnection: ConnectionTypeDefinition = {
  typeId: 'state',
  display: {
    label: 'State Connection',
    category: 'connections',
  },
  paramsSchema: z.object({
    condition: z.string().optional(),
    effect: z.string().optional(),
    targetProperty: z.string().optional(),
    triggerOn: z.string().optional(),
    colorCoding: z.boolean().optional(),
    colorCodingColor: z.string().optional(),
  }),
};
