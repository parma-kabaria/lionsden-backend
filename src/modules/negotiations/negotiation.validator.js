import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';

export const submitNegotiationSchema = z.object({
  booking: objectIdSchema,
  requestedRent: z.number().int().min(0, 'Requested rent in paise cannot be negative'),
  reason: z.string().trim().min(5, 'A clear reason of at least 5 characters is required'),
});

export const decisionNegotiationSchema = z.object({
  comment: z.string().trim().optional(),
});
