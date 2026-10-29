import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';
import { PAYMENT_MODES, PAYMENT_TYPES } from '../../config/constants.js';

export const recordPaymentSchema = z.object({
  bookingId: objectIdSchema,
  amount: z.number().int().min(1, 'Payment amount in paise must be strictly positive'),
  type: z.nativeEnum(PAYMENT_TYPES).default(PAYMENT_TYPES.BALANCE),
  paymentMode: z.nativeEnum(PAYMENT_MODES),
  transactionReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  idempotencyKey: z.string().trim().optional(),
});

export const reversePaymentSchema = z.object({
  reason: z.string().trim().min(5, 'Reversal reason of at least 5 characters is required'),
});
