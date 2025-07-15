import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { calorieAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const [dishName, setDishName] = useState('');
  const [servings, setServings] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [popularDishes, setPopularDishes] = useState([]);

  useEffect(() => {
    loadPopularDishes();
  }, []);

  const loadPopularDishes = async () => {
    try {
      const response = await calorieAPI.getPopularDishes();
      setPopularDishes(response.data.data.dishes);
    } catch (error) {
      console.error('Failed to load popular dishes:', error);
    }
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

    try {
      const response = await calorieAPI.getCalories({
        dish_name: dishName.trim(),
        servings: Number(servings)
      });

      setResult(response.data.data);
      toast.success(`Found calorie information for ${dishName}`);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to get calorie information';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePopularDishClick = (dish) => {
    setDishName(dish);
    setResult(null);
  };

  const handleReset = () => {
    setDishName('');
    setServings(1);
    setResult(null);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="section text-center">
        <div className="container container-md">
          <h1 className="text-xl font-bold mb-4 text-primary">
            Track Calories with Precision
          </h1>
          <p className="text-lg text-secondary mb-6">
            Get accurate calorie information for your favorite dishes using USDA food data.
            Simply enter a dish name and serving size to get started.
          </p>
        </div>
      </section>

      {/* Calorie Calculator */}
      <section className="section-sm">
        <div className="container container-sm">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Calorie Calculator</h2>
              <p className="card-subtitle">
                Enter a dish name and number of servings to calculate calories
              </p>
            </div>

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
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g., chicken biryani, grilled salmon, pasta alfredo"
                  disabled={isLoading}
                />
                <div className="form-help">
                  Try to be specific for better results
                </div>
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
                <div className="form-help">
                  Maximum 50 servings allowed
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !dishName.trim()}
                >
                  {isLoading ? 'Calculating...' : 'Calculate Calories'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Reset
                </button>
              </div>
            </form>

            {isLoading && (
              <div className="mt-6">
                <LoadingSpinner message="Getting calorie information..." />
              </div>
            )}

            {result && (
              <div className="mt-6">
                <div className="alert alert-success">
                  <h3 className="font-semibold mb-2">✅ Calorie Information</h3>
                  <div className="grid grid-2 gap-4">
                    <div>
                      <p><strong>Dish:</strong> {result.dish_name}</p>
                      <p><strong>Servings:</strong> {result.servings}</p>
                      <p><strong>Source:</strong> {result.source}</p>
                    </div>
                    <div>
                      <p className="text-lg">
                        <strong>Calories per serving:</strong>{' '}
                        <span className="text-primary font-bold">
                          {result.calories_per_serving}
                        </span>
                      </p>
                      <p className="text-xl">
                        <strong>Total calories:</strong>{' '}
                        <span className="text-success font-bold">
                          {result.total_calories}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  {result.searchResults && (
                    <div className="mt-3 text-sm text-secondary">
                      Found {result.searchResults} matching results
                      {result.matchScore && ` (match score: ${result.matchScore}%)`}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Popular Dishes */}
      {popularDishes.length > 0 && (
        <section className="section-sm">
          <div className="container">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Popular Dishes
            </h2>
            <p className="text-center text-secondary mb-6">
              Click on any dish below to calculate its calories
            </p>
            
            <div className="grid grid-3">
              {popularDishes.map((dish, index) => (
                <button
                  key={index}
                  onClick={() => handlePopularDishClick(dish)}
                  className="btn btn-secondary text-left"
                  disabled={isLoading}
                >
                  🍽️ {dish}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <h2 className="text-xl font-semibold mb-6 text-center">
            Why Choose Our Calorie Tracker?
          </h2>
          
          <div className="grid grid-3">
            <div className="card text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">Accurate Data</h3>
              <p className="text-secondary">
                Powered by USDA FoodData Central for reliable nutrition information
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold mb-2">Fast & Easy</h3>
              <p className="text-secondary">
                Get calorie information instantly with our simple interface
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2">Privacy Focused</h3>
              <p className="text-secondary">
                Your data is protected and we respect your privacy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section text-center">
        <div className="container container-sm">
          <h2 className="text-xl font-semibold mb-4">
            Ready to Track Your Nutrition?
          </h2>
          <p className="text-secondary mb-6">
            Create an account to save your favorite dishes and track your nutrition over time.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn btn-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 