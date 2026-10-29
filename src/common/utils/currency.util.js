/**
 * Currency Utilities
 * All monetary amounts are stored as integer paise (1 INR = 100 paise)
 * to avoid floating-point rounding issues.
 */

/**
 * Converts Indian Rupees (float or integer) to integer paise
 * @param {number|string} rupees
 * @returns {number} Integer paise
 */
export const toPaise = rupees => {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

/**
 * Converts integer paise to Indian Rupees
 * @param {number} paise
 * @returns {number} Rupees (2 decimal places)
 */
export const toRupees = paise => {
  if (typeof paise !== 'number') return 0;
  return Number((paise / 100).toFixed(2));
};

/**
 * Formats integer paise into standard Indian Rupee string (e.g. ₹5,000.00)
 * @param {number} paise
 * @returns {string}
 */
export const formatINR = paise => {
  const rupees = toRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(rupees);
};
