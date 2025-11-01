/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Format percentage
 * @param {number} value - The value to format as percentage
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted percentage string
 */
const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Round to specified decimal places
 * @param {number} number - The number to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded number
 */
const roundToDecimals = (number, decimals = 2) => {
  const multiplier = Math.pow(10, decimals);
  return Math.round(number * multiplier) / multiplier;
};

/**
 * Parse currency string to number
 * @param {string} currencyString - Currency string to parse
 * @returns {number} Parsed number
 */
const parseCurrency = (currencyString) => {
  // Remove currency symbols, commas, and spaces, then parse
  const cleanString = currencyString.replace(/[^0-9.-]/g, '');
  return parseFloat(cleanString) || 0;
};

/**
 * Calculate percentage of total
 * @param {number} part - The part value
 * @param {number} total - The total value
 * @returns {number} Percentage
 */
const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return roundToDecimals((part / total) * 100);
};

/**
 * Format large numbers with abbreviations (K, M, B)
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
const formatLargeNumber = (number) => {
  if (number >= 1000000000) {
    return roundToDecimals(number / 1000000000) + 'B';
  }
  if (number >= 1000000) {
    return roundToDecimals(number / 1000000) + 'M';
  }
  if (number >= 1000) {
    return roundToDecimals(number / 1000) + 'K';
  }
  return number.toString();
};

module.exports = {
  formatCurrency,
  formatPercentage,
  roundToDecimals,
  parseCurrency,
  calculatePercentage,
  formatLargeNumber
};