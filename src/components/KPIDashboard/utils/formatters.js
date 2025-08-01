// src/components/KPIDashboard/utils/formatters.js

/**
 * Format a number as USD currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format salary for display (rounded to nearest $500)
 * @param {number} salary - The salary to format
 * @returns {number} Rounded salary
 */
export const formatSalaryForDisplay = (salary) => {
  return Math.round(salary / 500) * 500;
};

/**
 * Format KPI values based on their type
 * @param {Object} kpi - The KPI object
 * @param {string} valueType - Type of value ('actual', 'target', etc.)
 * @returns {string} Formatted KPI value
 */
export const formatKPIValue = (kpi, valueType = 'actual') => {
  const value = kpi[valueType];
  
  // Handle special KPI types
  if (kpi.name === 'LV Maintenance Growth') {
    return `${value}%`;
  }
  
  if (kpi.name === 'Extra Services') {
    return formatCurrency(value);
  }
  
  // Default percentage formatting
  return `${value}%`;
};

/**
 * Format a number as a percentage
 * @param {number} value - The value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with commas
 * @param {number} num - The number to format
 * @returns {string} Formatted number with commas
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};