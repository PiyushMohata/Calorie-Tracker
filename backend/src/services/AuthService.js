const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data and token
   */
  async register(userData) {
    try {
      const { firstName, lastName, email, password } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('Email already registered');
      }

      // Create new user
      const user = new User({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        password
      });

      await user.save();

      // Generate token
      const token = this._generateToken(user._id);

      return {
        user: user.toJSON(),
        token,
        message: 'User registered successfully'
      };

    } catch (error) {
      console.error('AuthService.register error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Login user
   * @param {Object} credentials - User login credentials
   * @returns {Promise<Object>} User data and token
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Find user and validate credentials
      const user = await User.findByCredentials(email, password);

      // Generate new token
      const token = this._generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      return {
        user: user.toJSON(),
        token,
        message: 'Login successful'
      };

    } catch (error) {
      console.error('AuthService.login error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Promise<Object>} Decoded token data
   */
  async verifyToken(token) {
    try {
      if (!token) {
        throw new Error('Token is required');
      }

      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Check if user still exists and is active
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid token - user not found or inactive');
      }

      return {
        userId: decoded.userId,
        user: user.toJSON()
      };

    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw error;
    }
  }

  /**
   * Refresh token
   * @param {string} userId - User ID
   * @returns {string} New JWT token
   */
  async refreshToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const token = this._generateToken(userId);
      return {
        token,
        user: user.toJSON(),
        message: 'Token refreshed successfully'
      };

    } catch (error) {
      console.error('AuthService.refreshToken error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Get user profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        throw new Error('User not found');
      }

      return {
        user: user.toJSON(),
        message: 'Profile retrieved successfully'
      };

    } catch (error) {
      console.error('AuthService.getProfile error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(userId, updates) {
    try {
      const allowedUpdates = ['firstName', 'lastName'];
      const filteredUpdates = {};

      // Filter allowed updates
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key) && updates[key]) {
          filteredUpdates[key] = updates[key].trim();
        }
      });

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error('No valid updates provided');
      }

      const user = await User.findByIdAndUpdate(
        userId,
        filteredUpdates,
        { new: true, runValidators: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        user: user.toJSON(),
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('AuthService.updateProfile error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {Object} passwordData - Current and new password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return {
        message: 'Password changed successfully'
      };

    } catch (error) {
      console.error('AuthService.changePassword error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Deactivate user account
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Success message
   */
  async deactivateAccount(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        message: 'Account deactivated successfully'
      };

    } catch (error) {
      console.error('AuthService.deactivateAccount error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Generate JWT token
   * @param {string} userId - User ID
   * @returns {string} JWT token
   * @private
   */
  _generateToken(userId) {
    return jwt.sign(
      { userId },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  /**
   * Handle and format errors
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   * @private
   */
  _handleError(error) {
    // Map service errors to user-friendly messages
    const errorMappings = {
      'Email already registered': 'An account with this email already exists',
      'Invalid email or password': 'Invalid email or password',
      'Invalid token': 'Authentication failed - please login again',
      'Token expired': 'Session expired - please login again',
      'User not found': 'User account not found',
      'Current password is incorrect': 'Current password is incorrect'
    };

    const userMessage = errorMappings[error.message] || error.message;
    
    const serviceError = new Error(userMessage);
    serviceError.originalError = error.message;
    serviceError.service = 'AuthService';
    
    return serviceError;
  }
}

module.exports = AuthService; 