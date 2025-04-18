import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { addToCart } from '../../store/slices/cartSlice';

const API_URL = 'http://localhost:8000/api';

const CustomMealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth);
  
  const [customMeal, setCustomMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const fetchCustomMeal = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Fetch the custom meal details
        const mealResponse = await axios.get(`${API_URL}/meals/custom-meals/${id}/`, {
          headers: token ? { Authorization: `Token ${token}` } : {}
        });
        
        setCustomMeal(mealResponse.data);
        
        // Fetch the ingredients for this custom meal
        const ingredientsResponse = await axios.get(`${API_URL}/meals/custom-meals/${id}/ingredients/`, {
          headers: token ? { Authorization: `Token ${token}` } : {}
        });
        
        setIngredients(ingredientsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching custom meal:', err);
        setError(err.response?.data || 'Failed to load custom meal');
        setLoading(false);
      }
    };
    
    fetchCustomMeal();
  }, [id, isAuthenticated, navigate]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };
  
  const handleAddToCart = async () => {
    if (!customMeal) return;
    
    // Calculate total price based on ingredients
    const totalPrice = ingredients.reduce((sum, item) => {
      return sum + (item.ingredient_details.price_per_unit * item.quantity);
    }, 0);
    
    try {
      // Get the restaurant information from the base meal or directly from the custom meal
      let restaurantId = customMeal.restaurant;
      let restaurantName = customMeal.restaurant_name || 'Restaurant';
      
      // If we don't have a restaurant ID and we have a base meal, try to get restaurant from there
      if (!restaurantId && customMeal.base_meal) {
        try {
          const token = localStorage.getItem('token');
          const baseMealResponse = await axios.get(`${API_URL}/meals/meals/${customMeal.base_meal}/`, {
            headers: token ? { Authorization: `Token ${token}` } : {}
          });
          
          restaurantId = baseMealResponse.data.restaurant;
          restaurantName = baseMealResponse.data.restaurant_name || 'Restaurant';
        } catch (error) {
          console.warn('Could not fetch base meal details:', error);
          // Continue with fallback approach
        }
      }
      
      // If we still don't have a restaurant ID, fetch the first available restaurant
      if (!restaurantId) {
        try {
          // Get the first restaurant from the API
          const token = localStorage.getItem('token');
          const restaurantsResponse = await axios.get(`${API_URL}/restaurants/restaurants/`, {
            headers: token ? { Authorization: `Token ${token}` } : {}
          });
          
          if (restaurantsResponse.data && restaurantsResponse.data.length > 0) {
            const firstRestaurant = restaurantsResponse.data[0];
            restaurantId = firstRestaurant.id;
            restaurantName = firstRestaurant.name;
            console.log('Using default restaurant:', restaurantName);
          } else {
            throw new Error('No restaurants available');
          }
        } catch (error) {
          console.error('Error fetching restaurants:', error);
          alert('Could not determine the restaurant for this custom meal. Please try again.');
          return;
        }
      }
      
      dispatch(addToCart({
        item: {
          customMealId: customMeal.id,
          name: customMeal.name,
          price: totalPrice || customMeal.base_price || 0,
          type: 'custom',
          quantity,
          image: customMeal.image,
          specialInstructions: customMeal.cooking_instructions || ''
        },
        restaurantId,
        restaurantName
      }));
      
      // Show success message and navigate to cart
      alert(`${customMeal.name} added to cart!`);
      navigate('/cart');
    } catch (error) {
      console.error('Error adding custom meal to cart:', error);
      alert('Failed to add meal to cart. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger">
        {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
      </div>
    );
  }
  
  if (!customMeal) {
    return (
      <div className="alert alert-warning">
        Custom meal not found.
      </div>
    );
  }
  
  // Calculate total price based on ingredients
  const totalPrice = ingredients.reduce((sum, item) => {
    return sum + (item.ingredient_details.price_per_unit * item.quantity);
  }, 0);
  
  return (
    <div className="custom-meal-detail-page">
      <div className="breadcrumb" style={{ marginBottom: '1rem' }}>
        <Link to="/profile">My Profile</Link> &gt; 
        <Link to="/profile" onClick={() => document.querySelector('.menu-tab:nth-child(3)').click()}> My Custom Meals</Link> &gt; 
        <span> {customMeal.name}</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="meal-image-container">
          <img 
            src={customMeal.image || 'https://via.placeholder.com/500x400?text=Custom+Meal'} 
            alt={customMeal.name} 
            style={{ width: '100%', borderRadius: 'var(--border-radius)', objectFit: 'cover' }}
          />
        </div>
        
        <div className="meal-details">
          <h1>{customMeal.name}</h1>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Custom Meal • Created on {new Date(customMeal.created_at).toLocaleDateString()}
          </p>
          
          <div className="meal-price" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '1rem 0' }}>
            ${totalPrice.toFixed(2)}
          </div>
          
          <div className="meal-description" style={{ marginBottom: '2rem' }}>
            <h3>Description</h3>
            <p>{customMeal.description || 'No description provided.'}</p>
          </div>
          
          {customMeal.cooking_instructions && (
            <div className="cooking-instructions" style={{ marginBottom: '2rem' }}>
              <h3>Cooking Instructions</h3>
              <p>{customMeal.cooking_instructions}</p>
            </div>
          )}
          
          {ingredients.length > 0 && (
            <div className="meal-ingredients" style={{ marginBottom: '2rem' }}>
              <h3>Ingredients</h3>
              <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
                {ingredients.map(item => (
                  <li key={item.id}>
                    {item.ingredient_details.name} ({item.quantity} {item.ingredient_details.unit})
                    <span> - ${(item.ingredient_details.price_per_unit * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="order-options">
            <div className="form-group">
              <label htmlFor="quantity" className="form-label">Quantity</label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="form-control"
                style={{ width: '100px' }}
              />
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={handleAddToCart}
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Add to Cart - ${(totalPrice * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomMealDetail;
