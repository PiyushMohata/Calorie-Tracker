const FoodService = require('../services/FoodService');

jest.mock('../services/providers/USDAProvider');

describe('FoodService', () => {
  let foodService;

  beforeEach(() => {
    foodService = new FoodService();
    // Clear cache before each test
    foodService.clearCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCalories', () => {
    test('should calculate calories for macaroni and cheese', async () => {
      // Mock provider response
      const mockSearchResults = [{
        id: '12345',
        description: 'Macaroni and cheese',
        calories: 350,
        nutrients: { protein: { value: 12, unit: 'g' } },
        score: 95
      }];

      foodService.provider.searchFood = jest.fn().mockResolvedValue(mockSearchResults);
      foodService.provider.calculateCalories = jest.fn().mockReturnValue({
        dish_name: 'Macaroni and cheese',
        servings: 2,
        calories_per_serving: 350,
        total_calories: 700,
        source: 'USDA FoodData Central'
      });

      const result = await foodService.getCalories('macaroni and cheese', 2);

      expect(result).toEqual({
        dish_name: 'Macaroni and cheese',
        servings: 2,
        calories_per_serving: 350,
        total_calories: 700,
        source: 'USDA FoodData Central',
        searchResults: 1,
        matchScore: 95,
        timestamp: expect.any(String)
      });

      expect(foodService.provider.searchFood).toHaveBeenCalledWith('macaroni and cheese', { pageSize: 10 });
    });

    test('should calculate calories for grilled salmon', async () => {
      const mockSearchResults = [{
        id: '67890',
        description: 'Grilled salmon',
        calories: 280,
        nutrients: { protein: { value: 25, unit: 'g' } },
        score: 92
      }];

      foodService.provider.searchFood = jest.fn().mockResolvedValue(mockSearchResults);
      foodService.provider.calculateCalories = jest.fn().mockReturnValue({
        dish_name: 'Grilled salmon',
        servings: 1,
        calories_per_serving: 280,
        total_calories: 280,
        source: 'USDA FoodData Central'
      });

      const result = await foodService.getCalories('grilled salmon', 1);

      expect(result.total_calories).toBe(280);
      expect(result.calories_per_serving).toBe(280);
    });

    test('should calculate calories for paneer butter masala', async () => {
      const mockSearchResults = [{
        id: '54321',
        description: 'Paneer butter masala',
        calories: 320,
        nutrients: { protein: { value: 15, unit: 'g' } },
        score: 88
      }];

      foodService.provider.searchFood = jest.fn().mockResolvedValue(mockSearchResults);
      foodService.provider.calculateCalories = jest.fn().mockReturnValue({
        dish_name: 'Paneer butter masala',
        servings: 3,
        calories_per_serving: 320,
        total_calories: 960,
        source: 'USDA FoodData Central'
      });

      const result = await foodService.getCalories('paneer butter masala', 3);

      expect(result.total_calories).toBe(960);
      expect(result.servings).toBe(3);
    });

    test('should handle non-existent dishes', async () => {
      foodService.provider.searchFood = jest.fn().mockResolvedValue([]);

      await expect(foodService.getCalories('nonexistentdish123', 1))
        .rejects
        .toThrow('Sorry, we could not find that dish in our database');
    });

    test('should handle zero servings', async () => {
      await expect(foodService.getCalories('pizza', 0))
        .rejects
        .toThrow('Servings must be a positive number');
    });

    test('should handle negative servings', async () => {
      await expect(foodService.getCalories('pizza', -1))
        .rejects
        .toThrow('Servings must be a positive number');
    });

    test('should handle multiple similar matches', async () => {
      const mockSearchResults = [
        {
          id: '111',
          description: 'Pizza, cheese',
          calories: 285,
          score: 95
        },
        {
          id: '222',
          description: 'Pizza, pepperoni',
          calories: 310,
          score: 90
        },
        {
          id: '333',
          description: 'Pizza, supreme',
          calories: 320,
          score: 88
        }
      ];

      foodService.provider.searchFood = jest.fn().mockResolvedValue(mockSearchResults);
      foodService.provider.calculateCalories = jest.fn().mockReturnValue({
        dish_name: 'Pizza, cheese',
        servings: 1,
        calories_per_serving: 285,
        total_calories: 285,
        source: 'USDA FoodData Central'
      });

      const result = await foodService.getCalories('pizza', 1);

      expect(result.searchResults).toBe(3);
      expect(result.calories_per_serving).toBe(285); // Should pick the best match
    });

    test('should validate maximum servings limit', async () => {
      await expect(foodService.getCalories('pasta', 51))
        .rejects
        .toThrow('Maximum 50 servings allowed');
    });

    test('should validate dish name length', async () => {
      const longDishName = 'a'.repeat(201);
      await expect(foodService.getCalories(longDishName, 1))
        .rejects
        .toThrow('Dish name too long (maximum 200 characters)');
    });

    test('should validate required parameters', async () => {
      await expect(foodService.getCalories('', 1))
        .rejects
        .toThrow('Dish name is required and must be a non-empty string');

      await expect(foodService.getCalories('pasta', null))
        .rejects
        .toThrow('Servings must be a positive number');
    });
  });

  describe('caching', () => {
    test('should cache results for repeated queries', async () => {
      const mockSearchResults = [{
        id: '12345',
        description: 'Test dish',
        calories: 200,
        score: 90
      }];

      foodService.provider.searchFood = jest.fn().mockResolvedValue(mockSearchResults);
      foodService.provider.calculateCalories = jest.fn().mockReturnValue({
        dish_name: 'Test dish',
        servings: 1,
        calories_per_serving: 200,
        total_calories: 200,
        source: 'USDA FoodData Central'
      });

      // First call
      await foodService.getCalories('test dish', 1);
      expect(foodService.provider.searchFood).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await foodService.getCalories('test dish', 1);
      expect(foodService.provider.searchFood).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    test('should clear cache properly', () => {
      const result = foodService.clearCache();
      expect(result).toEqual({ cleared: 'all' });
    });

    test('should clear cache with pattern', () => {
      // Add some mock cache entries
      foodService.cache.set('calories_pizza_1', { test: 'data1' });
      foodService.cache.set('calories_pasta_2', { test: 'data2' });
      foodService.cache.set('search_chicken', { test: 'data3' });

      const result = foodService.clearCache('pizza');
      expect(result.cleared).toBe(1);
      expect(result.pattern).toBe('pizza');

      // Verify other entries still exist
      expect(foodService.cache.get('calories_pasta_2')).toBeTruthy();
      expect(foodService.cache.get('search_chicken')).toBeTruthy();
    });
  });

  describe('searchFood', () => {
    test('should search for food items', async () => {
      const mockResults = [
        { id: '1', description: 'Apple', calories: 80 },
        { id: '2', description: 'Apple pie', calories: 320 }
      ];

      foodService.provider.searchFood = jest.fn().mockResolvedValue(mockResults);

      const results = await foodService.searchFood('apple');

      expect(results).toEqual(mockResults);
      expect(foodService.provider.searchFood).toHaveBeenCalledWith('apple', {});
    });

    test('should validate minimum query length', async () => {
      await expect(foodService.searchFood('a'))
        .rejects
        .toThrow('Search query must be at least 2 characters long');
    });
  });

  describe('error handling', () => {
    test('should handle provider errors gracefully', async () => {
      foodService.provider.searchFood = jest.fn().mockRejectedValue(new Error('USDA API error'));

      await expect(foodService.getCalories('test', 1))
        .rejects
        .toThrow('USDA API error');
    });
  });

  describe('getStatus', () => {
    test('should return service status', async () => {
      foodService.provider.getProviderInfo = jest.fn().mockReturnValue({
        name: 'USDA FoodData Central',
        version: 'v1'
      });
      
      foodService.provider.validateConnection = jest.fn().mockResolvedValue(true);

      const status = await foodService.getStatus();

      expect(status).toEqual({
        service: 'FoodService',
        status: 'healthy',
        provider: {
          name: 'USDA FoodData Central',
          version: 'v1'
        },
        cache: {
          keys: 0,
          stats: expect.any(Object)
        },
        timestamp: expect.any(String)
      });
    });

    test('should return unhealthy status when provider connection fails', async () => {
      foodService.provider.getProviderInfo = jest.fn().mockReturnValue({
        name: 'USDA FoodData Central'
      });
      
      foodService.provider.validateConnection = jest.fn().mockResolvedValue(false);

      const status = await foodService.getStatus();

      expect(status.status).toBe('unhealthy');
    });
  });
}); 