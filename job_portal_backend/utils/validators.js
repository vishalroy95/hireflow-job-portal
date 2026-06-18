// utils/validators.js
// Validation helper functions

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate phone number
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL
 */
const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate salary range
 */
const validateSalaryRange = (min, max) => {
  return min > 0 && max >= min;
};

module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateURL,
  validateSalaryRange,
};
