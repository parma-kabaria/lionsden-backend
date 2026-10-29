import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('*'),
  TIMEZONE: z.string().default('Asia/Kolkata'),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/lionsden_resort'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16).default('lionsden_super_secret_access_jwt_key_2026'),
  JWT_REFRESH_SECRET: z.string().min(16).default('lionsden_super_secret_refresh_jwt_key_2026'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // Rate Limiter
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().default(5),

  // Initial Super Admin Seed
  SUPER_ADMIN_NAME: z.string().default('LionsDen Super Admin'),
  SUPER_ADMIN_EMAIL: z.string().email().default('superadmin@lionsdenresorts.com'),
  SUPER_ADMIN_PASSWORD: z.string().min(8).default('ChangeMeSuperSecret123!'),
  SUPER_ADMIN_PHONE: z.string().default('+919876543210'),

  // Logging
  LOG_LEVEL: z.string().default('info'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

export const config = {
  env: parsedEnv.data.NODE_ENV,
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  isDevelopment: parsedEnv.data.NODE_ENV === 'development',
  port: parsedEnv.data.PORT,
  apiPrefix: parsedEnv.data.API_PREFIX,
  corsOrigin: parsedEnv.data.CORS_ORIGIN.includes(',')
    ? parsedEnv.data.CORS_ORIGIN.split(',').map(item => item.trim())
    : parsedEnv.data.CORS_ORIGIN,
  timezone: parsedEnv.data.TIMEZONE,
  db: {
    uri: parsedEnv.data.MONGODB_URI,
  },
  jwt: {
    accessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
    refreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
    accessExpiry: parsedEnv.data.JWT_ACCESS_EXPIRY,
    refreshExpiry: parsedEnv.data.JWT_REFRESH_EXPIRY,
  },
  bcrypt: {
    saltRounds: parsedEnv.data.BCRYPT_SALT_ROUNDS,
  },
  rateLimit: {
    windowMs: parsedEnv.data.RATE_LIMIT_WINDOW_MS,
    max: parsedEnv.data.RATE_LIMIT_MAX_REQUESTS,
    loginWindowMs: parsedEnv.data.LOGIN_RATE_LIMIT_WINDOW_MS,
    loginMax: parsedEnv.data.LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
  },
  superAdmin: {
    name: parsedEnv.data.SUPER_ADMIN_NAME,
    email: parsedEnv.data.SUPER_ADMIN_EMAIL,
    password: parsedEnv.data.SUPER_ADMIN_PASSWORD,
    phone: parsedEnv.data.SUPER_ADMIN_PHONE,
  },
  logLevel: parsedEnv.data.LOG_LEVEL,
};
