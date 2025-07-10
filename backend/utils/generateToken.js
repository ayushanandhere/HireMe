const jwt = require('jsonwebtoken');

/**
 * Generate JWT for user authentication
 * @param {string} id - User ID to include in token payload
 * @param {string} role - User role (candidate or recruiter)
 * @returns {string} JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken; 