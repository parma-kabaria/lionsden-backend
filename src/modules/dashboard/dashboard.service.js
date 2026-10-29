import mongoose from 'mongoose';
import { Bungalow } from '../bungalows/bungalow.model.js';
import { Booking } from '../bookings/booking.model.js';
import { Payment } from '../payments/payment.model.js';
import { Negotiation } from '../negotiations/negotiation.model.js';
import { MaintenanceTicket } from '../maintenance/maintenance.model.js';
import { Branch } from '../branches/branch.model.js';
import {
  BOOKING_STATUS,
  FOOD_OPTIONS,
  NEGOTIATION_STATUS,
  MAINTENANCE_STATUS,
  BUNGALOW_MAINTENANCE_STATUS,
} from '../../config/constants.js';

export const getDashboardSummary = async ({ branchId } = {}) => {
  let targetBranchId = branchId;
  if (branchId) {
    const branchDoc = await Branch.findById(branchId);
    if (branchDoc && branchDoc.type === 'HEAD_OFFICE') {
      const dhari = await Branch.findOne({ code: 'DHARI' });
      if (dhari) targetBranchId = dhari._id;
    }
  }

  const branchFilter = targetBranchId ? { branch: new mongoose.Types.ObjectId(targetBranchId) } : {};

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. Bungalow inventory counts
  const bungalowStats = await Bungalow.aggregate([
    { $match: { ...branchFilter, isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        underMaintenance: {
          $sum: {
            $cond: [
              { $eq: ['$maintenanceStatus', BUNGALOW_MAINTENANCE_STATUS.UNDER_MAINTENANCE] },
              1,
              0,
            ],
          },
        },
        partialMaintenance: {
          $sum: {
            $cond: [{ $eq: ['$maintenanceStatus', BUNGALOW_MAINTENANCE_STATUS.PARTIAL] }, 1, 0],
          },
        },
      },
    },
  ]);

  const totalBungalows = bungalowStats[0]?.total || 0;
  const underMaintenanceBungalows = bungalowStats[0]?.underMaintenance || 0;
  const partialMaintenanceBungalows = bungalowStats[0]?.partialMaintenance || 0;

  // 2. Currently active / checked-in bookings today
  const currentlyBookedCount = await Booking.countDocuments({
    ...branchFilter,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN] },
    checkIn: { $lte: now },
    checkOut: { $gt: now },
  });

  const availableBungalows = Math.max(
    0,
    totalBungalows - underMaintenanceBungalows - currentlyBookedCount
  );

  // 3. Today's expected arrivals & departures
  const [upcomingArrivals, upcomingDepartures] = await Promise.all([
    Booking.find({
      ...branchFilter,
      status: BOOKING_STATUS.CONFIRMED,
      checkIn: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('bungalow', 'number category')
      .populate('branch', 'name code')
      .lean(),
    Booking.find({
      ...branchFilter,
      status: BOOKING_STATUS.CHECKED_IN,
      checkOut: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('bungalow', 'number category')
      .populate('branch', 'name code')
      .lean(),
  ]);

  // 4. Pending negotiation requests count
  const pendingNegotiationsCount = await Negotiation.countDocuments({
    ...branchFilter,
    status: NEGOTIATION_STATUS.PENDING,
  });

  // 5. Open maintenance requests count
  const openMaintenanceCount = await MaintenanceTicket.countDocuments({
    ...branchFilter,
    status: {
      $in: [
        MAINTENANCE_STATUS.REPORTED,
        MAINTENANCE_STATUS.APPROVED,
        MAINTENANCE_STATUS.ASSIGNED,
        MAINTENANCE_STATUS.IN_PROGRESS,
      ],
    },
  });

  // 6. Occupancy rate calculation
  const occupancyPercentage =
    totalBungalows > 0 ? Number(((currentlyBookedCount / totalBungalows) * 100).toFixed(1)) : 0;

  // 7. Branch-wise payment collections from real database records
  const allBranches = await Branch.find({ isActive: true }).select('name code type').lean();

  const paymentStats = await Payment.aggregate([
    { $match: { isReversal: false } },
    {
      $group: {
        _id: '$branch',
        totalPaise: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
  ]);

  const paymentMap = new Map();
  let maxCollectionPaise = 0;

  for (const stat of paymentStats) {
    if (stat._id) {
      paymentMap.set(stat._id.toString(), {
        totalPaise: stat.totalPaise,
        count: stat.transactionCount,
      });
      if (stat.totalPaise > maxCollectionPaise) {
        maxCollectionPaise = stat.totalPaise;
      }
    }
  }

  const branchCollections = allBranches
    .filter(br => !branchId || br._id.toString() === branchId.toString())
    .map(br => {
      const stat = paymentMap.get(br._id.toString()) || { totalPaise: 0, count: 0 };
      const totalRupees = Math.round(stat.totalPaise / 100);
      const percentage = maxCollectionPaise > 0 ? Math.round((stat.totalPaise / maxCollectionPaise) * 100) : 0;

      let displayName = br.name;
      if (br.code === 'AHM' && !displayName.includes('Sales Desk')) {
        displayName = 'Ahmedabad (HQ Sales Desk)';
      } else if (br.code === 'DHARI' && !displayName.includes('Resort On-Site')) {
        displayName = 'Dhari (Resort On-Site)';
      }

      return {
        branchId: br._id,
        branchName: displayName,
        branchCode: br.code,
        type: br.type,
        totalCollected: totalRupees,
        transactionCount: stat.count,
        percentage: totalRupees > 0 ? Math.max(percentage, 12) : 0,
      };
    })
    .sort((a, b) => b.totalCollected - a.totalCollected);

  // 8. Recent bookings from database
  const recentBookingFilter = branchId
    ? {
        $or: [
          { branch: new mongoose.Types.ObjectId(branchId) },
          branchFilter,
        ],
      }
    : {};

  const recentBookingsRaw = await Booking.find(recentBookingFilter)
    .populate('bungalow', 'number category')
    .populate('branch', 'name code')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const recentBookings = recentBookingsRaw.map(b => {
    let formattedStatus = 'Confirmed';
    if (b.status === BOOKING_STATUS.CHECKED_IN) formattedStatus = 'Checked In';
    else if (b.status === BOOKING_STATUS.CHECKED_OUT) formattedStatus = 'Checked Out';
    else if (b.status === BOOKING_STATUS.CANCELLED) formattedStatus = 'Cancelled';
    else if (b.status === 'PENDING') formattedStatus = 'Pending';

    return {
      id: b.bookingId,
      _id: b._id,
      customer: b.customer?.name || 'Guest',
      mobile: b.customer?.phone || '—',
      bungalow: b.bungalow?.number || '—',
      category: b.bungalow?.category ? `${b.bungalow.category}` : '—',
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      food: b.foodOption === FOOD_OPTIONS.WITH_FOOD ? 'With Food' : 'Without Food',
      status: formattedStatus,
      rawStatus: b.status,
      totalAmount: Math.round((b.totalAmount || 0) / 100),
      totalPaid: Math.round((b.totalPaid || 0) / 100),
      branchName: b.branch?.name || '',
      branchCode: b.branch?.code || '',
    };
  });

  return {
    inventory: {
      totalBungalows,
      currentlyBooked: currentlyBookedCount,
      available: availableBungalows,
      underMaintenance: underMaintenanceBungalows,
      partialMaintenance: partialMaintenanceBungalows,
      occupancyPercentage,
    },
    todayActivity: {
      arrivalsCount: upcomingArrivals.length,
      departuresCount: upcomingDepartures.length,
      arrivals: upcomingArrivals,
      departures: upcomingDepartures,
    },
    actionItems: {
      pendingNegotiationsCount,
      openMaintenanceCount,
    },
    branchCollections,
    recentBookings,
  };
};

