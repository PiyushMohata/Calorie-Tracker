const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  deactivateAccount,
  logout
} = require('../controllers/authController');

const { authenticate } = require('../middleware/auth');
const { 
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../utils/validation');

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes (require authentication)
router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/change-password', validate(changePasswordSchema), changePassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.delete('/account', deactivateAccount);

module.exports = router; 