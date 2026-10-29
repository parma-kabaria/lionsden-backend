import * as bookingService from './booking.service.js';
import * as availabilityService from './availability.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.body, req);
    return sendCreated(res, { data: booking, message: 'Booking created successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const { branchId, bungalowId, status, startDate, endDate, search, page, limit } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await bookingService.getAllBookings({
      branchId: effectiveBranch,
      bungalowId,
      status,
      startDate,
      endDate,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.bookings,
      meta: { pagination: result.pagination },
      message: 'Bookings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    return sendSuccess(res, { data: booking, message: 'Booking retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await bookingService.cancelBooking(req.params.id, reason, req);
    return sendSuccess(res, { data: booking, message: 'Booking cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await bookingService.updateBookingStatus(req.params.id, status, req);
    return sendSuccess(res, { data: booking, message: 'Booking status updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const searchAvailability = async (req, res, next) => {
  try {
    const { branch, checkIn, checkOut, category, facilities, bungalowNumber, guestsCount } =
      req.query;

    const effectiveBranch = req.effectiveBranchId || branch;

    const facilitiesList = facilities
      ? Array.isArray(facilities)
        ? facilities
        : [facilities]
      : undefined;

    const result = await availabilityService.searchAvailability({
      branch: effectiveBranch,
      checkIn,
      checkOut,
      category,
      facilities: facilitiesList,
      bungalowNumber,
      guestsCount,
    });

    return sendSuccess(res, {
      data: result,
      message: 'Bungalow availability retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};
