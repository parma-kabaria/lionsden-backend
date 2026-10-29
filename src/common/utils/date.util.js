/**
 * Date and Timezone Utilities for Asia/Kolkata (IST)
 * All database timestamps are strictly stored in UTC.
 * Half-open interval rules: [checkIn, checkOut)
 */

export const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Validates whether two date intervals overlap under half-open interval semantics:
 * [startA, endA) and [startB, endB) overlap if startA < endB AND endA > startB
 * @param {Date|string} startA
 * @param {Date|string} endA
 * @param {Date|string} startB
 * @param {Date|string} endB
 * @returns {boolean}
 */
export const doIntervalsOverlap = (startA, endA, startB, endB) => {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  return sA < eB && eA > sB;
};

/**
 * Calculates number of nights between check-in and check-out
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {number}
 */
export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

/**
 * Returns Mongo date query for overlapping active intervals
 * @param {Date|string} checkIn
 * @param {Date|string} checkOut
 * @returns {object}
 */
export const getOverlapMongoQuery = (checkIn, checkOut) => {
  const reqCheckIn = new Date(checkIn);
  const reqCheckOut = new Date(checkOut);

  return {
    checkIn: { $lt: reqCheckOut },
    checkOut: { $gt: reqCheckIn },
  };
};

/**
 * Formats a UTC date to Asia/Kolkata readable string
 * @param {Date|string} date
 * @returns {string}
 */
export const formatIST = date => {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date));
};
