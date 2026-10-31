import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { Booking } from './booking.model.js';
import { ReservationLock } from './reservation-lock.model.js';
import { Counter } from './counter.model.js';
import { Bungalow } from '../bungalows/bungalow.model.js';
import { Branch } from '../branches/branch.model.js';
import { findOrCreateCustomer, incrementCustomerBookings } from '../customers/customer.service.js';
import { calculateApplicablePrice } from '../pricing/pricing.service.js';
import { recordPayment } from '../payments/payment.service.js';
import { calculateNights } from '../../common/utils/date.util.js';
import { hasReplicaSet } from '../../config/db.js';
import {
  BOOKING_STATUS,
  FOOD_OPTIONS,
  PAYMENT_TYPES,
  BUNGALOW_MAINTENANCE_STATUS,
} from '../../config/constants.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../common/errors/app.error.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

/**
 * Generates an array of "YYYY-MM-DD" date keys for each night in [checkIn, checkOut)
 */
const getDateKeysForInterval = (checkIn, checkOut) => {
  const keys = [];
  const curr = new Date(checkIn);
  const end = new Date(checkOut);

  while (curr < end) {
    const yyyy = curr.getUTCFullYear();
    const mm = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(curr.getUTCDate()).padStart(2, '0');
    keys.push(`${yyyy}-${mm}-${dd}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  return keys;
};

/**
 * Generates an auto-incrementing sequential booking ID in format "LD-YYYY-1", "LD-YYYY-2", "LD-YYYY-3", ...
 */
const generateBookingId = async (session = null) => {
  const year = new Date().getFullYear();
  const counterId = `bookingId_${year}`;

  let counter = await Counter.findById(counterId).session(session || null);
  if (!counter) {
    const regex = new RegExp(`^LD-${year}-(\\d+)$`, 'i');
    const existingBookings = await Booking.find(
      { bookingId: { $regex: regex } },
      'bookingId'
    ).session(session || null);

    let maxNum = 0;
    for (const b of existingBookings) {
      const match = b.bookingId.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const options = { new: true, upsert: true, setDefaultsOnInsert: true };
    if (session) options.session = session;

    counter = await Counter.findByIdAndUpdate(
      counterId,
      { $set: { seq: maxNum } },
      options
    );
  }

  const options = { new: true };
  if (session) options.session = session;

  const updated = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    options
  );

  return `LD-${year}-${updated.seq}`;
};

/**
 * Creates a new booking with ACID concurrency control and price locking
 */
export const createBooking = async (data, req) => {
  // Check idempotency if key was provided
  if (data.idempotencyKey) {
    const existing = await Booking.findOne({ idempotencyKey: data.idempotencyKey })
      .populate('branch', 'name code')
      .populate('bungalow', 'number category')
      .populate('createdBy', 'name email');
    if (existing) {
      return existing;
    }
  }

  const bungalow = await Bungalow.findById(data.bungalow);
  if (!bungalow) {
    throw new NotFoundError(`Bungalow with id ${data.bungalow} not found`);
  }

  if (!bungalow.isActive) {
    throw new BadRequestError('This bungalow is marked as inactive');
  }

  if (bungalow.maintenanceStatus === BUNGALOW_MAINTENANCE_STATUS.UNDER_MAINTENANCE) {
    throw new ConflictError('This bungalow is currently under maintenance and cannot be booked');
  }

  const branch = await Branch.findById(data.branch);
  if (!branch) {
    throw new NotFoundError(`Branch with id ${data.branch} not found`);
  }

  // if (bungalow.branch.toString() !== branch._id.toString()) {
  //   throw new BadRequestError('The selected bungalow does not belong to the selected branch');
  // }

  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  const nights = calculateNights(checkIn, checkOut);
  const dateKeys = getDateKeysForInterval(checkIn, checkOut);
  const bookingId = await generateBookingId();

  // Price calculations
  const pricingResult = await calculateApplicablePrice(bungalow, checkIn, checkOut);
  const standardRentPerNight = pricingResult.standardRent;
  const specialRentPerNight = pricingResult.specialRent;
  const finalRentPerNight = specialRentPerNight;

  const totalRent = finalRentPerNight * nights;
  const isWithFood = data.foodOption === FOOD_OPTIONS.WITH_FOOD;
  const foodChargesPerNight = isWithFood ? data.foodChargesPerNight || 0 : 0;
  const totalFoodCharges = foodChargesPerNight * nights;
  const extraCharges = data.extraCharges || 0;
  const totalAmount = totalRent + totalFoodCharges + extraCharges;

  const advancePayment = data.advancePayment || 0;
  if (advancePayment > totalAmount) {
    throw new BadRequestError('Advance payment cannot exceed total booking amount');
  }

  const totalPaid = advancePayment;
  const outstandingBalance = totalAmount - totalPaid;

  // Execute with concurrency reservation locks
  const executeBookingCreation = async session => {
    // 1. Check for overlapping active bookings inside session
    const overlapQuery = {
      bungalow: bungalow._id,
      status: { $ne: BOOKING_STATUS.CANCELLED },
      checkIn: { $lt: checkOut },
      checkOut: { $gt: checkIn },
    };

    const overlap = await Booking.findOne(overlapQuery).session(session || null);
    if (overlap) {
      throw new ConflictError(
        `Bungalow ${bungalow.number} is already booked from ${overlap.checkIn.toISOString()} to ${overlap.checkOut.toISOString()}`
      );
    }

    // 2. Acquire reservation locks for each night
    try {
      const lockDocs = dateKeys.map(dateKey => ({
        bungalow: bungalow._id,
        dateKey,
        bookingId,
      }));
      await ReservationLock.insertMany(lockDocs, { session: session || null });
    } catch (err) {
      if (err.code === 11000) {
        throw new ConflictError(
          'Simultaneous booking conflict detected: another reservation just booked one or more of these dates'
        );
      }
      throw err;
    }

    // 3. Find or create customer
    const customer = await findOrCreateCustomer(
      {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || '',
        branch: branch._id,
      },
      req,
      session
    );

    await incrementCustomerBookings(customer._id, session);

    // 4. Create booking document
    const bookingDoc = {
      bookingId,
      customer: {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || '',
        customerRef: customer._id,
      },
      branch: branch._id,
      bungalow: bungalow._id,
      checkIn,
      checkOut,
      nights,
      guests: data.guests,
      foodOption: data.foodOption,
      foodChargesPerNight,
      totalFoodCharges,
      standardRentPerNight,
      specialRentPerNight,
      finalRentPerNight,
      appliedPricingRule: pricingResult.appliedRule || { id: null, name: '', festivalName: '' },
      extraCharges,
      totalAmount,
      advancePayment,
      totalPaid,
      outstandingBalance,
      status: BOOKING_STATUS.CONFIRMED,
      createdBy: req.user._id,
      specialRequests: data.specialRequests || '',
    };

    if (data.idempotencyKey) {
      bookingDoc.idempotencyKey = data.idempotencyKey;
    }

    const [booking] = await Booking.create([bookingDoc], { session: session || null });

    // 5. If advance payment was made, record payment ledger entry
    if (advancePayment > 0) {
      await recordPayment(
        {
          bookingId: booking._id,
          amount: advancePayment,
          type: PAYMENT_TYPES.ADVANCE,
          paymentMode: data.paymentMode,
          transactionReference: data.transactionReference || '',
          notes: 'Advance deposit at time of booking creation',
          idempotencyKey: data.idempotencyKey ? `${data.idempotencyKey}-advance` : undefined,
        },
        req,
        session
      );
    }

    return booking;
  };

  let createdBooking;
  if (hasReplicaSet()) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        createdBooking = await executeBookingCreation(session);
      });
    } finally {
      await session.endSession();
    }
  } else {
    // Atomic fallback with ReservationLock collection guarantees race condition prevention
    createdBooking = await executeBookingCreation(null);
  }

  const populated = await Booking.findById(createdBooking._id)
    .populate('branch', 'name code city')
    .populate('bungalow', 'number category standardRent facilities')
    .populate('createdBy', 'name email');

  await logAudit({
    req,
    action: 'BOOKING_CREATED',
    entity: 'BOOKING',
    entityId: createdBooking._id,
    branch: createdBooking.branch,
    changes: {
      bookingId: createdBooking.bookingId,
      bungalow: bungalow.number,
      totalAmount,
      advancePayment,
      checkIn,
      checkOut,
    },
  });

  return populated;
};

export const getAllBookings = async ({
  branchId,
  bungalowId,
  status,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 20,
}) => {
  const filter = {};

  if (branchId) filter.branch = branchId;
  if (bungalowId) filter.bungalow = bungalowId;
  if (status) filter.status = status;

  if (startDate || endDate) {
    filter.checkIn = {};
    if (startDate) filter.checkIn.$gte = new Date(startDate);
    if (endDate) filter.checkIn.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { bookingId: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('branch', 'name code')
      .populate('bungalow', 'number category standardRent')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBookingById = async id => {
  const booking = await Booking.findById(id)
    .populate('branch', 'name code address city')
    .populate('bungalow', 'number category standardRent facilities capacity')
    .populate('createdBy', 'name email');

  if (!booking) {
    throw new NotFoundError(`Booking with id ${id} not found`);
  }
  return booking;
};

export const cancelBooking = async (id, reason, req) => {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new NotFoundError(`Booking with id ${id} not found`);
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new BadRequestError('This booking has already been cancelled');
  }

  if (booking.status === BOOKING_STATUS.CHECKED_OUT) {
    throw new BadRequestError('Completed bookings cannot be cancelled');
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date();
  await booking.save();

  // Release reservation locks so dates become instantly available
  await ReservationLock.deleteMany({ bookingId: booking.bookingId });

  await logAudit({
    req,
    action: 'BOOKING_CANCELLED',
    entity: 'BOOKING',
    entityId: booking._id,
    branch: booking.branch,
    changes: { bookingId: booking.bookingId, reason },
  });

  return booking;
};

export const updateBookingStatus = async (id, status, req) => {
  const booking = await Booking.findById(id);
  if (!booking) {
    throw new NotFoundError(`Booking with id ${id} not found`);
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new BadRequestError('Cannot update status of a cancelled booking');
  }

  const previousStatus = booking.status;
  booking.status = status;
  await booking.save();

  await logAudit({
    req,
    action: 'BOOKING_STATUS_UPDATED',
    entity: 'BOOKING',
    entityId: booking._id,
    branch: booking.branch,
    changes: { from: previousStatus, to: status },
  });

  return booking;
};
