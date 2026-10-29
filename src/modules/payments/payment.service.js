import crypto from 'node:crypto';
import { Payment } from './payment.model.js';
import { Booking } from '../bookings/booking.model.js';
import { NotFoundError, BadRequestError, ConflictError } from '../../common/errors/app.error.js';
import { PAYMENT_TYPES, BOOKING_STATUS } from '../../config/constants.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

const generateReceiptNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `REC-${dateStr}-${randomHex}`;
};

export const recordPayment = async (data, req, session = null) => {
  if (data.idempotencyKey) {
    const existing = await Payment.findOne({ idempotencyKey: data.idempotencyKey })
      .populate('booking', 'bookingId customer checkIn checkOut')
      .populate('branch', 'name code')
      .populate('collectingUser', 'name email');
    if (existing) {
      return existing;
    }
  }

  const booking = await Booking.findById(data.bookingId).session(session);
  if (!booking) {
    throw new NotFoundError(`Booking with id ${data.bookingId} not found`);
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw new BadRequestError('Cannot record payment for a cancelled booking');
  }

  if (data.amount <= 0) {
    throw new BadRequestError('Payment amount must be greater than zero');
  }

  const receiptNumber = generateReceiptNumber();
  const userId = req?.user?._id || data.collectingUserId;

  const [payment] = await Payment.create(
    [
      {
        receiptNumber,
        booking: booking._id,
        branch: booking.branch,
        customer: {
          name: booking.customer.name,
          phone: booking.customer.phone,
        },
        amount: data.amount,
        type: data.type || PAYMENT_TYPES.BALANCE,
        paymentMode: data.paymentMode,
        transactionReference: data.transactionReference || '',
        collectingUser: userId,
        notes: data.notes || '',
        idempotencyKey: data.idempotencyKey || null,
      },
    ],
    { session }
  );

  // Update booking payment totals
  booking.totalPaid += data.amount;
  booking.outstandingBalance = booking.totalAmount - booking.totalPaid;
  if (data.type === PAYMENT_TYPES.ADVANCE) {
    booking.advancePayment = (booking.advancePayment || 0) + data.amount;
  }
  await booking.save({ session });

  await logAudit({
    req,
    action: 'PAYMENT_RECORDED',
    entity: 'PAYMENT',
    entityId: payment._id,
    branch: booking.branch,
    changes: {
      receiptNumber,
      bookingId: booking.bookingId,
      amount: data.amount,
      paymentMode: data.paymentMode,
      newOutstandingBalance: booking.outstandingBalance,
    },
  });

  return payment;
};

export const recordReversal = async (paymentId, reason, req) => {
  const originalPayment = await Payment.findById(paymentId);
  if (!originalPayment) {
    throw new NotFoundError(`Payment with id ${paymentId} not found`);
  }

  if (originalPayment.isReversal) {
    throw new BadRequestError('Cannot reverse a payment that is already a reversal entry');
  }

  // Check if this payment was already reversed
  const existingReversal = await Payment.findOne({
    reversalOfPaymentId: originalPayment._id,
  });

  if (existingReversal) {
    throw new ConflictError(
      `This payment was already reversed under receipt ${existingReversal.receiptNumber}`
    );
  }

  const booking = await Booking.findById(originalPayment.booking);
  if (!booking) {
    throw new NotFoundError('Associated booking not found');
  }

  const receiptNumber = generateReceiptNumber();

  // Create reversing ledger record
  const reversalPayment = await Payment.create({
    receiptNumber,
    booking: booking._id,
    branch: originalPayment.branch,
    customer: originalPayment.customer,
    amount: originalPayment.amount,
    type: PAYMENT_TYPES.REVERSAL,
    paymentMode: originalPayment.paymentMode,
    transactionReference: `REV-${originalPayment.receiptNumber}`,
    collectingUser: req.user._id,
    notes: `Reversal of receipt ${originalPayment.receiptNumber}. Reason: ${reason}`,
    isReversal: true,
    reversalOfPaymentId: originalPayment._id,
    reversalReason: reason,
    reversedBy: req.user._id,
  });

  // Adjust booking balances
  booking.totalPaid = Math.max(0, booking.totalPaid - originalPayment.amount);
  booking.outstandingBalance = booking.totalAmount - booking.totalPaid;
  if (originalPayment.type === PAYMENT_TYPES.ADVANCE) {
    booking.advancePayment = Math.max(0, (booking.advancePayment || 0) - originalPayment.amount);
  }
  await booking.save();

  await logAudit({
    req,
    action: 'PAYMENT_REVERSED',
    entity: 'PAYMENT',
    entityId: reversalPayment._id,
    branch: originalPayment.branch,
    changes: {
      originalReceipt: originalPayment.receiptNumber,
      reversalReceipt: receiptNumber,
      amount: originalPayment.amount,
      reason,
      newOutstandingBalance: booking.outstandingBalance,
    },
  });

  return {
    reversal: reversalPayment,
    updatedBookingBalance: booking.outstandingBalance,
  };
};

export const getAllPayments = async ({
  branchId,
  bookingId,
  collectingUserId,
  paymentMode,
  type,
  startDate,
  endDate,
  search,
  page = 1,
  limit = 20,
}) => {
  const filter = {};

  if (branchId) filter.branch = branchId;
  if (bookingId) filter.booking = bookingId;
  if (collectingUserId) filter.collectingUser = collectingUserId;
  if (paymentMode) filter.paymentMode = paymentMode;
  if (type) filter.type = type;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { receiptNumber: { $regex: search, $options: 'i' } },
      { transactionReference: { $regex: search, $options: 'i' } },
      { 'customer.name': { $regex: search, $options: 'i' } },
      { 'customer.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('booking', 'bookingId checkIn checkOut totalAmount customer status')
      .populate('branch', 'name code')
      .populate('collectingUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getPaymentById = async id => {
  const payment = await Payment.findById(id)
    .populate('booking', 'bookingId checkIn checkOut totalAmount customer status')
    .populate('branch', 'name code')
    .populate('collectingUser', 'name email')
    .populate('reversedBy', 'name email');

  if (!payment) {
    throw new NotFoundError(`Payment with id ${id} not found`);
  }
  return payment;
};
