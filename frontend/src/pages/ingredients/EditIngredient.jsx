import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const EditIngredient = () => {
  const { ingredientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { currentRestaurant } = useSelector(state => state.restaurants);
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'g',
    price_per_unit: '',
    quantity: '',
    is_allergen: false,
    allergen_type: '',
    is_available: true,
    image: null
  });
  
  const { 
    name, 
    description, 
    unit, 
    price_per_unit, 
    quantity, 
    is_allergen, 
    allergen_type,
    is_available
  } = formData;
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.user_type !== 'restaurant') {
      navigate('/');
      return;
    }
    
    const fetchIngredient = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in again.');
          setFetchLoading(false);
          return;
        }
        
        const response = await axios.get(
          `${API_URL}/restaurants/ingredients/${ingredientId}/`,
          {
            headers: {
              Authorization: `Token ${token}`
            }
          }
        );
        
        const ingredient = response.data;
        
        setFormData({
          name: ingredient.name || '',
          description: ingredient.description || '',
          unit: ingredient.unit || 'g',
          price_per_unit: ingredient.price_per_unit || '',
          quantity: ingredient.quantity || '',
          is_allergen: ingredient.is_allergen || false,
          allergen_type: ingredient.allergen_type || '',
          is_available: ingredient.is_available !== undefined ? ingredient.is_available : true
        });
        
        setFetchLoading(false);
      } catch (err) {
        console.error('Failed to fetch ingredient:', err);
        setError('Failed to load ingredient details. Please try again.');
        setFetchLoading(false);
      }
    };
    
    fetchIngredient();
  }, [isAuthenticated, navigate, user, ingredientId]);
  
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
      
      if (!currentRestaurant) {
        setError('Restaurant information not found.');
        setLoading(false);
        return;
      }
      
      // Create FormData object for file upload
      const ingredientData = new FormData();
      ingredientData.append('name', name);
      ingredientData.append('description', description);
      ingredientData.append('unit', unit);
      ingredientData.append('price_per_unit', price_per_unit);
      ingredientData.append('quantity', quantity);
      ingredientData.append('is_allergen', is_allergen);
      ingredientData.append('is_available', is_available);
      ingredientData.append('restaurant', currentRestaurant.id);
      
      if (is_allergen && allergen_type) {
        ingredientData.append('allergen_type', allergen_type);
      }
      
      // Add image if provided
      if (formData.image) {
        ingredientData.append('image', formData.image);
      }
      
      const response = await axios.put(
        `${API_URL}/restaurants/ingredients/${ingredientId}/`,
        ingredientData,
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
        'Failed to update ingredient. Please try again.'
      );
      setLoading(false);
    }
  };
  
  if (!isAuthenticated || user?.user_type !== 'restaurant') {
    return (
      <div className="alert alert-danger">
        You must be logged in as a restaurant owner to edit ingredients.
      </div>
    );
  }
  
  if (!currentRestaurant) {
    return (
      <div className="alert alert-warning">
        You need to set up your restaurant before editing ingredients.
      </div>
    );
  }
  
  if (fetchLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading ingredient details...</p>
      </div>
    );
  }
  
  return (
    <div className="edit-ingredient-page">
      <h1>Edit Ingredient</h1>
      <p>Update the details of your ingredient.</p>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Ingredient Name *</label>
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
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={handleChange}
                className="form-control"
                rows="2"
                placeholder="Brief description of the ingredient"
              ></textarea>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="unit" className="form-label">Unit *</label>
                <select
                  id="unit"
                  name="unit"
                  value={unit}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="g">Grams (g)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="l">Liters (l)</option>
                  <option value="oz">Ounces (oz)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="unit">Units/Pieces</option>
                  <option value="tsp">Teaspoons</option>
                  <option value="tbsp">Tablespoons</option>
                  <option value="cup">Cups</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="price_per_unit" className="form-label">Price per Unit ($) *</label>
                <input
                  type="number"
                  id="price_per_unit"
                  name="price_per_unit"
                  value={price_per_unit}
                  onChange={handleChange}
                  className="form-control"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity" className="form-label">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={handleChange}
                  className="form-control"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="image" className="form-label">Update Ingredient Image</label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleChange}
                className="form-control"
                accept="image/*"
              />
              <small className="form-text text-muted">Upload a new image only if you want to change the current one</small>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="is_available"
                  name="is_available"
                  checked={is_available}
                  onChange={handleChange}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="is_available">In Stock</label>
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="is_allergen"
                  name="is_allergen"
                  checked={is_allergen}
                  onChange={handleChange}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="is_allergen">This is an allergen</label>
              </div>
            </div>
            
            {is_allergen && (
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label htmlFor="allergen_type" className="form-label">Allergen Type *</label>
                <select
                  id="allergen_type"
                  name="allergen_type"
                  value={allergen_type}
                  onChange={handleChange}
                  className="form-control"
                  required={is_allergen}
                >
                  <option value="">Select allergen type</option>
                  <option value="gluten">Gluten</option>
                  <option value="dairy">Dairy</option>
                  <option value="nuts">Nuts</option>
                  <option value="peanuts">Peanuts</option>
                  <option value="shellfish">Shellfish</option>
                  <option value="fish">Fish</option>
                  <option value="eggs">Eggs</option>
                  <option value="soy">Soy</option>
                  <option value="wheat">Wheat</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Ingredient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditIngredient;
