import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { fetchUserOrders } from '../../store/slices/orderSlice';
import { fetchCustomMeals } from '../../store/slices/mealSlice';
import { addToCart } from '../../store/slices/cartSlice';

const API_URL = 'http://localhost:8000/api';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading: authLoading } = useSelector(state => state.auth);
  const { orders, loading: ordersLoading } = useSelector(state => state.orders);
  const { customMeals, loading: mealsLoading } = useSelector(state => state.meals);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loadingMealId, setLoadingMealId] = useState(null);
  
  const handleAddToCart = async (meal) => {
    // Show loading indicator
    setLoadingMealId(meal.id);
    
    try {
      // Fetch the custom meal details to get complete information including restaurant
      const token = localStorage.getItem('token');
      
      // First, fetch the custom meal details to get the base_meal information
      const mealResponse = await axios.get(`${API_URL}/meals/custom-meals/${meal.id}/`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      
      const mealDetails = mealResponse.data;
      
      // Get the restaurant information from the base meal or directly from the custom meal
      let restaurantId;
      let restaurantName = 'Restaurant';
      
      if (mealDetails.base_meal) {
        // If we have a base meal, fetch its details to get the restaurant
        try {
          const baseMealResponse = await axios.get(`${API_URL}/meals/meals/${mealDetails.base_meal}/`, {
            headers: token ? { Authorization: `Token ${token}` } : {}
          });
          
          restaurantId = baseMealResponse.data.restaurant;
          restaurantName = baseMealResponse.data.restaurant_name || 'Restaurant';
        } catch (error) {
          console.warn('Could not fetch base meal details:', error);
          // Continue with fallback approach
        }
      }
      
      // If we still don't have a restaurant ID, check if it's directly on the meal
      if (!restaurantId && mealDetails.restaurant) {
        restaurantId = mealDetails.restaurant;
        restaurantName = mealDetails.restaurant_name || 'Restaurant';
      }
      
      // If we still don't have a restaurant ID, fetch the first available restaurant
      if (!restaurantId) {
        try {
          // Get the first restaurant from the API
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
          throw new Error('Could not determine the restaurant for this custom meal');
        }
      }
      
      // Fetch the ingredients for this custom meal to calculate the correct price
      const ingredientsResponse = await axios.get(`${API_URL}/meals/custom-meals/${meal.id}/ingredients/`, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      
      const ingredients = ingredientsResponse.data;
      
      // Calculate the total price based on ingredients
      let totalPrice = 0;
      if (ingredients && ingredients.length > 0) {
        totalPrice = ingredients.reduce((sum, item) => {
          return sum + (item.ingredient_details.price_per_unit * item.quantity);
        }, 0);
      } else {
        // Fallback to base_price if ingredients can't be fetched
        totalPrice = meal.base_price || 0;
      }
      
      console.log('Adding custom meal to cart with restaurant:', { restaurantId, restaurantName });
      
      // Add the custom meal to cart
      dispatch(addToCart({
        item: {
          customMealId: meal.id,
          name: meal.name,
          price: totalPrice,
          type: 'custom',
          quantity: 1,
          image: meal.image,
          specialInstructions: meal.cooking_instructions || '',
          ingredients: ingredients // Store the ingredients in the cart item
        },
        restaurantId,
        restaurantName
      }));
      
      // Show success message and navigate to cart
      alert(`${meal.name} added to cart!`);
      navigate('/cart');
    } catch (error) {
      console.error('Error adding custom meal to cart:', error);
      alert('Failed to add meal to cart. Please try again.');
    } finally {
      setLoadingMealId(null);
    }
  };
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (activeTab === 'orders') {
      dispatch(fetchUserOrders());
    } else if (activeTab === 'custom-meals') {
      dispatch(fetchCustomMeals({ userId: user.id }));
    }
  }, [dispatch, isAuthenticated, navigate, activeTab, user]);
  
  if (authLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="alert alert-warning">
        User not found. Please log in again.
      </div>
    );
  }
  
  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      
      <div className="menu-tabs" style={{ marginTop: '2rem' }}>
        <div 
          className={`menu-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </div>
        <div 
          className={`menu-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Order History
        </div>
        <div 
          className={`menu-tab ${activeTab === 'custom-meals' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom-meals')}
        >
          My Custom Meals
        </div>
      </div>
      
      <div className="tab-content" style={{ marginTop: '2rem' }}>
        {activeTab === 'profile' && (
          <div className="profile-info">
            <div className="card">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                  <div 
                    style={{ 
                      width: '100px', 
                      height: '100px', 
                      borderRadius: '50%', 
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '1.5rem',
                      fontSize: '2rem',
                      color: '#666'
                    }}
                  >
                    {user.profile_picture ? (
                      <img 
                        src={user.profile_picture} 
                        alt={user.username} 
                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      user.first_name.charAt(0) + user.last_name.charAt(0)
                    )}
                  </div>
                  
                  <div>
                    <h2>{user.first_name} {user.last_name}</h2>
                    <p>@{user.username}</p>
                    <p>
                      Account Type: {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                    </p>
                  </div>
                </div>
                
                <div className="user-details">
                  <div className="detail-item" style={{ marginBottom: '1rem' }}>
                    <h3>Email</h3>
                    <p>{user.email}</p>
                  </div>
                  
                  <div className="detail-item" style={{ marginBottom: '1rem' }}>
                    <h3>Phone Number</h3>
                    <p>{user.phone_number || 'Not provided'}</p>
                  </div>
                  
                  <div className="detail-item" style={{ marginBottom: '1rem' }}>
                    <h3>Address</h3>
                    <p>{user.address || 'Not provided'}</p>
                  </div>
                  
                  {user.profile && (
                    <>
                      <div className="detail-item" style={{ marginBottom: '1rem' }}>
                        <h3>Bio</h3>
                        <p>{user.profile.bio || 'No bio provided'}</p>
                      </div>
                      
                      <div className="detail-item" style={{ marginBottom: '1rem' }}>
                        <h3>Favorite Cuisine</h3>
                        <p>{user.profile.favorite_cuisine || 'Not specified'}</p>
                      </div>
                    </>
                  )}
                </div>
                
                <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="orders-tab">
            {ordersLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="no-results" style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>No Orders Yet</h3>
                <p>You haven't placed any orders yet.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3>Order #{order.id}</h3>
                          <p>{order.restaurant_name}</p>
                          <p><small>{new Date(order.created_at).toLocaleDateString()}</small></p>
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                          <div className={`order-status status-${order.status}`} style={{ marginBottom: '0.5rem' }}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </div>
                          <div>${order.total_price}</div>
                        </div>
                      </div>
                      
                      <button 
                        className="btn btn-outline" 
                        style={{ marginTop: '1rem' }}
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'custom-meals' && (
          <div className="custom-meals-tab">
            {mealsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : customMeals.length === 0 ? (
              <div className="no-results" style={{ textAlign: 'center', padding: '2rem' }}>
                <h3>No Custom Meals Yet</h3>
                <p>You haven't created any custom meals yet.</p>
              </div>
            ) : (
              <div className="grid">
                {customMeals.map(meal => (
                  <div key={meal.id} className="card">
                    <div className="card-body">
                      <h3>{meal.name}</h3>
                      <p>{meal.description || 'No description provided'}</p>
                      
                      {meal.base_meal_details && (
                        <p><small>Based on: {meal.base_meal_details.name}</small></p>
                      )}
                      
                      <p>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '0.25rem 0.5rem', 
                          backgroundColor: meal.is_public ? '#d4edda' : '#f8f9fa',
                          color: meal.is_public ? '#155724' : '#6c757d',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          marginTop: '0.5rem'
                        }}>
                          {meal.is_public ? 'Public' : 'Private'}
                        </span>
                      </p>
                      
                      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn btn-outline"
                          onClick={() => navigate(`/meals/custom/${meal.id}`)}
                        >
                          View Details
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleAddToCart(meal)}
                          disabled={loadingMealId === meal.id}
                        >
                          {loadingMealId === meal.id ? 'Adding...' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
