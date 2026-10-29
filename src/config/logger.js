import pino from 'pino';
import { config } from './index.js';

const isVercel = Boolean(process.env.VERCEL);
const transport =
  config.isDevelopment && !isVercel
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

export const logger = pino({
  level: config.logLevel || 'info',
  transport,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'refreshToken',
      'token',
      'secret',
    ],
    remove: true,
  },
  base: {
    service: 'lionsden-backend',
    env: config.env,
  },
});
