const NodeCache = require('node-cache');
const USDAProvider = require('./providers/USDAProvider');

class FoodService {
  constructor() {
    // Initialize cache with TTL from environment or default to 1 hour
    this.cache = new NodeCache({
      stdTTL: parseInt(process.env.CACHE_TTL_SECONDS) || 3600,
      checkperiod: 600 // Check for expired keys every 10 minutes
    });

    // Initialize food data provider
    this.provider = this._initializeProvider();
  }

  _initializeProvider() {
    const providerType = process.env.FOOD_DATA_PROVIDER || 'usda';
    
    switch (providerType.toLowerCase()) {
      case 'usda':
        return new USDAProvider();
      // Future providers can be added here
      // case 'xyz':
      //   return new XyzProvider();
      default:
        console.warn(`Unknown provider type: ${providerType}, falling back to USDA`);
        return new USDAProvider();
    }
  }

  /**
   * Get calorie information for a dish
   * @param {string} dishName - Name of the dish
   * @param {number} servings - Number of servings
   * @returns {Promise<Object>} Calorie calculation result
   */
  async getCalories(dishName, servings) {
    try {
      // Input validation
      this._validateInput(dishName, servings);

      // Check cache first
      const cacheKey = this._generateCacheKey(dishName, servings);
      const cachedResult = this.cache.get(cacheKey);
      
      if (cachedResult) {
        console.log(`Cache hit for: ${dishName}`);
        return cachedResult;
      }

      // Search for food items
      const searchResults = await this.provider.searchFood(dishName, {
        pageSize: 10
      });

      console.log('searchResults', searchResults);
      if (!searchResults || searchResults.length === 0) {
        throw new Error('Dish not found');
      }

      // Find the best match
      const bestMatch = this._findBestMatch(dishName, searchResults);

      if (!bestMatch || !bestMatch.calories) {
        throw new Error('Dish not found or calorie information unavailable');
      }

      // Calculate calories
      const result = this.provider.calculateCalories(bestMatch, servings);

      // Add metadata
      result.searchResults = searchResults.length;
      result.matchScore = bestMatch.score;
      result.timestamp = new Date().toISOString();

      // Cache the result
      this.cache.set(cacheKey, result);
      
      console.log(`Calculated calories for: ${dishName}, servings: ${servings}`);
      return result;

    } catch (error) {
      console.error('FoodService.getCalories error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Search for food items by name
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchFood(query, options = {}) {
    try {
      if (!query || query.trim().length < 2) {
        throw new Error('Search query must be at least 2 characters long');
      }

      const cacheKey = `search_${query.toLowerCase()}_${JSON.stringify(options)}`;
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult) {
        return cachedResult;
      }

      const results = await this.provider.searchFood(query, options);
      
      // Cache search results for shorter time (15 minutes)
      this.cache.set(cacheKey, results, 900);
      
      return results;

    } catch (error) {
      console.error('FoodService.searchFood error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Get detailed information about a specific food item
   * @param {string} foodId - Food item ID
   * @returns {Promise<Object>} Food details
   */
  async getFoodDetails(foodId) {
    try {
      if (!foodId) {
        throw new Error('Food ID is required');
      }

      const cacheKey = `food_${foodId}`;
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult) {
        return cachedResult;
      }

      const result = await this.provider.getFoodDetails(foodId);
      
      // Cache food details for longer time (24 hours)
      this.cache.set(cacheKey, result, 86400);
      
      return result;

    } catch (error) {
      console.error('FoodService.getFoodDetails error:', error.message);
      throw this._handleError(error);
    }
  }

  /**
   * Get service status and provider information
   * @returns {Promise<Object>} Service status
   */
  async getStatus() {
    try {
      const providerInfo = this.provider.getProviderInfo();
      const isConnected = await this.provider.validateConnection();
      
      return {
        service: 'FoodService',
        status: isConnected ? 'healthy' : 'unhealthy',
        provider: providerInfo,
        cache: {
          keys: this.cache.keys().length,
          stats: this.cache.getStats()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'FoodService',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to match keys
   */
  clearCache(pattern = null) {
    if (pattern) {
      const keys = this.cache.keys().filter(key => key.includes(pattern));
      this.cache.del(keys);
      return { cleared: keys.length, pattern };
    } else {
      this.cache.flushAll();
      return { cleared: 'all' };
    }
  }

  _validateInput(dishName, servings) {
    if (!dishName || typeof dishName !== 'string' || dishName.trim().length === 0) {
      throw new Error('Dish name is required and must be a non-empty string');
    }

    if (!servings || typeof servings !== 'number' || servings <= 0) {
      throw new Error('Servings must be a positive number');
    }

    if (servings > 50) {
      throw new Error('Maximum 50 servings allowed');
    }

    if (dishName.length > 200) {
      throw new Error('Dish name too long (maximum 200 characters)');
    }
  }

  _generateCacheKey(dishName, servings) {
    return `calories_${dishName.toLowerCase().trim()}_${servings}`;
  }

  _findBestMatch(dishName, searchResults) {
    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    // First, try to find exact match
    const exactMatch = searchResults.find(item => 
      item.description.toLowerCase() === dishName.toLowerCase()
    );

    if (exactMatch && exactMatch.calories) {
      return exactMatch;
    }

    // Then find the first result with calories
    const withCalories = searchResults.find(item => 
      item.calories && item.calories > 0
    );

    if (withCalories) {
      return withCalories;
    }

    // If no explicit calories, try to find one with energy in nutrients
    const withEnergyNutrient = searchResults.find(item => 
      item.nutrients && item.nutrients.energy && item.nutrients.energy.value > 0
    );

    if (withEnergyNutrient) {
      // Set calories from energy nutrient for processing
      withEnergyNutrient.calories = Math.round(withEnergyNutrient.nutrients.energy.value);
      return withEnergyNutrient;
    }

    // If we still don't have calories, try the first result and see if we can extract energy
    const firstResult = searchResults[0];
    if (firstResult && firstResult.nutrients && firstResult.nutrients.energy) {
      firstResult.calories = Math.round(firstResult.nutrients.energy.value || 0);
    }

    return firstResult;
  }

  _handleError(error) {
    // Map service errors to user-friendly messages
    const errorMappings = {
      'Dish not found': 'Sorry, we could not find that dish in our database',
      'Invalid servings': 'Please enter a valid number of servings (greater than 0)',
      'USDA API rate limit exceeded': 'Service temporarily busy, please try again in a few minutes',
      'USDA API service unavailable': 'Food database service is temporarily unavailable',
      'Invalid USDA API key': 'Food database service configuration error'
    };

    const userMessage = errorMappings[error.message] || error.message;
    
    const serviceError = new Error(userMessage);
    serviceError.originalError = error.message;
    serviceError.service = 'FoodService';
    
    return serviceError;
  }
}

module.exports = FoodService; 