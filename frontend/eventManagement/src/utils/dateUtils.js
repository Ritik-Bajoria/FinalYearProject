// utils/dateUtils.js

/**
 * Formats a date string or Date object to a readable date format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date (e.g., "January 1, 2023")
 */
export const formatDate = (date) => {
  if (!date) return 'TBD';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats a date string or Date object to a time format
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid time';
  
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Formats a date string or Date object to both date and time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted datetime (e.g., "January 1, 2023 at 2:30 PM")
 */
export const formatDateTime = (date) => {
  if (!date) return 'TBD';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid datetime';
  
  return `${formatDate(d)} at ${formatTime(d)}`;
};

/**
 * Converts a date to ISO string format without timezone adjustment
 * @param {string|Date} date - The date to convert
 * @returns {string} ISO format (e.g., "2023-01-01T14:30:00")
 */
export const toLocalISOString = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const pad = (num) => num.toString().padStart(2, '0');
  
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * Calculates the duration between two dates in minutes
 * @param {string|Date} start - Start date
 * @param {string|Date} end - End date
 * @returns {number} Duration in minutes
 */
export const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  if (isNaN(startDate.getTime())) return 0;
  if (isNaN(endDate.getTime())) return 0;
  
  return Math.round((endDate - startDate) / (1000 * 60));
};

/**
 * Checks if a date is in the past
 * @param {string|Date} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  
  return d < new Date();
};

/**
 * Formats a duration in minutes to a human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  toLocalISOString,
  calculateDuration,
  isPastDate,
  formatDuration
};