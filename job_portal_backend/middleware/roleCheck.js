// middleware/roleCheck.js
// Role-based access control middleware

/**
 * Middleware to check if user is a recruiter
 * Used for recruiter-only routes
 */
const isRecruiter = (req, res, next) => {
  if (req.userRole !== 'recruiter') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Recruiter role required',
    });
  }

  if (req.user?.recruiterStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Recruiter account is pending approval',
    });
  }

  next();
};

/**
 * Middleware to check if user is a candidate
 * Used for candidate-only routes
 */
const isCandidate = (req, res, next) => {
  if (req.userRole !== 'candidate') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Candidate role required',
    });
  }
  next();
};

/**
 * Middleware to check if user is admin (optional)
 * Can be extended for admin functionality
 */
const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Admin role required',
    });
  }
  next();
};

module.exports = { isRecruiter, isCandidate, isAdmin };
