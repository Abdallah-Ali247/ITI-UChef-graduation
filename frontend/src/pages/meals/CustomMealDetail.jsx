import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { addToCart } from '../../store/slices/cartSlice';
import ReviewList from '../../components/reviews/ReviewList';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:8000/api';

const CustomMealDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  const [customMeal, setCustomMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const [savingPublicStatus, setSavingPublicStatus] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);
  
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
        
        const mealData = mealResponse.data;
        setCustomMeal(mealData);
        setIsPublic(mealData.is_public);
        
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
  
  const handlePublicToggle = async () => {
    if (!customMeal || !isAuthenticated) return;
    
    // Only the creator of the meal can change its public status
    if (customMeal.user !== user.id) {
      alert('Only the creator of this custom meal can change its visibility.');
      return;
    }
    
    try {
      setSavingPublicStatus(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `${API_URL}/meals/custom-meals/${id}/`, 
        { is_public: !isPublic },
        { headers: { Authorization: `Token ${token}` } }
      );
      
      setIsPublic(response.data.is_public);
      setCustomMeal({...customMeal, is_public: response.data.is_public});
      
      alert(response.data.is_public 
        ? 'Your custom meal is now public and eligible for the Top Custom Meals page!' 
        : 'Your custom meal is now private.');
    } catch (err) {
      console.error('Error updating meal visibility:', err);
      alert('Failed to update meal visibility. Please try again.');
    } finally {
      setSavingPublicStatus(false);
    }
  };
  
  const checkIngredientAvailability = async () => {
    if (!customMeal) return false;
    
    try {
      setCheckingAvailability(true);
      setAvailabilityError(null);
      
      const response = await axios.get(
        `${API_URL}/meals/custom-meals/${customMeal.id}/check_availability/`,
        { params: { quantity } }
      );
      
      if (!response.data.is_available) {
        const unavailableIngredients = response.data.unavailable_ingredients;
        let errorMessage = 'Cannot add to cart due to unavailable ingredients:\n';
        
        unavailableIngredients.forEach(item => {
          errorMessage += `- ${item.name} is ${!item.available ? 'out of stock' : 'low in stock'}. `;
          errorMessage += `Required: ${item.required}, Available: ${item.in_stock}\n`;
        });
        
        setAvailabilityError(errorMessage);
        toast.error('Some ingredients are out of stock');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking ingredient availability:', error);
      setAvailabilityError('Failed to check ingredient availability');
      toast.error('Failed to check ingredient availability');
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };
  
  const handleAddToCart = async () => {
    if (!customMeal) return;
    
    // First check ingredient availability
    const ingredientsAvailable = await checkIngredientAvailability();
    if (!ingredientsAvailable) {
      return;
    }
    
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
          toast.error('Could not determine the restaurant for this custom meal. Please try again.');
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
          specialInstructions: customMeal.cooking_instructions || '',
          restaurant: restaurantId // Add restaurant ID to the item itself as well
        },
        restaurantId,
        restaurantName
      }));
      
      // Show success message and navigate to cart
      toast.success(`${customMeal.name} added to cart!`);
      navigate('/cart');
    } catch (error) {
      console.error('Error adding custom meal to cart:', error);
      toast.error('Failed to add meal to cart. Please try again.');
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
          
          {/* Public/Private toggle - only shown to the meal creator */}
          {isAuthenticated && user && customMeal && customMeal.user === user.id && (
            <div className="visibility-toggle" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--accent-light)', borderRadius: '8px' }}>
              <h3>Meal Visibility</h3>
              <p>
                {isPublic 
                  ? 'This meal is currently public and can be seen by all users. It is eligible for the Top Custom Meals page.'
                  : 'This meal is currently private and can only be seen by you. Make it public to share with others and compete for the Top Custom Meals page!'}
              </p>
              <button 
                className={`btn ${isPublic ? 'btn-outline' : 'btn-primary'}`}
                onClick={handlePublicToggle}
                disabled={savingPublicStatus}
                style={{ marginTop: '0.5rem' }}
              >
                {savingPublicStatus ? 'Saving...' : (isPublic ? 'Make Private' : 'Make Public')}
              </button>
            </div>
          )}
          
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
          
          <div className="order-actions" style={{ marginTop: '2rem' }}>
            <div className="quantity-selector" style={{ marginBottom: '1rem' }}>
              <label htmlFor="quantity" style={{ display: 'block', marginBottom: '0.5rem' }}>Quantity:</label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                style={{ width: '80px', padding: '0.5rem' }}
              />
            </div>
            
            {availabilityError && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                {availabilityError}
              </div>
            )}
            
            <button 
              className="btn btn-primary" 
              onClick={handleAddToCart}
              style={{ width: '100%', marginBottom: '1rem' }}
              disabled={checkingAvailability}
            >
              {checkingAvailability ? 'Checking Availability...' : `Add to Cart - $${(totalPrice * quantity).toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
      
      <div className="custom-meal-reviews" style={{ marginTop: '3rem' }}>
        <h2>Customer Reviews</h2>
        <ReviewList type="custom_meal" itemId={id} />
      </div>
    </div>
  );
};

export default CustomMealDetail;
