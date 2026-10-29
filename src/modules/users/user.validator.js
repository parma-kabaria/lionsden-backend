import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';

export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().trim().optional(),
  role: objectIdSchema,
  branch: objectIdSchema.nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().optional(),
  role: objectIdSchema.optional(),
  branch: objectIdSchema.nullable().optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});
