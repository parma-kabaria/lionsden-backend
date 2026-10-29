import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { loginLimiter } from '../../common/middleware/rate-limiter.middleware.js';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.validator.js';

const router = Router();

router.post('/login', loginLimiter, validate({ body: loginSchema }), authController.login);

router.post('/refresh-token', validate({ body: refreshTokenSchema }), authController.refreshToken);

router.post(
  '/logout',
  authenticate,
  validate({ body: refreshTokenSchema.partial() }),
  authController.logout
);

router.post(
  '/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  authController.changePassword
);

router.get('/me', authenticate, authController.getMe);

export default router;
