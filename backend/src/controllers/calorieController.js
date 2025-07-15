const FoodService = require('../services/FoodService');
const { asyncHandler } = require('../middleware/errorHandler');

const foodService = new FoodService();

/**
 * @desc    Get calorie information for a dish
 * @route   POST /api/get-calories
 * @access  Public
 */
const getCalories = asyncHandler(async (req, res) => {
  const { dish_name, servings } = req.body;
  
  const result = await foodService.getCalories(dish_name, servings);

  // Add user context if authenticated
  if (req.user) {
    result.userId = req.user._id;
    result.userName = `${req.user.firstName} ${req.user.lastName}`;
  }

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Search for food items
 * @route   GET /api/search
 * @access  Public
 */
const searchFood = asyncHandler(async (req, res) => {
  const results = await foodService.searchFood(req.query.query, {
    pageSize: req.query.pageSize,
    pageNumber: req.query.pageNumber
  });

  res.status(200).json({
    success: true,
    data: {
      results,
      count: results.length,
      query: req.query.query,
      pagination: {
        pageSize: req.query.pageSize || 25,
        pageNumber: req.query.pageNumber || 1
      }
    }
  });
});

/**
 * @desc    Get detailed information about a specific food item
 * @route   GET /api/food/:id
 * @access  Public
 */
const getFoodDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Food ID is required'
    });
  }

  const result = await foodService.getFoodDetails(id);

  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * @desc    Get service status and health check
 * @route   GET /api/status
 * @access  Public
 */
const getStatus = asyncHandler(async (req, res) => {
  const status = await foodService.getStatus();

  res.status(200).json({
    success: true,
    data: status
  });
});

/**
 * @desc    Clear service cache (admin operation)
 * @route   DELETE /api/cache
 * @access  Private
 */
const clearCache = asyncHandler(async (req, res) => {
  const { pattern } = req.query;
  
  const result = foodService.clearCache(pattern);

  res.status(200).json({
    success: true,
    data: {
      message: 'Cache cleared successfully',
      ...result
    }
  });
});

/**
 * @desc    Get popular/common dishes (mock endpoint for frontend enhancement)
 * @route   GET /api/popular-dishes
 * @access  Public
 */
const getPopularDishes = asyncHandler(async (req, res) => {
  const popularDishes = [
    'chicken biryani',
    'paneer butter masala',
    'grilled salmon',
    'caesar salad',
    'macaroni and cheese',
    'beef stir fry',
    'chicken tikka masala',
    'pasta alfredo',
    'vegetable fried rice',
    'greek salad'
  ];

  res.status(200).json({
    success: true,
    data: {
      dishes: popularDishes,
      message: 'Popular dishes retrieved successfully'
    }
  });
});

/**
 * @desc    Batch calorie calculation for multiple dishes
 * @route   POST /api/batch-calories
 * @access  Public
 */
const getBatchCalories = asyncHandler(async (req, res) => {
  const { dishes } = req.body;

  if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Dishes array is required and must not be empty'
    });
  }

  if (dishes.length > 10) {
    return res.status(400).json({
      success: false,
      error: 'Maximum 10 dishes allowed per batch request'
    });
  }

  const results = [];
  const errors = [];

  for (const dish of dishes) {
    try {
      if (!dish.dish_name || !dish.servings) {
        errors.push({
          dish: dish,
          error: 'dish_name and servings are required'
        });
        continue;
      }

      const result = await foodService.getCalories(dish.dish_name, dish.servings);
      results.push(result);
    } catch (error) {
      errors.push({
        dish: dish,
        error: error.message
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      results,
      errors,
      summary: {
        total_requested: dishes.length,
        successful: results.length,
        failed: errors.length
      }
    }
  });
});

module.exports = {
  getCalories,
  searchFood,
  getFoodDetails,
  getStatus,
  clearCache,
  getPopularDishes,
  getBatchCalories
}; 