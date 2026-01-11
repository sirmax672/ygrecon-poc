import { z } from 'zod';
import type { ConnectionTypeDefinition } from './types.js';

export const triggerConnection: ConnectionTypeDefinition = {
  typeId: 'trigger',
  display: {
    label: 'Trigger Connection',
    category: 'connections',
  },
  paramsSchema: z.object({
    triggerCondition: z.string(),
    effect: z.string().optional(),
  }),
};
