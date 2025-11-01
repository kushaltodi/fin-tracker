/**
 * Format a date to YYYY-MM-DD
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Get the start of the month for a given date
 * @param {Date} date - The reference date
 * @returns {Date} Start of month
 */
const getStartOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get the end of the month for a given date
 * @param {Date} date - The reference date
 * @returns {Date} End of month
 */
const getEndOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Get the start of the year for a given date
 * @param {Date} date - The reference date
 * @returns {Date} Start of year
 */
const getStartOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 0, 1);
};

/**
 * Get the end of the year for a given date
 * @param {Date} date - The reference date
 * @returns {Date} End of year
 */
const getEndOfYear = (date = new Date()) => {
  return new Date(date.getFullYear(), 11, 31);
};

/**
 * Check if a date is within a range
 * @param {Date} date - The date to check
 * @param {Date} startDate - Range start
 * @param {Date} endDate - Range end
 * @returns {boolean} Whether date is in range
 */
const isDateInRange = (date, startDate, endDate) => {
  return date >= startDate && date <= endDate;
};

/**
 * Add days to a date
 * @param {Date} date - The base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Subtract days from a date
 * @param {Date} date - The base date
 * @param {number} days - Number of days to subtract
 * @returns {Date} New date
 */
const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

module.exports = {
  formatDate,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  isDateInRange,
  addDays,
  subtractDays
};