import { Bungalow } from '../bungalows/bungalow.model.js';
import { Booking } from './booking.model.js';
import { Branch } from '../branches/branch.model.js';
import { MaintenanceTicket } from '../maintenance/maintenance.model.js';
import { PricingRule } from '../pricing/pricing.model.js';
import { calculateApplicablePrice } from '../pricing/pricing.service.js';
import {
  BOOKING_STATUS,
  MAINTENANCE_STATUS,
  BUNGALOW_MAINTENANCE_STATUS,
} from '../../config/constants.js';

/**
 * Searches bungalow availability for a branch and date range
 * Applies half-open interval semantics [checkIn, checkOut)
 * Attaches pricing rules and maintenance warnings
 */
export const searchAvailability = async ({
  branch,
  checkIn,
  checkOut,
  category,
  facilities,
  bungalowNumber,
  guestsCount,
}) => {
  const reqCheckIn = new Date(checkIn);
  const reqCheckOut = new Date(checkOut);

  // If branch is provided, resolve Head Office (AHM) to Dhari Resort since all bungalows are at Dhari
  let targetBranchId = branch;
  if (branch) {
    const branchDoc = await Branch.findById(branch);
    if (branchDoc && branchDoc.type === 'HEAD_OFFICE') {
      const dhari = await Branch.findOne({ code: 'DHARI' });
      if (dhari) targetBranchId = dhari._id;
    }
  }

  // 1. Build initial bungalow query
  const bungalowFilter = {
    ...(targetBranchId ? { branch: targetBranchId } : {}),
    isActive: true,
  };

  if (category) {
    bungalowFilter.category = category;
  }

  if (bungalowNumber) {
    bungalowFilter.number = bungalowNumber.toUpperCase();
  }

  if (guestsCount) {
    bungalowFilter['capacity.maxGuests'] = { $gte: Number(guestsCount) };
  }

  if (facilities && facilities.length > 0) {
    bungalowFilter.facilities = { $all: facilities };
  }

  // 2. Query all matching bungalows in this branch and candidate pricing rules in parallel
  const [allBungalows, candidateRules] = await Promise.all([
    Bungalow.find(bungalowFilter).populate('branch', 'name code').lean(),
    PricingRule.find({
      isActive: true,
      startDate: { $lt: reqCheckOut },
      endDate: { $gt: reqCheckIn },
    }).lean(),
  ]);

  if (allBungalows.length === 0) {
    return {
      availableBungalows: [],
      unavailableBungalows: [],
      meta: {
        totalFound: 0,
        availableCount: 0,
        checkIn: reqCheckIn,
        checkOut: reqCheckOut,
      },
    };
  }

  const bungalowIds = allBungalows.map(b => b._id);

  // 3. Find active overlapping bookings and blocking maintenance requests in parallel
  // Overlap condition: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
  const [overlappingBookings, activeMaintenanceTickets] = await Promise.all([
    Booking.find({
      bungalow: { $in: bungalowIds },
      status: { $ne: BOOKING_STATUS.CANCELLED },
      checkIn: { $lt: reqCheckOut },
      checkOut: { $gt: reqCheckIn },
    })
      .select('bungalow bookingId checkIn checkOut status')
      .lean(),
    MaintenanceTicket.find({
      bungalow: { $in: bungalowIds },
      status: {
        $in: [
          MAINTENANCE_STATUS.REPORTED,
          MAINTENANCE_STATUS.APPROVED,
          MAINTENANCE_STATUS.ASSIGNED,
          MAINTENANCE_STATUS.IN_PROGRESS,
        ],
      },
    }).lean(),
  ]);

  const bookedBungalowIds = new Set(overlappingBookings.map(b => b.bungalow.toString()));

  const maintenanceMap = new Map();
  for (const ticket of activeMaintenanceTickets) {
    const key = ticket.bungalow.toString();
    if (!maintenanceMap.has(key)) {
      maintenanceMap.set(key, []);
    }
    maintenanceMap.get(key).push(ticket);
  }

  // 5. Categorize each bungalow as available or unavailable with pricing preview
  const availableBungalows = [];
  const unavailableBungalows = [];

  for (const bungalow of allBungalows) {
    const bIdStr = bungalow._id.toString();
    const tickets = maintenanceMap.get(bIdStr) || [];

    // Check if bungalow has blocking maintenance
    const isUnderFullMaintenance =
      bungalow.maintenanceStatus === BUNGALOW_MAINTENANCE_STATUS.UNDER_MAINTENANCE ||
      tickets.some(t => t.blocksAvailability === true);

    const isBooked = bookedBungalowIds.has(bIdStr);

    // Maintenance warnings for partial issues (e.g. Geyser under repair)
    const warnings = tickets
      .filter(t => !t.blocksAvailability)
      .map(t => ({
        ticketNumber: t.ticketNumber,
        facilityAffected: t.facilityAffected,
        description: t.problemDescription,
      }));

    // Calculate dynamic pricing with pre-queried rules (evaluated in-memory instantly)
    const pricing = await calculateApplicablePrice(bungalow, reqCheckIn, reqCheckOut, candidateRules);

    const enrichedBungalow = {
      ...bungalow,
      pricing,
      maintenanceWarnings: warnings,
    };

    if (isBooked) {
      unavailableBungalows.push({
        bungalow: enrichedBungalow,
        reason: 'ALREADY_BOOKED',
        details: overlappingBookings.filter(b => b.bungalow.toString() === bIdStr),
      });
    } else if (isUnderFullMaintenance) {
      unavailableBungalows.push({
        bungalow: enrichedBungalow,
        reason: 'UNDER_MAINTENANCE',
        details: tickets.filter(t => t.blocksAvailability),
      });
    } else {
      availableBungalows.push(enrichedBungalow);
    }
  }

  return {
    availableBungalows,
    unavailableBungalows,
    meta: {
      totalFound: allBungalows.length,
      availableCount: availableBungalows.length,
      unavailableCount: unavailableBungalows.length,
      checkIn: reqCheckIn,
      checkOut: reqCheckOut,
    },
  };
};
