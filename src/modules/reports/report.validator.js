import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';

export const reportQuerySchema = z.object({
  branchId: objectIdSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
