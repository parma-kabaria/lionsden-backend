import { z } from 'zod';

export const createBranchSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  code: z
    .string()
    .trim()
    .min(2, 'Code must be at least 2 characters')
    .max(10, 'Code must be at most 10 characters')
    .toUpperCase(),
  address: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().default('Gujarat'),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export const updateBranchSchema = createBranchSchema.partial();
