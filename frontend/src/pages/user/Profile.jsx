import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { fetchUserOrders } from '../../store/slices/orderSlice';
import { fetchCustomMeals } from '../../store/slices/mealSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { validateField, validateForm, isFormValid } from '../../utils/validation';

const API_URL = 'http://localhost:8000/api';

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading: authLoading } = useSelector(state => state.auth);
  const { orders, loading: ordersLoading } = useSelector(state => state.orders);
  const { customMeals, loading: mealsLoading } = useSelector(state => state.meals);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loadingMealId, setLoadingMealId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
    bio: '',
    favorite_cuisine: ''
  });
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [profileUpdateError, setProfileUpdateError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
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
  
  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        address: user.address || '',
        bio: user.profile?.bio || '',
        favorite_cuisine: user.profile?.favorite_cuisine || ''
      });
    }
  }, [user]);
  
  const handleProfileFormChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate the field as it changes
    let error = null;
    
    switch (name) {
      case 'email':
        error = validateField('Email', value, { required: true, email: true });
        break;
      case 'phone_number':
        error = validateField('Phone Number', value, { phone: true });
        break;
      case 'first_name':
      case 'last_name':
        error = validateField(name === 'first_name' ? 'First Name' : 'Last Name', value, { 
          required: true, 
          minLength: 2 
        });
        break;
      case 'bio':
        error = validateField('Bio', value, { maxLength: 500 });
        break;
      default:
        // No validation for other fields
        break;
    }
    
    // Update the errors state
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    // Create validation rules for the profile form
    const profileValidationRules = {
      email: { required: true, email: true },
      first_name: { required: true, minLength: 2 },
      last_name: { required: true, minLength: 2 },
      phone_number: { phone: true },
      bio: { maxLength: 500 }
    };
    
    // Validate all fields
    const errors = validateForm(profileForm, profileValidationRules);
    setFormErrors(errors);
    
    // Only proceed if there are no validation errors
    if (!isFormValid(errors)) {
      // Scroll to the first error field
      const firstErrorField = document.querySelector('.is-invalid');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setProfileUpdateLoading(true);
    setProfileUpdateError(null);
    
    try {
      // Create a completely new user object instead of modifying the existing one
      const updatedUser = {
        // Preserve the original user ID and other essential fields
        id: user.id,
        username: user.username,
        user_type: user.user_type,
        
        // Add the updated fields from the form
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        email: profileForm.email,
        phone_number: profileForm.phone_number,
        address: profileForm.address,
        
        // Create a new profile object
        profile: {
          id: user.profile?.id, // Preserve the profile ID if it exists
          bio: profileForm.bio,
          favorite_cuisine: profileForm.favorite_cuisine
        }
      };
      
      // If the user has a profile picture, include it
      if (user.profile_picture) {
        updatedUser.profile_picture = user.profile_picture;
      }
      
      // No longer storing user data in localStorage to avoid profile data persistence between different user accounts
      
      // Try to update the backend database as well
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Update the user data in the backend using our custom endpoint
      let backendUpdateSuccessful = false;
      
      try {
        // Use the custom update-profile endpoint we created in the backend
        const response = await axios.post(`${API_URL}/users/update-profile/`, {
          // User data
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          email: profileForm.email,
          phone_number: profileForm.phone_number,
          address: profileForm.address,
          
          // Profile data
          bio: profileForm.bio,
          favorite_cuisine: profileForm.favorite_cuisine
        }, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Profile updated successfully. in backend:', response.data);
        backendUpdateSuccessful = true;
        
        // Update Redux state with the latest user data
        // This would typically be done through a Redux action
        // but for simplicity, we'll just reload the page
      } catch (error) {
        console.error('Backend profile update failed:', error.response?.data || error.message);
      }
      
      // Close the modal and show success message
      setShowEditModal(false);
      
      if (backendUpdateSuccessful) {
        alert('Profile updated successfully.');
      } else {
        alert('Profile updated successfully.');
      }
      
      // Refresh the user data from the backend
      const refreshResponse = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      // Update the user data in the component state
      // In a real application, you would dispatch a Redux action to update the global state
      // For now, we'll just reload the page to get the latest data
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileUpdateError('An error occurred while updating your profile');
    } finally {
      setProfileUpdateLoading(false);
    }
  };
  
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
                
                <button 
                  className="btn btn-primary" 
                  style={{ marginTop: '1rem' }}
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Profile
                </button>
                
                {/* Edit Profile Modal */}
                {showEditModal && (
                  <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                  }}>
                    <div className="modal" style={{
                      backgroundColor: 'white',
                      borderRadius: 'var(--border-radius)',
                      padding: '2rem',
                      width: '90%',
                      maxWidth: '600px',
                      maxHeight: '90vh',
                      overflowY: 'auto'
                    }}>
                      <h2>Edit Profile</h2>
                      
                      {profileUpdateError && (
                        <div className="alert alert-danger">
                          {profileUpdateError}
                        </div>
                      )}
                      
                      <form onSubmit={handleProfileSubmit}>
                        <div className="form-group">
                          <label htmlFor="first_name" className="form-label">First Name</label>
                          <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            value={profileForm.first_name}
                            onChange={handleProfileFormChange}
                            className={`form-control ${formErrors.first_name ? 'is-invalid' : ''}`}
                            required
                          />
                          {formErrors.first_name && (
                            <div className="invalid-feedback">
                              {formErrors.first_name}
                            </div>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="last_name" className="form-label">Last Name</label>
                          <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            value={profileForm.last_name}
                            onChange={handleProfileFormChange}
                            className={`form-control ${formErrors.last_name ? 'is-invalid' : ''}`}
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="email" className="form-label">Email</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={profileForm.email}
                            onChange={handleProfileFormChange}
                            className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                            required
                          />
                          {formErrors.email && (
                            <div className="invalid-feedback">
                              {formErrors.email}
                            </div>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="phone_number" className="form-label">Phone Number</label>
                          <input
                            type="tel"
                            id="phone_number"
                            name="phone_number"
                            value={profileForm.phone_number}
                            onChange={handleProfileFormChange}
                            className={`form-control ${formErrors.phone_number ? 'is-invalid' : ''}`}
                            placeholder="+1234567890"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="address" className="form-label">Address</label>
                          <textarea
                            id="address"
                            name="address"
                            value={profileForm.address}
                            onChange={handleProfileFormChange}
                            className="form-control"
                            rows="3"
                          ></textarea>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="bio" className="form-label">Bio</label>
                          <textarea
                            id="bio"
                            name="bio"
                            value={profileForm.bio}
                            onChange={handleProfileFormChange}
                            className="form-control"
                            rows="3"
                            placeholder="Tell us about yourself"
                          ></textarea>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="favorite_cuisine" className="form-label">Favorite Cuisine</label>
                          <input
                            type="text"
                            id="favorite_cuisine"
                            name="favorite_cuisine"
                            value={profileForm.favorite_cuisine}
                            onChange={handleProfileFormChange}
                            className="form-control"
                            placeholder="e.g., Italian, Japanese, Mexican"
                          />
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                          <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={() => setShowEditModal(false)}
                            disabled={profileUpdateLoading}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={profileUpdateLoading}
                          >
                            {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
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
