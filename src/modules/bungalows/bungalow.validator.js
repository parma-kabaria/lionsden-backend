import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';
import { BUNGALOW_CATEGORIES, BUNGALOW_MAINTENANCE_STATUS } from '../../config/constants.js';

export const createBungalowSchema = z.object({
  number: z.string().trim().min(1, 'Bungalow number is required').max(20).toUpperCase(),
  branch: objectIdSchema,
  category: z.nativeEnum(BUNGALOW_CATEGORIES),
  standardRent: z.number().int().min(0, 'Rent in paise cannot be negative'),
  capacity: z
    .object({
      adults: z.number().int().min(1).default(2),
      children: z.number().int().min(0).default(1),
      maxGuests: z.number().int().min(1).default(4),
    })
    .default({}),
  facilities: z.array(z.string().trim()).default([]),
  description: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  maintenanceStatus: z
    .nativeEnum(BUNGALOW_MAINTENANCE_STATUS)
    .default(BUNGALOW_MAINTENANCE_STATUS.NONE),
  photos: z.array(z.string().trim()).default([]),
});

export const updateBungalowSchema = createBungalowSchema.partial();
