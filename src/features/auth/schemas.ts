import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().check(z.email({ error: 'Invalid email address' })),
  password: z.string().check(z.minLength(1, { error: 'Password is required' })),
});

export const registerSchema = z.object({
  name: z.string().check(z.minLength(1, { error: 'Name is required' })),
  email: z.string().check(z.email({ error: 'Invalid email address' })),
  password: z
    .string()
    .check(z.minLength(10, { error: 'Password must be at least 10 characters' }))
    .check(z.regex(/[A-Z]/, { error: 'Must contain at least one uppercase letter' }))
    .check(z.regex(/[a-z]/, { error: 'Must contain at least one lowercase letter' }))
    .check(z.regex(/[0-9]/, { error: 'Must contain at least one number' }))
    .check(z.regex(/[^A-Za-z0-9]/, { error: 'Must contain at least one special character' })),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
