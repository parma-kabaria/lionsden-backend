import { z } from 'zod';

export const createRoleSchema = z.object({
  code: z.string().trim().min(2).max(50).toUpperCase(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().optional(),
  permissions: z.array(z.string().trim()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().optional(),
  permissions: z.array(z.string().trim()).optional(),
});
