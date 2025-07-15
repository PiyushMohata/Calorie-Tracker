const AuthService = require('../services/AuthService');
const { asyncHandler } = require('../middleware/errorHandler');

const authService = new AuthService();

/**
 * @desc    Register new user
 * @route   POST /auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Login user
 * @route   POST /auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Get user profile
 * @route   GET /auth/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const result = await authService.getProfile(req.userId);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.userId, req.body);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Change password
 * @route   PUT /auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.userId, req.body);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Refresh token
 * @route   POST /auth/refresh-token
 * @access  Private
 */
const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.userId);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Deactivate account
 * @route   DELETE /auth/account
 * @access  Private
 */
const deactivateAccount = asyncHandler(async (req, res) => {
  const result = await authService.deactivateAccount(req.userId);

  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  deactivateAccount,
  logout
}; 