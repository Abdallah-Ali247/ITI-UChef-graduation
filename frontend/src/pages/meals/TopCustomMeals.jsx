import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const TopCustomMeals = () => {
  const [topMeals, setTopMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchTopMeals = async () => {
      try {
        setLoading(true);
        console.log('Fetching from:', `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/top-rated/`);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/top-rated/`
        );
        
        // Make sure we're dealing with an array
        if (Array.isArray(response.data)) {
          setTopMeals(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // If it's an object with results property (common DRF pattern)
          if (Array.isArray(response.data.results)) {
            setTopMeals(response.data.results);
          } else {
            // If it's some other object, convert to array or use empty array
            console.warn('Unexpected API response format:', response.data);
            setTopMeals([]);
          }
        } else {
          console.warn('Unexpected API response format:', response.data);
          setTopMeals([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching top custom meals:', err);
        setError('Failed to load top custom meals');
        setLoading(false);
      }
    };

    fetchTopMeals();
  }, []);

  const handleAddToCart = async (meal) => {
    if (!user) {
      toast.error('Please log in to add items to your cart');
      return;
    }

    try {
      // First, get the ingredients for the custom meal
      const ingredientsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/meals/custom-meals/${meal.id}/ingredients/`
      );
      
      const ingredients = ingredientsResponse.data;
      
      // Calculate total price based on ingredients
      const totalPrice = ingredients.reduce((sum, item) => {
        const ingredientPrice = item.ingredient_details.price_per_unit * item.quantity;
        return sum + ingredientPrice;
      }, 0);

      // Add to cart with the calculated price
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/orders/cart-items/`,
        {
          custom_meal: meal.id,
          quantity: 1,
          price: totalPrice,
          ingredients: ingredients.map(i => ({
            ingredient: i.ingredient,
            quantity: i.quantity
          }))
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success(`${meal.name} added to cart!`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add item to cart');
    }
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={`star ${rating >= star ? 'filled' : ''}`}>★</span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="loading">Loading top custom meals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="section-header text-center mb-12">
        <h1 className="section-title">Top 10 Custom Meals</h1>
        <p className="section-description">
          Discover the most delicious custom meals created by our community!
          Create your own custom meal and compete for the top spot.
        </p>
      </div>

      {topMeals.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No rated custom meals yet</h2>
          <p className="mb-6">Be the first to create and share a custom meal!</p>
          <Link to="/" className="btn btn-primary">
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="grid">
          {Array.isArray(topMeals) && topMeals.map((meal, index) => (
            <div key={meal.id} className="card">
              <div className="rank-badge" style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                zIndex: '1'
              }}>
                #{index + 1}
              </div>
              <img 
                src={meal.image || 'https://via.placeholder.com/300x200?text=Custom+Meal'} 
                alt={meal.name} 
                className="card-img"
              />
              <div className="card-body">
                <h2 className="card-title">{meal.name}</h2>
                <p className="card-creator" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                  Created by {meal.user_username}
                </p>
                
                <div className="reviews-summary" style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #eee' }}>
                  <div className="average-rating">
                    <span className="rating-number">{meal.avg_rating ? meal.avg_rating.toFixed(1) : '0'}</span>
                    {renderStars(meal.avg_rating)}
                    <span className="review-count">
                      ({meal.review_count} {meal.review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                </div>
                
                <p className="card-text">
                  {meal.description ? (meal.description.length > 100 ? `${meal.description.substring(0, 100)}...` : meal.description) : 'No description provided'}
                </p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <Link to={`/meals/custom/${meal.id}`} className="btn btn-outline">
                    View Details
                  </Link>
                  <button 
                    onClick={() => handleAddToCart(meal)} 
                    className="btn btn-primary"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="section-cta text-center" style={{ marginTop: '3rem', padding: '2rem', backgroundColor: 'var(--light-color)', borderRadius: 'var(--border-radius)' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Want to compete?</h2>
        <p style={{ marginBottom: '1.5rem' }}>
          Create your own custom meal and share it with the community to see if it can reach the top!
        </p>
        <Link to="/restaurants" className="btn btn-primary">
          Find a Restaurant
        </Link>
      </div>
    </div>
  );
};

export default TopCustomMeals;
