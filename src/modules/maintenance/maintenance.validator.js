import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';
import { MAINTENANCE_PRIORITY, MAINTENANCE_STATUS } from '../../config/constants.js';

export const createMaintenanceSchema = z.object({
  bungalow: objectIdSchema,
  facilityAffected: z.string().trim().min(2, 'Affected facility is required'),
  problemDescription: z.string().trim().min(5, 'Detailed description is required'),
  priority: z.nativeEnum(MAINTENANCE_PRIORITY).default(MAINTENANCE_PRIORITY.MEDIUM),
  blocksAvailability: z.boolean().default(false),
});

export const updateMaintenanceStatusSchema = z.object({
  status: z.nativeEnum(MAINTENANCE_STATUS),
  remarks: z.string().trim().optional(),
  assignedTo: objectIdSchema.optional(),
  blocksAvailability: z.boolean().optional(),
});
