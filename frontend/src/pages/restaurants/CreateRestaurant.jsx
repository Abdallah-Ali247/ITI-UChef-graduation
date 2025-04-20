import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const CreateRestaurant = ({ isEdit = false, isAdmin = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { id } = useParams(); // Get restaurant ID from URL if editing
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone_number: '',
    opening_time: '08:00',
    closing_time: '22:00',
    is_active: true,
    logo: null,
    owner_id: ''
  });
  
  // State for restaurant owners (only used by admin)
  const [restaurantOwners, setRestaurantOwners] = useState([]);
  
  const { name, description, address, phone_number, opening_time, closing_time, is_active, logo } = formData;
  
  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData(prevState => ({
        ...prevState,
        [name]: files[0]
      }));
    } else {
      setFormData(prevState => ({
        ...prevState,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };
  
  // State to track which owners already have restaurants
  const [ownersWithRestaurants, setOwnersWithRestaurants] = useState([]);
  
  // Fetch restaurant owners if admin
  useEffect(() => {
    if (isAdmin) {
      const fetchRestaurantOwnersAndRestaurants = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          // Get all restaurant owners
          const ownersResponse = await axios.get(`${API_URL}/users/users/?user_type=restaurant`, {
            headers: { Authorization: `Token ${token}` }
          });
          
          // Get all restaurants to check which owners already have restaurants
          const restaurantsResponse = await axios.get(`${API_URL}/restaurants/restaurants/`, {
            headers: { Authorization: `Token ${token}` }
          });
          
          // Process owners data
          let ownersData = [];
          if (Array.isArray(ownersResponse.data)) {
            ownersData = ownersResponse.data;
          } else if (ownersResponse.data && typeof ownersResponse.data === 'object' && Array.isArray(ownersResponse.data.results)) {
            ownersData = ownersResponse.data.results;
          } else {
            console.error('Unexpected owners response format:', ownersResponse.data);
            ownersData = [];
          }
          
          // Process restaurants data
          let restaurantsData = [];
          if (Array.isArray(restaurantsResponse.data)) {
            restaurantsData = restaurantsResponse.data;
          } else if (restaurantsResponse.data && typeof restaurantsResponse.data === 'object' && Array.isArray(restaurantsResponse.data.results)) {
            restaurantsData = restaurantsResponse.data.results;
          }
          
          // Extract owner IDs that already have restaurants
          // Convert all IDs to strings for consistent comparison
          const ownersWithRestaurantIds = restaurantsData
            .filter(restaurant => restaurant.owner_id) // Filter out any null owner_id
            .map(restaurant => restaurant.owner_id.toString());
          
          console.log('Owners with restaurants:', ownersWithRestaurantIds);
          setOwnersWithRestaurants(ownersWithRestaurantIds);
          
          // Set restaurant owners
          setRestaurantOwners(ownersData);
        } catch (err) {
          console.error('Error fetching restaurant data:', err);
        }
      };
      
      fetchRestaurantOwnersAndRestaurants();
    }
  }, [isAdmin]);

  // Fetch restaurant data if editing
  useEffect(() => {
    if (isEdit && id) {
      const fetchRestaurantData = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          if (!token) {
            setError('Authentication required. Please log in again.');
            setLoading(false);
            return;
          }
          
          const response = await axios.get(`${API_URL}/restaurants/restaurants/${id}/`, {
            headers: {
              Authorization: `Token ${token}`
            }
          });
          
          const restaurantData = response.data;
          setFormData({
            name: restaurantData.name || '',
            description: restaurantData.description || '',
            address: restaurantData.address || '',
            phone_number: restaurantData.phone_number || '',
            opening_time: restaurantData.opening_time || '08:00',
            closing_time: restaurantData.closing_time || '22:00',
            is_active: restaurantData.is_active !== undefined ? restaurantData.is_active : true,
            logo: null // Can't pre-populate file input
          });
          
          setLoading(false);
        } catch (err) {
          setError('Failed to fetch restaurant data. Please try again.');
          setLoading(false);
        }
      };
      
      fetchRestaurantData();
    }
  }, [isEdit, id]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Validate form
    if (!name) {
      setError('Restaurant name is required');
      setLoading(false);
      return;
    }
    
    // Validate owner selection for admin creating a new restaurant
    if (isAdmin && !isEdit && !formData.owner_id) {
      setError('Please select a restaurant owner');
      setLoading(false);
      return;
    }
    
    // Check if selected owner already has a restaurant
    if (isAdmin && !isEdit && formData.owner_id) {
      // Convert to string for consistent comparison
      const ownerId = formData.owner_id.toString();
      if (ownersWithRestaurants.includes(ownerId)) {
        setError('The selected owner already has a restaurant. Each owner can only have one restaurant.');
        setLoading(false);
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }
      
      // Create FormData object for file upload
      const restaurantData = new FormData();
      restaurantData.append('name', name);
      restaurantData.append('description', description);
      restaurantData.append('address', address);
      restaurantData.append('phone_number', phone_number);
      restaurantData.append('opening_time', opening_time);
      restaurantData.append('closing_time', closing_time);
      restaurantData.append('is_active', is_active);
      
      // Add logo if provided
      if (logo) {
        restaurantData.append('logo', logo);
      }
      
      // Add owner_id if admin is creating a restaurant
      if (isAdmin && !isEdit && formData.owner_id) {
        console.log('Adding owner_id to restaurant data:', formData.owner_id);
        restaurantData.append('owner_id', formData.owner_id);
      }
      
      let response;
      
      if (isEdit) {
        // Update existing restaurant
        response = await axios.patch(
          `${API_URL}/restaurants/restaurants/${id}/`,
          restaurantData,
          {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setSuccess('Restaurant updated successfully!');
      } else {
        // Create new restaurant
        response = await axios.post(
          `${API_URL}/restaurants/restaurants/`,
          restaurantData,
          {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        setSuccess('Restaurant created successfully!');
      }
      
      // Success - navigate based on user type
      setTimeout(() => {
        if (isAdmin) {
          navigate('/admin-dashboard');
        } else {
          navigate('/restaurant-dashboard');
        }
      }, 2000);
      
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        JSON.stringify(err.response?.data) || 
        `Failed to ${isEdit ? 'update' : 'create'} restaurant. Please try again.`
      );
      setLoading(false);
    }
  };
  
  // Check if user has permission to access this page
  if (!isAuthenticated) {
    return (
      <div className="alert alert-danger">
        You must be logged in to access this page.
      </div>
    );
  }
  
  // Allow access if user is admin or restaurant owner
  if (!isAdmin && user?.user_type !== 'restaurant') {
    return (
      <div className="alert alert-danger">
        You must be logged in as a restaurant owner or admin to access this page.
      </div>
    );
  }
  
  // Validate that admin has selected an owner when creating a new restaurant
  const validateForm = () => {
    if (isAdmin && !isEdit && !formData.owner_id) {
      setError('Please select a restaurant owner');
      return false;
    }
    return true;
  }
  
  return (
    <div className="create-restaurant-page">
      <h1>{isEdit ? 'Edit Restaurant' : 'Create Restaurant'}</h1>
      <p>{isEdit 
        ? 'Update the restaurant details below.' 
        : 'Set up your restaurant profile to start managing your menu and orders.'}</p>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Restaurant Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Tell customers about your restaurant, cuisine type, specialties, etc."
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="address" className="form-label">Address *</label>
              <textarea
                id="address"
                name="address"
                value={address}
                onChange={handleChange}
                className="form-control"
                rows="2"
                required
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="phone_number" className="form-label">Phone Number *</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={phone_number}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="opening_time" className="form-label">Opening Time *</label>
                <input
                  type="time"
                  id="opening_time"
                  name="opening_time"
                  value={opening_time}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="closing_time" className="form-label">Closing Time *</label>
                <input
                  type="time"
                  id="closing_time"
                  name="closing_time"
                  value={closing_time}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
            </div>
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={is_active}
                onChange={handleChange}
                style={{ marginRight: '0.5rem' }}
              />
              <label htmlFor="is_active">Restaurant is currently open</label>
            </div>
            
            <div className="form-group">
              <label htmlFor="logo" className="form-label">Restaurant Logo</label>
              <input
                type="file"
                id="logo"
                name="logo"
                onChange={handleChange}
                className="form-control"
                accept="image/*"
              />
              <small className="form-text text-muted">Upload a logo for your restaurant (recommended size: 200x200px)</small>
            </div>
            
            {/* Owner selection (admin only) */}
            {isAdmin && !isEdit && (
              <div className="form-group">
                <label htmlFor="owner_id" className="form-label">Restaurant Owner *</label>
                <select
                  id="owner_id"
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select a restaurant owner</option>
                  {Array.isArray(restaurantOwners) ? restaurantOwners.map(owner => {
                    // Convert to string for consistent comparison
                    const ownerId = owner.id.toString();
                    const hasRestaurant = ownersWithRestaurants.includes(ownerId);
                    return (
                      <option 
                        key={owner.id} 
                        value={owner.id}
                        disabled={hasRestaurant}
                      >
                        {owner.username} ({owner.email}) {hasRestaurant ? '- Already has a restaurant' : ''}
                      </option>
                    );
                  }) : <option value="">No restaurant owners found</option>}
                </select>
                <small className="form-text text-muted">Select the user who will own this restaurant</small>
              </div>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ flex: 1 }}
                  onClick={() => isAdmin ? navigate('/admin-dashboard') : navigate('/restaurant-dashboard')}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading 
                    ? (isEdit ? 'Updating...' : 'Creating...') 
                    : (isEdit ? 'Update Restaurant' : 'Create Restaurant')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRestaurant;
