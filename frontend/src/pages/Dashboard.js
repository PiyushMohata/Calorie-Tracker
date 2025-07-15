import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../App';
import { calorieAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [dishName, setDishName] = useState('');
  const [servings, setServings] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showBatchCalculator, setShowBatchCalculator] = useState(false);
  const [batchDishes, setBatchDishes] = useState([{ dish_name: '', servings: 1 }]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 5)); // Show only last 5
  };

  const saveToRecentSearches = (dishName, result) => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const newSearch = {
      dish_name: dishName,
      calories_per_serving: result.calories_per_serving,
      timestamp: new Date().toISOString()
    };
    
    // Remove if already exists and add to beginning
    const filtered = recent.filter(item => item.dish_name.toLowerCase() !== dishName.toLowerCase());
    const updated = [newSearch, ...filtered].slice(0, 10); // Keep only 10 most recent
    
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    loadRecentSearches();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dishName.trim()) {
      toast.error('Please enter a dish name');
      return;
    }

    if (servings <= 0) {
      toast.error('Please enter a valid number of servings');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSearchResults([]);

    try {
      const response = await calorieAPI.getCalories({
        dish_name: dishName.trim(),
        servings: Number(servings)
      });

      const resultData = response.data.data;
      setResult(resultData);
      saveToRecentSearches(dishName.trim(), resultData);
      toast.success(`Found calorie information for ${dishName}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to get calorie information';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const searchTimeout = useRef(null);

  const handleSearch = (query) => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await calorieAPI.searchFood(query, { pageSize: 5 });
        setSearchResults(response.data.data.results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500); // Debounce time
  };


  const handleSearchResultClick = (food) => {
    setDishName(food.description);
    setSearchResults([]);
    setResult(null);
  };

  const handleRecentSearchClick = (recent) => {
    setDishName(recent.dish_name);
    setServings(1);
    setResult(null);
    setSearchResults([]);
  };

  const handleBatchCalculation = async () => {
    const validDishes = batchDishes.filter(dish => dish.dish_name.trim() && dish.servings > 0);
    
    if (validDishes.length === 0) {
      toast.error('Please add at least one valid dish');
      return;
    }

    setIsLoading(true);
    try {
      const response = await calorieAPI.getBatchCalories(validDishes);
      const { results, errors, summary } = response.data.data;
      
      if (results.length > 0) {
        const totalCalories = results.reduce((sum, item) => sum + item.total_calories, 0);
        toast.success(`Calculated calories for ${summary.successful} dishes. Total: ${totalCalories} calories`);
        
        // Show detailed results
        setResult({
          batch: true,
          results,
          errors,
          summary,
          totalCalories
        });
      }
      
      if (errors.length > 0) {
        toast.warning(`${errors.length} dishes could not be processed`);
      }
    } catch (error) {
      toast.error('Failed to calculate batch calories');
    } finally {
      setIsLoading(false);
    }
  };

  const addBatchDish = () => {
    setBatchDishes([...batchDishes, { dish_name: '', servings: 1 }]);
  };

  const removeBatchDish = (index) => {
    if (batchDishes.length > 1) {
      setBatchDishes(batchDishes.filter((_, i) => i !== index));
    }
  };

  const updateBatchDish = (index, field, value) => {
    const updated = batchDishes.map((dish, i) => 
      i === index ? { ...dish, [field]: value } : dish
    );
    setBatchDishes(updated);
  };

  return (
    <div className="dashboard-page">
      {/* Welcome Section */}
      <section className="section-sm">
        <div className="container">
          <div className="card">
            <h1 className="text-xl font-bold mb-2">
              Welcome back, {user?.firstName}! 👋
            </h1>
            <p className="text-secondary">
              Ready to track some calories? Use the enhanced calculator below to get detailed nutrition information.
            </p>
          </div>
        </div>
      </section>

      {/* Main Calculator */}
      <section className="section-sm">
        <div className="container">
          <div className="grid grid-2 gap-6">
            {/* Calculator Form */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Enhanced Calorie Calculator</h2>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowBatchCalculator(false)}
                    className={`btn btn-sm ${!showBatchCalculator ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Single Dish
                  </button>
                  <button
                    onClick={() => setShowBatchCalculator(true)}
                    className={`btn btn-sm ${showBatchCalculator ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    Batch Calculator
                  </button>
                </div>
              </div>

              {!showBatchCalculator ? (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="dishName" className="form-label">
                      Dish Name
                    </label>
                    <input
                      type="text"
                      id="dishName"
                      className="form-input"
                      value={dishName}
                      onChange={(e) => {
                        setDishName(e.target.value);
                        handleSearch(e.target.value);
                      }}
                      placeholder="e.g., chicken biryani, grilled salmon"
                      disabled={isLoading}
                    />
                    
                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="search-results mt-2 border border-gray-200 rounded-md bg-white shadow-md max-h-40 overflow-y-auto">
                        {searchResults.map((food, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSearchResultClick(food)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium">{food.description}</div>
                            {food.calories && (
                              <div className="text-sm text-secondary">
                                ~{food.calories} calories per serving
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {isSearching && (
                      <div className="text-sm text-secondary mt-1">Searching...</div>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="servings" className="form-label">
                      Number of Servings
                    </label>
                    <input
                      type="number"
                      id="servings"
                      className="form-input"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                      min="0.1"
                      max="50"
                      step="0.1"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading || !dishName.trim()}
                  >
                    {isLoading ? 'Calculating...' : 'Calculate Calories'}
                  </button>
                </form>
              ) : (
                /* Batch Calculator */
                <div className="batch-calculator">
                  <div className="mb-4">
                    <p className="text-sm text-secondary mb-3">
                      Calculate calories for multiple dishes at once (max 10 dishes)
                    </p>
                    
                    {batchDishes.map((dish, index) => (
                      <div key={index} className="grid grid-3 gap-2 mb-3 items-end">
                        <div className="form-group mb-0">
                          <label className="form-label text-sm">Dish Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={dish.dish_name}
                            onChange={(e) => updateBatchDish(index, 'dish_name', e.target.value)}
                            placeholder="Enter dish name"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="form-group mb-0">
                          <label className="form-label text-sm">Servings</label>
                          <input
                            type="number"
                            className="form-input"
                            value={dish.servings}
                            onChange={(e) => updateBatchDish(index, 'servings', Number(e.target.value))}
                            min="0.1"
                            max="50"
                            step="0.1"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="flex gap-1">
                          {batchDishes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBatchDish(index)}
                              className="btn btn-sm btn-danger"
                              disabled={isLoading}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        onClick={addBatchDish}
                        className="btn btn-secondary btn-sm"
                        disabled={isLoading || batchDishes.length >= 10}
                      >
                        Add Dish
                      </button>
                      <button
                        type="button"
                        onClick={handleBatchCalculation}
                        className="btn btn-primary"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Calculating...' : 'Calculate All'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Searches */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Searches</h3>
                <p className="card-subtitle">Click to reuse previous searches</p>
              </div>

              {recentSearches.length > 0 ? (
                <div className="space-y-2">
                  {recentSearches.map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(recent)}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                      disabled={isLoading}
                    >
                      <div className="flex-between">
                        <div>
                          <div className="font-medium">{recent.dish_name}</div>
                          <div className="text-sm text-secondary">
                            {recent.calories_per_serving} cal/serving
                          </div>
                        </div>
                        <div className="text-xs text-secondary">
                          {new Date(recent.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-secondary py-4">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>No recent searches yet</p>
                  <p className="text-sm">Your search history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Loading Spinner */}
      {isLoading && (
        <section className="section-sm">
          <div className="container">
            <LoadingSpinner message="Processing your request..." />
          </div>
        </section>
      )}

      {/* Results Section */}
      {result && (
        <section className="section-sm">
          <div className="container">
            {result.batch ? (
              /* Batch Results */
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Batch Calculation Results</h3>
                  <div className="text-lg font-semibold text-success">
                    Total Calories: {result.totalCalories}
                  </div>
                </div>

                {result.results.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 text-success">✅ Successful Calculations</h4>
                    <div className="grid gap-3">
                      {result.results.map((item, index) => (
                        <div key={index} className="border border-green-200 rounded-md p-3 bg-green-50">
                          <div className="flex-between">
                            <div>
                              <div className="font-medium">{item.dish_name}</div>
                              <div className="text-sm text-secondary">
                                {item.servings} serving(s) × {item.calories_per_serving} calories
                              </div>
                            </div>
                            <div className="text-lg font-bold text-success">
                              {item.total_calories} cal
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.errors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-error">❌ Failed Calculations</h4>
                    <div className="grid gap-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="border border-red-200 rounded-md p-3 bg-red-50">
                          <div className="font-medium">{error.dish.dish_name}</div>
                          <div className="text-sm text-error">{error.error}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Single Result */
              <div className="card">
                <div className="alert alert-success">
                  <h3 className="font-semibold mb-3">🎯 Calorie Information</h3>
                  <div className="grid grid-2 gap-6">
                    <div>
                      <p><strong>Dish:</strong> {result.dish_name}</p>
                      <p><strong>Servings:</strong> {result.servings}</p>
                      <p><strong>Source:</strong> {result.source}</p>
                      {result.searchResults && (
                        <p><strong>Search Results:</strong> {result.searchResults} found</p>
                      )}
                    </div>
                    <div>
                      <p className="text-lg mb-2">
                        <strong>Calories per serving:</strong>{' '}
                        <span className="text-primary font-bold text-xl">
                          {result.calories_per_serving}
                        </span>
                      </p>
                      <p className="text-xl">
                        <strong>Total calories:</strong>{' '}
                        <span className="text-success font-bold text-2xl">
                          {result.total_calories}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {result.nutrients && Object.keys(result.nutrients).length > 0 && (
                    <div className="mt-4">
                      <details className="mt-3">
                        <summary className="cursor-pointer font-medium text-primary">
                          View Additional Nutrients
                        </summary>
                        <div className="mt-2 grid grid-3 gap-2 text-sm">
                          {Object.entries(result.nutrients).slice(0, 6).map(([name, data]) => (
                            <div key={name} className="bg-white p-2 rounded border">
                              <div className="font-medium capitalize">{name}</div>
                              <div className="text-secondary">
                                {data.value} {data.unit}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard; 