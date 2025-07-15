const express = require('express');
const {
  getCalories,
  searchFood,
  getFoodDetails,
  getStatus,
  clearCache,
  getPopularDishes,
  getBatchCalories
} = require('../controllers/calorieController');

const { authenticate, optionalAuth } = require('../middleware/auth');
const { 
  validate,
  getCaloriesSchema,
  searchFoodSchema
} = require('../utils/validation');

const router = express.Router();

// Public routes with optional authentication
router.post('/get-calories', 
  optionalAuth, 
  validate(getCaloriesSchema), 
  getCalories
);

router.get('/search', 
  validate(searchFoodSchema, 'query'), 
  searchFood
);

router.get('/food/:id', getFoodDetails);
router.get('/status', getStatus);
router.get('/popular-dishes', getPopularDishes);

// Batch processing endpoint
router.post('/batch-calories', optionalAuth, getBatchCalories);

// Protected routes (require authentication)
router.delete('/cache', authenticate, clearCache);

module.exports = router; 