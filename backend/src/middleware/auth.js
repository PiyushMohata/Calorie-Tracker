const AuthService = require('../services/AuthService');

const authService = new AuthService();

/**
 * Authentication middleware to protect routes
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token format'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await authService.verifyToken(token);
    
    // Add user info to request object
    req.user = decoded.user;
    req.userId = decoded.userId;
    
    next();

  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    
    return res.status(401).json({
      error: 'Access denied',
      message: error.message || 'Invalid token'
    });
  }
};

/**
 * Optional authentication middleware (user may or may not be authenticated)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = await authService.verifyToken(token);
    
    req.user = decoded.user;
    req.userId = decoded.userId;
    
    next();

  } catch (error) {
    console.warn('Optional authentication failed:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
}; 