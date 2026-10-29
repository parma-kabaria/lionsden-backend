import { Negotiation } from './negotiation.model.js';
import { Booking } from '../bookings/booking.model.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../common/errors/app.error.js';
import { NEGOTIATION_STATUS, BOOKING_STATUS } from '../../config/constants.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

export const submitRequest = async ({ booking: bookingId, requestedRent, reason }, req) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new NotFoundError(`Booking with id ${bookingId} not found`);
  }

  if (
    booking.status === BOOKING_STATUS.CANCELLED ||
    booking.status === BOOKING_STATUS.CHECKED_OUT
  ) {
    throw new BadRequestError(
      `Cannot negotiate pricing for a ${booking.status.toLowerCase()} booking`
    );
  }

  // Check for existing pending request
  const existingPending = await Negotiation.findOne({
    booking: bookingId,
    status: NEGOTIATION_STATUS.PENDING,
  });

  if (existingPending) {
    throw new ConflictError('A pending negotiation request already exists for this booking');
  }

  const negotiation = await Negotiation.create({
    booking: booking._id,
    branch: booking.branch,
    originalRent: booking.finalRentPerNight,
    requestedRent,
    reason,
    requestedBy: req.user._id,
    status: NEGOTIATION_STATUS.PENDING,
  });

  const populated = await Negotiation.findById(negotiation._id)
    .populate('booking', 'bookingId checkIn checkOut totalAmount customer')
    .populate('requestedBy', 'name email');

  await logAudit({
    req,
    action: 'NEGOTIATION_SUBMITTED',
    entity: 'NEGOTIATION',
    entityId: negotiation._id,
    branch: booking.branch,
    changes: {
      bookingId: booking.bookingId,
      originalRent: booking.finalRentPerNight,
      requestedRent,
      reason,
    },
  });

  return populated;
};

export const approveRequest = async (id, comment = '', req) => {
  const negotiation = await Negotiation.findById(id);
  if (!negotiation) {
    throw new NotFoundError(`Negotiation request with id ${id} not found`);
  }

  if (negotiation.status !== NEGOTIATION_STATUS.PENDING) {
    throw new BadRequestError(
      `Cannot approve a request that is already ${negotiation.status.toLowerCase()}`
    );
  }

  const booking = await Booking.findById(negotiation.booking);
  if (!booking) {
    throw new NotFoundError('Associated booking no longer exists');
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new BadRequestError('Cannot apply negotiated price to a cancelled booking');
  }

  // Update negotiation status
  negotiation.status = NEGOTIATION_STATUS.APPROVED;
  negotiation.decidedBy = req.user._id;
  negotiation.decisionComment = comment;
  negotiation.decidedAt = new Date();
  await negotiation.save();

  // Recalculate booking rent and totals
  const previousRent = booking.finalRentPerNight;
  booking.finalRentPerNight = negotiation.requestedRent;

  const totalRent = booking.finalRentPerNight * booking.nights;
  booking.totalAmount = totalRent + booking.totalFoodCharges + booking.extraCharges;
  booking.outstandingBalance = booking.totalAmount - booking.totalPaid;
  await booking.save();

  await logAudit({
    req,
    action: 'NEGOTIATION_APPROVED',
    entity: 'NEGOTIATION',
    entityId: negotiation._id,
    branch: negotiation.branch,
    changes: {
      bookingId: booking.bookingId,
      previousRent,
      approvedRent: negotiation.requestedRent,
      comment,
    },
  });

  return {
    negotiation,
    booking,
  };
};

export const rejectRequest = async (id, comment = '', req) => {
  const negotiation = await Negotiation.findById(id);
  if (!negotiation) {
    throw new NotFoundError(`Negotiation request with id ${id} not found`);
  }

  if (negotiation.status !== NEGOTIATION_STATUS.PENDING) {
    throw new BadRequestError(
      `Cannot reject a request that is already ${negotiation.status.toLowerCase()}`
    );
  }

  negotiation.status = NEGOTIATION_STATUS.REJECTED;
  negotiation.decidedBy = req.user._id;
  negotiation.decisionComment = comment;
  negotiation.decidedAt = new Date();
  await negotiation.save();

  await logAudit({
    req,
    action: 'NEGOTIATION_REJECTED',
    entity: 'NEGOTIATION',
    entityId: negotiation._id,
    branch: negotiation.branch,
    changes: {
      bookingId: negotiation.booking,
      comment,
    },
  });

  return negotiation;
};

export const getAllNegotiations = async ({ branchId, status, page = 1, limit = 20 }) => {
  const filter = {};
  if (branchId) filter.branch = branchId;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [negotiations, total] = await Promise.all([
    Negotiation.find(filter)
      .populate('booking', 'bookingId checkIn checkOut totalAmount customer status')
      .populate('branch', 'name code')
      .populate('requestedBy', 'name email')
      .populate('decidedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Negotiation.countDocuments(filter),
  ]);

  return {
    negotiations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
