import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';

export const createCustomerSchema = z.object({
  name: z.string().trim().min(2, 'Customer name is required'),
  phone: z.string().trim().min(10, 'Valid phone number is required'),
  email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
  idProofType: z
    .enum(['AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'OTHER', 'NONE'])
    .default('NONE'),
  idProofNumber: z.string().trim().optional(),
  address: z.string().trim().optional(),
  branch: objectIdSchema.optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();
