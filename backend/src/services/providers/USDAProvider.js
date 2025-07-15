const axios = require('axios');
const FoodDataProvider = require('../interfaces/FoodDataProvider');

class USDAProvider extends FoodDataProvider {
  constructor() {
    super();
    this.apiKey = process.env.USDA_API_KEY;
    this.baseUrl = process.env.USDA_API_BASE_URL || 'https://api.nal.usda.gov/fdc/v1';
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        api_key: this.apiKey
      }
    });
  }

  async searchFood(query, options = {}) {
    try {
      const params = {
        query: query.trim(),
        pageSize: options.pageSize || 25,
        pageNumber: options.pageNumber || 1,
        dataType: options.dataType || 'Survey (FNDDS),SR Legacy',
        sortBy: options.sortBy || 'dataType.keyword',
        sortOrder: options.sortOrder || 'asc'
      };

      const response = await this.axiosInstance.get('/foods/search', { params });
      
      return this._transformSearchResults(response.data);
    } catch (error) {
      this._handleError(error, 'searchFood');
    }
  }

  async getFoodDetails(foodId) {
    try {
      const response = await this.axiosInstance.get(`/food/${foodId}`, {
        params: {
          nutrients: '208' // Energy (calories) nutrient ID
        }
      });

      return this._transformFoodDetails(response.data);
    } catch (error) {
      this._handleError(error, 'getFoodDetails');
    }
  }

  calculateCalories(foodItem, servings) {
    if (!foodItem || !foodItem.calories) {
      throw new Error('Invalid food item or missing calorie data');
    }

    if (!servings || servings <= 0) {
      throw new Error('Servings must be a positive number');
    }

    const caloriesPerServing = foodItem.calories;
    const totalCalories = Math.round(caloriesPerServing * servings);

    return {
      dish_name: foodItem.description,
      servings: servings,
      calories_per_serving: caloriesPerServing,
      total_calories: totalCalories,
      source: this.getProviderInfo().name,
      ingredients: foodItem.ingredients || [],
      nutrients: foodItem.nutrients || {}
    };
  }

  getProviderInfo() {
    return {
      name: 'USDA FoodData Central',
      version: 'v1',
      description: 'United States Department of Agriculture Food Data Central API',
      website: 'https://fdc.nal.usda.gov/',
      rateLimit: '1000 requests per hour'
    };
  }

  async validateConnection() {
    try {
      if (!this.apiKey) {
        throw new Error('USDA API key not configured');
      }

      // Test with a simple search
      const response = await this.axiosInstance.get('/foods/search', {
        params: {
          query: 'apple',
          pageSize: 1
        }
      });

      return response.status === 200;
    } catch (error) {
      console.error('USDA API connection validation failed:', error.message);
      return false;
    }
  }

  _transformSearchResults(data) {
    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map(food => {
      const extractedCalories = this._extractCalories(food.foodNutrients);
      const extractedNutrients = this._extractNutrients(food.foodNutrients);
      
      // Debug logging for calorie extraction issues
      if (!extractedCalories && food.foodNutrients) {
        console.log(`🔍 Debug: No calories found for "${food.description}"`);
        console.log('Food nutrients structure:', food.foodNutrients.slice(0, 3)); // Log first 3 nutrients
        
        // Try to find energy manually
        const energyNutrient = food.foodNutrients?.find(n => 
          n.nutrient?.name?.toLowerCase().includes('energy') ||
          n.nutrientName?.toLowerCase().includes('energy') ||
          n.nutrientId === 208
        );
        
        if (energyNutrient) {
          console.log('Found energy nutrient:', energyNutrient);
        }
      }

      return {
        id: food.fdcId,
        description: food.description,
        dataType: food.dataType,
        calories: extractedCalories,
        nutrients: extractedNutrients,
        ingredients: food.ingredients || food.foodComponents || [],
        servingSize: this._extractServingSize(food.servingSize, food.servingSizeUnit),
        brandOwner: food.brandOwner,
        score: food.score
      };
    });
  }

  _transformFoodDetails(food) {
    return {
      id: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      calories: this._extractCalories(food.foodNutrients),
      nutrients: this._extractNutrients(food.foodNutrients),
      ingredients: food.ingredients || food.foodComponents || [],
      servingSize: this._extractServingSize(food.servingSize, food.servingSizeUnit),
      brandOwner: food.brandOwner,
      foodClass: food.foodClass,
      modifiedDate: food.modifiedDate,
      availableDate: food.availableDate
    };
  }

  _extractCalories(nutrients) {
    if (!nutrients) return null;

    // Handle array format (foodNutrients from API)
    if (Array.isArray(nutrients)) {
      const energyNutrient = nutrients.find(n => 
        n.nutrientId === 208 || 
        (n.nutrient && n.nutrient.id === 208) ||
        (n.nutrient && n.nutrient.name && n.nutrient.name.toLowerCase().includes('energy'))
      );

      if (energyNutrient) {
        return Math.round(energyNutrient.value || energyNutrient.amount || 0);
      }
    }

    // Handle object format (processed nutrients)
    if (typeof nutrients === 'object') {
      // Look for energy in various formats
      const energyKeys = ['energy', 'Energy', 'ENERGY'];
      
      for (const key of energyKeys) {
        if (nutrients[key] && nutrients[key].value) {
          return Math.round(nutrients[key].value);
        }
      }

      // Also check the direct nutrient format that appears in the debug logs
      if (nutrients.energy && typeof nutrients.energy === 'object') {
        return Math.round(nutrients.energy.value || nutrients.energy.amount || 0);
      }
    }

    return null;
  }

  _extractNutrients(nutrients) {
    if (!nutrients || !Array.isArray(nutrients)) return {};

    const nutrientMap = {};
    nutrients.forEach(n => {
      const nutrientName = n.nutrient ? n.nutrient.name : n.nutrientName;
      const nutrientValue = n.value || n.amount || 0;
      const nutrientUnit = n.nutrient ? n.nutrient.unitName : n.unitName;

      if (nutrientName) {
        nutrientMap[nutrientName.toLowerCase()] = {
          value: nutrientValue,
          unit: nutrientUnit
        };
      }
    });

    return nutrientMap;
  }

  _extractServingSize(size, unit) {
    if (!size) return null;
    return {
      amount: size,
      unit: unit || 'g'
    };
  }

  _handleError(error, method) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const statusCode = error.response?.status || 500;

    console.error(`USDA Provider ${method} error:`, {
      message: errorMessage,
      status: statusCode,
      method: method
    });

    if (statusCode === 401) {
      throw new Error('Invalid USDA API key');
    } else if (statusCode === 403) {
      throw new Error('USDA API access denied');
    } else if (statusCode === 429) {
      throw new Error('USDA API rate limit exceeded');
    } else if (statusCode >= 500) {
      throw new Error('USDA API service unavailable');
    } else {
      throw new Error(`USDA API error: ${errorMessage}`);
    }
  }
}

module.exports = USDAProvider; 