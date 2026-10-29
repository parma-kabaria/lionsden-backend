import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';

import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { swaggerDocument } from './docs/swagger.js';
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { standardLimiter } from './common/middleware/rate-limiter.middleware.js';
import { errorHandler, notFoundHandler } from './common/middleware/error.middleware.js';

// Module Routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import roleRoutes from './modules/roles/role.routes.js';
import branchRoutes from './modules/branches/branch.routes.js';
import bungalowRoutes from './modules/bungalows/bungalow.routes.js';
import pricingRoutes from './modules/pricing/pricing.routes.js';
import bookingRoutes from './modules/bookings/booking.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import paymentRoutes from './modules/payments/payment.routes.js';
import negotiationRoutes from './modules/negotiations/negotiation.routes.js';
import maintenanceRoutes from './modules/maintenance/maintenance.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import auditLogRoutes from './modules/audit-logs/audit-log.routes.js';

// Availability direct controller for /api/v1/availability
import * as bookingController from './modules/bookings/booking.controller.js';
import { authenticate } from './common/middleware/auth.middleware.js';
import { requirePermissions, enforceBranchScope } from './common/middleware/rbac.middleware.js';
import { validate } from './common/middleware/validate.middleware.js';
import { searchAvailabilitySchema } from './modules/bookings/booking.validator.js';
import { PERMISSIONS } from './config/constants.js';

const app = express();

// Security and Request Parsing
app.use(helmet());

const configuredOrigins = Array.isArray(config.corsOrigin)
  ? config.corsOrigin
  : [config.corsOrigin];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Allow any localhost or 127.0.0.1 on any port (Vite on 3039, 5173, etc.)
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview and production deployments
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Allow explicitly configured origins in CORS_ORIGIN
      if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom Request ID and Structured HTTP Logging
app.use(requestIdMiddleware);
app.use(
  pinoHttp({
    logger,
    genReqId: req => req.id,
    autoLogging: {
      ignore: req => req.url === '/health' || req.url === '/ready',
    },
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

// Global Rate Limiter
app.use(standardLimiter);

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(`${config.apiPrefix}/api-docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root Welcome & Health Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'LionsDen Resort Management API',
    status: 'ACTIVE',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health',
    ready: '/ready',
    apiPrefix: config.apiPrefix,
  });
});

// Health & Readiness Endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'lionsden-backend',
  });
});

app.get('/ready', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    return res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(200).json({
    status: 'READY',
    database: 'CONNECTED',
    timestamp: new Date().toISOString(),
  });
});

// Direct Availability route alias: /api/v1/availability
const availabilityRouter = express.Router();
availabilityRouter.use(authenticate);
availabilityRouter.get(
  '/',
  requirePermissions([PERMISSIONS.AVAILABILITY_SEARCH]),
  enforceBranchScope({ source: 'query', field: 'branch' }),
  validate({ query: searchAvailabilitySchema }),
  bookingController.searchAvailability
);

// Mount API v1 Routes
const v1Router = express.Router();
v1Router.use('/auth', authRoutes);
v1Router.use('/users', userRoutes);
v1Router.use('/roles', roleRoutes);
v1Router.use('/branches', branchRoutes);
v1Router.use('/bungalows', bungalowRoutes);
v1Router.use('/availability', availabilityRouter);
v1Router.use('/pricing', pricingRoutes);
v1Router.use('/bookings', bookingRoutes);
v1Router.use('/customers', customerRoutes);
v1Router.use('/payments', paymentRoutes);
v1Router.use('/negotiations', negotiationRoutes);
v1Router.use('/maintenance', maintenanceRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/reports', reportRoutes);
v1Router.use('/audit-logs', auditLogRoutes);

app.use(config.apiPrefix, v1Router);

// Centralized 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
