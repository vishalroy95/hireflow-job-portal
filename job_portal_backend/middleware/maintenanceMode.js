const jwt = require('jsonwebtoken');
const { getOrCreateSettings } = require('../utils/platformSettings');

const isSkippedPath = (path) =>
  path === '/' ||
  path.startsWith('/uploads') ||
  path === '/api/settings/public' ||
  path.startsWith('/api/admin') ||
  path === '/api/auth/login' ||
  path === '/api/auth/logout' ||
  path === '/api/auth/profile';

const hasAdminToken = (req) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) return false;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.role === 'admin';
  } catch (error) {
    return false;
  }
};

const maintenanceMode = async (req, res, next) => {
  try {
    if (isSkippedPath(req.path) || hasAdminToken(req)) {
      return next();
    }

    const settings = await getOrCreateSettings();

    if (!settings.general?.maintenanceMode) {
      return next();
    }

    return res.status(503).json({
      success: false,
      message: 'The platform is temporarily under maintenance. Please try again later.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = maintenanceMode;
