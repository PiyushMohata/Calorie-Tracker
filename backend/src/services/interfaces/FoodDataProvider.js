/**
 * Abstract interface for food data providers
 */
class FoodDataProvider {
  constructor() {
    if (this.constructor === FoodDataProvider) {
      throw new Error('Abstract class cannot be instantiated directly');
    }
  }

  /**
   * Search for food items by name
   * @param {string} query - Food name to search for
   * @param {Object} options - Additional search options
   * @returns {Promise<Array>} Array of food items
   */
  async searchFood(query, options = {}) {
    throw new Error('searchFood method must be implemented');
  }

  /**
   * Get detailed nutrition information for a specific food item
   * @param {string} foodId - Unique identifier for the food item
   * @returns {Promise<Object>} Detailed nutrition information
   */
  async getFoodDetails(foodId) {
    throw new Error('getFoodDetails method must be implemented');
  }

  /**
   * Calculate calories for a given food item and serving size
   * @param {Object} foodItem - Food item with nutrition data
   * @param {number} servings - Number of servings
   * @returns {Object} Calorie calculation result
   */
  calculateCalories(foodItem, servings) {
    throw new Error('calculateCalories method must be implemented');
  }

  /**
   * Get provider-specific metadata
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    throw new Error('getProviderInfo method must be implemented');
  }

  /**
   * Validate API credentials and connection
   * @returns {Promise<boolean>} Connection status
   */
  async validateConnection() {
    throw new Error('validateConnection method must be implemented');
  }
}

module.exports = FoodDataProvider; 