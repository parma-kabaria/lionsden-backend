import mongoose from 'mongoose';
import { Payment } from '../payments/payment.model.js';
import { Booking } from '../bookings/booking.model.js';
import { toRupees } from '../../common/utils/currency.util.js';
import { BOOKING_STATUS } from '../../config/constants.js';

/**
 * Generates comprehensive Collections Report with payment modes, branch, and user breakdowns
 */
export const getCollectionsReport = async ({ branchId, startDate, endDate } = {}) => {
  const matchFilter = {};

  if (branchId) {
    matchFilter.branch = new mongoose.Types.ObjectId(branchId);
  }

  if (startDate || endDate) {
    matchFilter.createdAt = {};
    if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
    if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
  }

  // 1. Overall collections summary (Receipts vs Reversals)
  const [overallSummary] = await Payment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        grossCollectionsPaise: {
          $sum: { $cond: [{ $eq: ['$isReversal', false] }, '$amount', 0] },
        },
        reversalsPaise: {
          $sum: { $cond: [{ $eq: ['$isReversal', true] }, '$amount', 0] },
        },
        totalTransactions: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        grossCollectionsPaise: 1,
        reversalsPaise: 1,
        netCollectionsPaise: { $subtract: ['$grossCollectionsPaise', '$reversalsPaise'] },
        totalTransactions: 1,
      },
    },
  ]);

  // 2. Breakdown by payment mode
  const modeBreakdown = await Payment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$paymentMode',
        totalPaise: {
          $sum: {
            $cond: [{ $eq: ['$isReversal', false] }, '$amount', { $multiply: ['$amount', -1] }],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { totalPaise: -1 } },
  ]);

  // 3. Breakdown by branch
  const branchBreakdown = await Payment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$branch',
        totalPaise: {
          $sum: {
            $cond: [{ $eq: ['$isReversal', false] }, '$amount', { $multiply: ['$amount', -1] }],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branchDetails',
      },
    },
    { $unwind: '$branchDetails' },
    {
      $project: {
        branchId: '$_id',
        branchName: '$branchDetails.name',
        branchCode: '$branchDetails.code',
        totalPaise: 1,
        transactionCount: 1,
      },
    },
    { $sort: { totalPaise: -1 } },
  ]);

  // 4. Breakdown by collecting user
  const userBreakdown = await Payment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$collectingUser',
        totalPaise: {
          $sum: {
            $cond: [{ $eq: ['$isReversal', false] }, '$amount', { $multiply: ['$amount', -1] }],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    { $unwind: '$userDetails' },
    {
      $project: {
        userId: '$_id',
        userName: '$userDetails.name',
        userEmail: '$userDetails.email',
        totalPaise: 1,
        transactionCount: 1,
      },
    },
    { $sort: { totalPaise: -1 } },
  ]);

  const grossPaise = overallSummary?.grossCollectionsPaise || 0;
  const reversalsPaise = overallSummary?.reversalsPaise || 0;
  const netPaise = overallSummary?.netCollectionsPaise || 0;

  return {
    summary: {
      grossCollectionsPaise: grossPaise,
      grossCollectionsRupees: toRupees(grossPaise),
      reversalsPaise: reversalsPaise,
      reversalsRupees: toRupees(reversalsPaise),
      netCollectionsPaise: netPaise,
      netCollectionsRupees: toRupees(netPaise),
      totalTransactions: overallSummary?.totalTransactions || 0,
    },
    byPaymentMode: modeBreakdown.map(item => ({
      paymentMode: item._id,
      amountPaise: item.totalPaise,
      amountRupees: toRupees(item.totalPaise),
      transactionCount: item.transactionCount,
    })),
    byBranch: branchBreakdown.map(item => ({
      branchId: item.branchId,
      branchName: item.branchName,
      branchCode: item.branchCode,
      amountPaise: item.totalPaise,
      amountRupees: toRupees(item.totalPaise),
      transactionCount: item.transactionCount,
    })),
    byCollectingUser: userBreakdown.map(item => ({
      userId: item.userId,
      userName: item.userName,
      userEmail: item.userEmail,
      amountPaise: item.totalPaise,
      amountRupees: toRupees(item.totalPaise),
      transactionCount: item.transactionCount,
    })),
  };
};

/**
 * Generates category-wise and date-filtered Occupancy Report
 */
export const getOccupancyReport = async ({ branchId, startDate, endDate } = {}) => {
  const matchFilter = {
    status: { $ne: BOOKING_STATUS.CANCELLED },
  };

  if (branchId) {
    matchFilter.branch = new mongoose.Types.ObjectId(branchId);
  }

  if (startDate || endDate) {
    matchFilter.checkIn = {};
    if (startDate) matchFilter.checkIn.$gte = new Date(startDate);
    if (endDate) matchFilter.checkIn.$lte = new Date(endDate);
  }

  const categoryAggregation = await Booking.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'bungalows',
        localField: 'bungalow',
        foreignField: '_id',
        as: 'bungalowInfo',
      },
    },
    { $unwind: '$bungalowInfo' },
    {
      $group: {
        _id: '$bungalowInfo.category',
        totalBookings: { $sum: 1 },
        totalNightsBooked: { $sum: '$nights' },
        totalRevenuePaise: { $sum: '$totalAmount' },
        totalPaidPaise: { $sum: '$totalPaid' },
      },
    },
    { $sort: { totalNightsBooked: -1 } },
  ]);

  return {
    categories: categoryAggregation.map(c => ({
      category: c._id,
      totalBookings: c.totalBookings,
      totalNightsBooked: c.totalNightsBooked,
      totalRevenuePaise: c.totalRevenuePaise,
      totalRevenueRupees: toRupees(c.totalRevenuePaise),
      totalPaidPaise: c.totalPaidPaise,
      totalPaidRupees: toRupees(c.totalPaidPaise),
    })),
  };
};

/**
 * Generates Booking Balances Report (Advance, Total Paid, Outstanding)
 */
export const getBalancesReport = async ({ branchId, status, page = 1, limit = 50 } = {}) => {
  const filter = {
    status: status ? status : { $ne: BOOKING_STATUS.CANCELLED },
  };

  if (branchId) filter.branch = branchId;

  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .select(
        'bookingId customer branch bungalow checkIn checkOut totalAmount advancePayment totalPaid outstandingBalance status'
      )
      .populate('branch', 'name code')
      .populate('bungalow', 'number category')
      .sort({ outstandingBalance: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings: bookings.map(b => ({
      ...b,
      totalAmountRupees: toRupees(b.totalAmount),
      advancePaymentRupees: toRupees(b.advancePayment),
      totalPaidRupees: toRupees(b.totalPaid),
      outstandingBalanceRupees: toRupees(b.outstandingBalance),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};
