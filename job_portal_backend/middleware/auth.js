// middleware/auth.js
// JWT authentication middleware

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and attach user to request
 * Used for protected routes
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role isBlocked recruiterStatus');

    if (!user || user.isBlocked) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Account is not available',
      });
    }

    req.userId = decoded.id;
    req.userRole = user.role;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Invalid token',
      error: error.message,
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Admin access required',
    });
  }

  next();
};

module.exports = { verifyToken, requireAdmin };
