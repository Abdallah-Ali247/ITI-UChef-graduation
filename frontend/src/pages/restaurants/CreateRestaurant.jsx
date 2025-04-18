import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const CreateRestaurant = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone_number: '',
    opening_time: '08:00',
    closing_time: '22:00',
    is_active: true,
    logo: null
  });
  
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
  
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
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
      
      const response = await axios.post(
        `${API_URL}/restaurants/restaurants/`,
        restaurantData,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Success - navigate to restaurant dashboard
      navigate('/restaurant-dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        JSON.stringify(err.response?.data) || 
        'Failed to create restaurant. Please try again.'
      );
      setLoading(false);
    }
  };
  
  if (!isAuthenticated || user?.user_type !== 'restaurant') {
    return (
      <div className="alert alert-danger">
        You must be logged in as a restaurant owner to create a restaurant.
      </div>
    );
  }
  
  return (
    <div className="create-restaurant-page">
      <h1>Create Your Restaurant</h1>
      <p>Set up your restaurant profile to start managing your menu and orders.</p>
      
      {error && (
        <div className="alert alert-danger">
          {error}
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
            
            <div style={{ marginTop: '2rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Restaurant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRestaurant;
