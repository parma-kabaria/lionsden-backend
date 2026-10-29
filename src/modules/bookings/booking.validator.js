import { z } from 'zod';
import { objectIdSchema } from '../../common/validators/id.validator.js';
import {
  BOOKING_STATUS,
  FOOD_OPTIONS,
  PAYMENT_MODES,
  BUNGALOW_CATEGORIES,
} from '../../config/constants.js';

export const createBookingSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, 'Customer name is required'),
      phone: z.string().trim().min(10, 'Valid mobile number is required'),
      email: z.string().trim().email('Invalid email').optional().or(z.literal('')),
    }),
    branch: objectIdSchema,
    bungalow: objectIdSchema,
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    guests: z
      .object({
        adults: z.number().int().min(1, 'At least 1 adult required').default(2),
        children: z.number().int().min(0).default(0),
      })
      .default({ adults: 2, children: 0 }),
    foodOption: z.nativeEnum(FOOD_OPTIONS).default(FOOD_OPTIONS.WITHOUT_FOOD),
    foodChargesPerNight: z.number().int().min(0).default(0), // in paise
    extraCharges: z.number().int().min(0).default(0), // in paise
    advancePayment: z.number().int().min(0).default(0), // in paise
    paymentMode: z.nativeEnum(PAYMENT_MODES).optional(),
    transactionReference: z.string().trim().optional(),
    specialRequests: z.string().trim().optional(),
    idempotencyKey: z.string().trim().optional(),
  })
  .refine(data => data.checkOut > data.checkIn, {
    message: 'Check-out date/time must be strictly after check-in date/time',
    path: ['checkOut'],
  })
  .refine(
    data => {
      if (data.advancePayment > 0 && !data.paymentMode) {
        return false;
      }
      return true;
    },
    {
      message: 'Payment mode is required when advance payment is recorded',
      path: ['paymentMode'],
    }
  );

export const searchAvailabilitySchema = z
  .object({
    branch: objectIdSchema,
    checkIn: z.coerce.date(),
    checkOut: z.coerce.date(),
    category: z.nativeEnum(BUNGALOW_CATEGORIES).optional(),
    facilities: z.union([z.string().transform(val => [val]), z.array(z.string())]).optional(),
    bungalowNumber: z.string().trim().optional(),
    guestsCount: z.coerce.number().int().min(1).optional(),
  })
  .refine(data => data.checkOut > data.checkIn, {
    message: 'Check-out date/time must be strictly after check-in date/time',
    path: ['checkOut'],
  });

export const cancelBookingSchema = z.object({
  reason: z.string().trim().min(3, 'Cancellation reason is required'),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.CHECKED_OUT]),
});
