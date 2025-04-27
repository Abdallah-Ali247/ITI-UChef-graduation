import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const AddMeal = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const { currentRestaurant } = useSelector(state => state.restaurants);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientQuantities, setIngredientQuantities] = useState({});
  const [ingredientOptional, setIngredientOptional] = useState({});
  const [ingredientAdditionalPrices, setIngredientAdditionalPrices] = useState({});
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category: '',
    preparation_time: 30,
    is_available: true,
    is_customizable: false,
    image: null
  });
  
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });
  
  const { 
    name, 
    description, 
    base_price, 
    category, 
    preparation_time, 
    is_available, 
    is_customizable 
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
    
    // Fetch ingredients for this restaurant
    const fetchIngredients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !currentRestaurant) return;
        
        const response = await axios.get(
          `${API_URL}/restaurants/restaurants/${currentRestaurant.id}/ingredients/`,
          {
            headers: {
              Authorization: `Token ${token}`
            }
          }
        );
        
        setIngredients(response.data);
      } catch (err) {
        console.error('Failed to fetch ingredients:', err);
      }
    };
    
    // Fetch meal categories
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const response = await axios.get(`${API_URL}/meals/categories/`);
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        setError('Failed to load meal categories. Please try again.');
      } finally {
        setCategoryLoading(false);
      }
    };
    
    fetchIngredients();
    fetchCategories();
  }, [isAuthenticated, navigate, user, currentRestaurant]);
  
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
  
  const handleNewCategoryChange = e => {
    const { name, value } = e.target;
    setNewCategory(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name) {
      alert('Category name is required');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const response = await axios.post(
        `${API_URL}/meals/categories/`,
        newCategory,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Add the new category to the list and select it
      setCategories([...categories, response.data]);
      setFormData(prevState => ({
        ...prevState,
        category: response.data.id
      }));
      
      // Reset the form and hide it
      setNewCategory({ name: '', description: '' });
      setShowNewCategoryForm(false);
    } catch (err) {
      console.error('Failed to create category:', err);
      alert(
        err.response?.data?.detail || 
        JSON.stringify(err.response?.data) || 
        'Failed to create category. Please try again.'
      );
    }
  };
  
  const handleIngredientToggle = (ingredientId) => {
    setSelectedIngredients(prevSelected => {
      if (prevSelected.includes(ingredientId)) {
        return prevSelected.filter(id => id !== ingredientId);
      } else {
        // Initialize quantity to 1 when ingredient is selected
        setIngredientQuantities(prev => ({
          ...prev,
          [ingredientId]: 1
        }));
        return [...prevSelected, ingredientId];
      }
    });
  };
  
  const handleIngredientQuantityChange = (ingredientId, quantity) => {
    setIngredientQuantities(prev => ({
      ...prev,
      [ingredientId]: Math.max(0.1, parseFloat(quantity))
    }));
  };
  
  const handleIngredientOptionalChange = (ingredientId, isOptional) => {
    setIngredientOptional(prev => ({
      ...prev,
      [ingredientId]: isOptional
    }));
  };
  
  const handleIngredientAdditionalPriceChange = (ingredientId, price) => {
    setIngredientAdditionalPrices(prev => ({
      ...prev,
      [ingredientId]: parseFloat(price) || 0
    }));
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
      
      // Create FormData object
      const mealData = new FormData();
      mealData.append('name', name);
      mealData.append('description', description);
      mealData.append('base_price', base_price);
      mealData.append('category', category);
      mealData.append('restaurant', currentRestaurant.id);
      mealData.append('preparation_time', preparation_time);
      mealData.append('is_available', is_available);
      mealData.append('is_customizable', is_customizable);
      
      if (formData.image) {
        mealData.append('image', formData.image);
      }
      
      // Prepare ingredients data with quantities
      const ingredientsData = selectedIngredients.map(ingredientId => ({
        ingredient: ingredientId,
        quantity: ingredientQuantities[ingredientId] || 1,
        is_optional: ingredientOptional[ingredientId] || false,
        additional_price: ingredientAdditionalPrices[ingredientId] || 0
      }));
      
      // Add ingredients data to request
      mealData.append('ingredients', JSON.stringify(ingredientsData));
      
      const response = await axios.post(
        `${API_URL}/meals/meals/`,
        mealData,
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
        'Failed to create meal. Please try again.'
      );
      setLoading(false);
    }
  };
  
  if (!isAuthenticated || user?.user_type !== 'restaurant') {
    return (
      <div className="alert alert-danger">
        You must be logged in as a restaurant owner to add meals.
      </div>
    );
  }
  
  if (!currentRestaurant) {
    return (
      <div className="alert alert-warning">
        You need to set up your restaurant before adding meals.
      </div>
    );
  }
  
  return (
    <div className="add-meal-page">
      <h1>Add New Meal</h1>
      <p>Create a new meal for your restaurant menu.</p>
      
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">Meal Name *</label>
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
                placeholder="Describe your meal, including key ingredients and flavors"
                required
              ></textarea>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor="base_price" className="form-label">Price ($) *</label>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={base_price}
                  onChange={handleChange}
                  className="form-control"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category" className="form-label">Category *</label>
                {categoryLoading ? (
                  <div className="loading-indicator">Loading categories...</div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <select
                        id="category"
                        name="category"
                        value={category}
                        onChange={handleChange}
                        className="form-control"
                        required={!showNewCategoryForm}
                        disabled={showNewCategoryForm}
                        style={{ flex: 1 }}
                      >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                      >
                        {showNewCategoryForm ? 'Cancel' : 'New Category'}
                      </button>
                    </div>
                    
                    {showNewCategoryForm && (
                      <div className="new-category-form" style={{ 
                        border: '1px solid var(--light-gray)', 
                        padding: '1rem',
                        borderRadius: 'var(--border-radius)',
                        marginBottom: '1rem'
                      }}>
                        <h4>Create New Category</h4>
                        <div className="form-group">
                          <label htmlFor="new-category-name" className="form-label">Category Name *</label>
                          <input
                            type="text"
                            id="new-category-name"
                            name="name"
                            value={newCategory.name}
                            onChange={handleNewCategoryChange}
                            className="form-control"
                            required
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="new-category-description" className="form-label">Description</label>
                          <textarea
                            id="new-category-description"
                            name="description"
                            value={newCategory.description}
                            onChange={handleNewCategoryChange}
                            className="form-control"
                            rows="2"
                          ></textarea>
                        </div>
                        
                        <button 
                          type="button" 
                          className="btn btn-primary"
                          onClick={handleCreateCategory}
                          style={{ marginTop: '0.5rem' }}
                        >
                          Create Category
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="preparation_time" className="form-label">Preparation Time (minutes) *</label>
              <input
                type="number"
                id="preparation_time"
                name="preparation_time"
                value={preparation_time}
                onChange={handleChange}
                className="form-control"
                min="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="image" className="form-label">Meal Image</label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleChange}
                className="form-control"
                accept="image/*"
              />
              <small className="form-text text-muted">Upload an appetizing image of your meal (recommended size: 800x600px)</small>
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
                <label htmlFor="is_available">Available on menu</label>
              </div>
              
              <div className="form-group" style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  id="is_customizable"
                  name="is_customizable"
                  checked={is_customizable}
                  onChange={handleChange}
                  style={{ marginRight: '0.5rem' }}
                />
                <label htmlFor="is_customizable">Allow customization</label>
              </div>
            </div>
            
            {ingredients.length > 0 && (
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Ingredients</label>
                <p className="text-muted">Select ingredients and specify quantities for this meal</p>
                
                <div className="ingredient-search" style={{ marginBottom: '1rem' }}>
                  <div className="search-input-container" style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search ingredients..."
                      value={ingredientSearchQuery}
                      onChange={(e) => setIngredientSearchQuery(e.target.value)}
                      className="form-control"
                    />
                    {ingredientSearchQuery && (
                      <button 
                        className="clear-search" 
                        onClick={() => setIngredientSearchQuery('')}
                        style={{ 
                          position: 'absolute', 
                          right: '10px', 
                          top: '50%', 
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {selectedIngredients.length > 0 && (
                    <div className="selected-count" style={{ marginTop: '0.5rem' }}>
                      {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
                
                <div className="ingredients-list" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1rem'
                }}>
                  {ingredients
                    .filter(ingredient => 
                      ingredient.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase()) ||
                      (ingredient.description && ingredient.description.toLowerCase().includes(ingredientSearchQuery.toLowerCase()))
                    )
                    .map(ingredient => (
                    <div key={ingredient.id} className="ingredient-item" style={{
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      padding: '10px',
                      backgroundColor: selectedIngredients.includes(ingredient.id) ? '#f8f9fa' : 'transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <input
                          type="checkbox"
                          id={`ingredient-${ingredient.id}`}
                          checked={selectedIngredients.includes(ingredient.id)}
                          onChange={() => handleIngredientToggle(ingredient.id)}
                          className="form-check-input"
                          style={{ marginRight: '8px' }}
                        />
                        <label htmlFor={`ingredient-${ingredient.id}`} className="form-check-label fw-bold">
                          {ingredient.name}
                        </label>
                      </div>
                      
                      {selectedIngredients.includes(ingredient.id) && (
                        <div style={{ paddingLeft: '24px' }}>
                          <div className="mb-2">
                            <label htmlFor={`quantity-${ingredient.id}`} className="form-label small">Quantity:</label>
                            <input
                              type="number"
                              id={`quantity-${ingredient.id}`}
                              value={ingredientQuantities[ingredient.id] || 1}
                              onChange={(e) => handleIngredientQuantityChange(ingredient.id, e.target.value)}
                              className="form-control form-control-sm"
                              min="0.1"
                              step="0.1"
                              style={{ width: '100px' }}
                            />
                            <small className="text-muted ms-2">{ingredient.unit}</small>
                          </div>
                          
                          {/* <div className="mb-2 form-check">
                            <input
                              type="checkbox"
                              id={`optional-${ingredient.id}`}
                              checked={ingredientOptional[ingredient.id] || false}
                              onChange={(e) => handleIngredientOptionalChange(ingredient.id, e.target.checked)}
                              className="form-check-input"
                            />
                            <label htmlFor={`optional-${ingredient.id}`} className="form-check-label small">
                              Optional ingredient
                            </label>
                          </div> */}
                          
                          {/* <div>
                            <label htmlFor={`price-${ingredient.id}`} className="form-label small">Additional price:</label>
                            <input
                              type="number"
                              id={`price-${ingredient.id}`}
                              value={ingredientAdditionalPrices[ingredient.id] || 0}
                              onChange={(e) => handleIngredientAdditionalPriceChange(ingredient.id, e.target.value)}
                              className="form-control form-control-sm"
                              min="0"// Add to your state
                              const [ingredientSearchQuery, setIngredientSearchQuery] = useState('');
                              
                              // Add a filter function
                              const filteredIngredients = ingredients.filter(ingredient => 
                                ingredient.name.toLowerCase().includes(ingredientSearchQuery.toLowerCase()) ||
                                (ingredient.description && ingredient.description.toLowerCase().includes(ingredientSearchQuery.toLowerCase()))
                              );
                              
                              // Then in your render, above the ingredients grid:
                              <div className="ingredient-search" style={{ marginBottom: '1rem' }}>
                                <div className="search-input-container" style={{ position: 'relative' }}>
                                  <input
                                    type="text"
                                    placeholder="Search ingredients..."
                                    value={ingredientSearchQuery}
                                    onChange={(e) => setIngredientSearchQuery(e.target.value)}
                                    className="form-control"
                                  />
                                  {ingredientSearchQuery && (
                                    <button 
                                      className="clear-search" 
                                      onClick={() => setIngredientSearchQuery('')}
                                      style={{ 
                                        position: 'absolute', 
                                        right: '10px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                {selectedIngredients.length > 0 && (
                                  <div className="selected-count" style={{ marginTop: '0.5rem' }}>
                                    {selectedIngredients.length} ingredient{selectedIngredients.length !== 1 ? 's' : ''} selected
                                  </div>
                                )}
                              </div>
                              
                              // And modify your ingredients mapping to use filteredIngredients:
                              {filteredIngredients.map(ingredient => (
                                // Your existing ingredient item code
                              ))}
                              step="0.01"
                              style={{ width: '100px' }}
                            />
                          </div> */}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Add Meal to Menu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMeal;