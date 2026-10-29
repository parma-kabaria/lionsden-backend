import { Router } from 'express';
import * as bookingController from './booking.controller.js';
import { authenticate } from '../../common/middleware/auth.middleware.js';
import { requirePermissions, enforceBranchScope } from '../../common/middleware/rbac.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';
import {
  createBookingSchema,
  cancelBookingSchema,
  updateBookingStatusSchema,
  searchAvailabilitySchema,
} from './booking.validator.js';
import { idParamSchema } from '../../common/validators/id.validator.js';
import { paginationQuerySchema } from '../../common/validators/pagination.validator.js';
import { PERMISSIONS } from '../../config/constants.js';

const router = Router();

router.use(authenticate);

// Availability search
router.get(
  '/availability',
  requirePermissions([PERMISSIONS.AVAILABILITY_SEARCH]),
  enforceBranchScope({ source: 'query', field: 'branch' }),
  validate({ query: searchAvailabilitySchema }),
  bookingController.searchAvailability
);

// Bookings collection
router.get(
  '/',
  requirePermissions([PERMISSIONS.BOOKINGS_READ]),
  enforceBranchScope({ source: 'query', field: 'branchId' }),
  validate({ query: paginationQuerySchema }),
  bookingController.getAllBookings
);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  requirePermissions([PERMISSIONS.BOOKINGS_READ]),
  bookingController.getBookingById
);

router.post(
  '/',
  requirePermissions([PERMISSIONS.BOOKINGS_CREATE]),
  enforceBranchScope({ source: 'body', field: 'branch' }),
  validate({ body: createBookingSchema }),
  bookingController.createBooking
);

router.post(
  '/:id/cancel',
  validate({ params: idParamSchema, body: cancelBookingSchema }),
  requirePermissions([PERMISSIONS.BOOKINGS_CANCEL]),
  bookingController.cancelBooking
);

router.patch(
  '/:id/status',
  validate({ params: idParamSchema, body: updateBookingStatusSchema }),
  requirePermissions([PERMISSIONS.BOOKINGS_UPDATE]),
  bookingController.updateBookingStatus
);

export default router;
