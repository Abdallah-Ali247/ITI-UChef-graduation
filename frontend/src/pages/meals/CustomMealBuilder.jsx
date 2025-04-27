import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurantById, fetchRestaurantIngredients } from '../../store/slices/restaurantSlice';
import { createCustomMeal } from '../../store/slices/mealSlice';
import { addToCart } from '../../store/slices/cartSlice';

const CustomMealBuilder = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentRestaurant, ingredients, loading: restaurantLoading, error: restaurantError } = useSelector(state => state.restaurants);
  const { loading: mealLoading, error: mealError } = useSelector(state => state.meals);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  const [mealName, setMealName] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [cookingInstructions, setCookingInstructions] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchRestaurantById(restaurantId));
    dispatch(fetchRestaurantIngredients(restaurantId));
  }, [dispatch, restaurantId, isAuthenticated, navigate]);
  
  useEffect(() => {
    // Calculate total price based on selected ingredients
    const price = selectedIngredients.reduce((total, item) => {
      return total + (item.price_per_unit * item.quantity);
    }, 0);
    
    setTotalPrice(price);
  }, [selectedIngredients]);
  
  const handleIngredientChange = (ingredient, quantity) => {
    // Find if ingredient is already selected
    const existingIndex = selectedIngredients.findIndex(item => item.id === ingredient.id);
    
    if (quantity <= 0) {
      // Remove ingredient if quantity is 0 or less
      if (existingIndex !== -1) {
        setSelectedIngredients(selectedIngredients.filter(item => item.id !== ingredient.id));
      }
    } else {
      // Update quantity if ingredient exists
      if (existingIndex !== -1) {
        const updatedIngredients = [...selectedIngredients];
        updatedIngredients[existingIndex] = { ...ingredient, quantity };
        setSelectedIngredients(updatedIngredients);
      } else {
        // Add new ingredient
        setSelectedIngredients([...selectedIngredients, { ...ingredient, quantity }]);
      }
    }
  };
  
  const getIngredientQuantity = (ingredientId) => {
    const ingredient = selectedIngredients.find(item => item.id === ingredientId);
    return ingredient ? ingredient.quantity : 0;
  };
  
  const handleCreateMeal = async () => {
    if (!mealName.trim()) {
      alert('Please give your meal a name');
      return;
    }
    
    if (selectedIngredients.length === 0) {
      alert('Please select at least one ingredient');
      return;
    }
    
    // Prepare data for API
    const mealData = {
      name: mealName,
      description: mealDescription,
      cooking_instructions: cookingInstructions,
      is_public: isPublic,
      restaurant: parseInt(restaurantId),
      base_price: totalPrice
    };
    
    const ingredientsData = selectedIngredients.map(item => ({
      ingredient: item.id,
      quantity: item.quantity
    }));
    
    try {
      const resultAction = await dispatch(createCustomMeal({ 
        mealData, 
        ingredients: ingredientsData 
      }));
      
      if (createCustomMeal.fulfilled.match(resultAction)) {
        const customMeal = resultAction.payload;
        
        // Add to cart
        dispatch(addToCart({
          item: {
            customMealId: customMeal.id,
            name: customMeal.name,
            price: totalPrice,
            type: 'custom',
            quantity: 1,
            image: null, // Add a placeholder for image
            specialInstructions: cookingInstructions // Include cooking instructions
          },
          restaurantId: parseInt(restaurantId),
          restaurantName: currentRestaurant.name
        }));
        
        alert('Custom meal created and added to cart!');
        navigate('/cart');
      }
    } catch (error) {
      if (typeof error === 'object') {
        alert(`Failed to create custom meal: ${JSON.stringify(error)}`);
      } else {
        alert(`Failed to create custom meal: ${error}`);
      }
      console.error('Failed to create custom meal:', error);
    }
  };
  
  if (restaurantLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (restaurantError || mealError) {
    return (
      <div className="alert alert-danger">
        {restaurantError || mealError}
      </div>
    );
  }
  
  if (!currentRestaurant) {
    return (
      <div className="alert alert-warning">
        Restaurant not found.
      </div>
    );
  }
  
  const availableIngredients = ingredients.filter(ingredient => ingredient.is_available);
  
  return (
    <div className="custom-meal-builder">
      <h1>Create Your Custom Meal</h1>
      <p>Select ingredients from {currentRestaurant.name} to create your perfect meal.</p>
      
      <div className="form-section" style={{ marginTop: '2rem' }}>
        <div className="form-group">
          <label htmlFor="mealName" className="form-label">Meal Name</label>
          <input
            type="text"
            id="mealName"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            className="form-control"
            placeholder="Give your meal a name"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="mealDescription" className="form-label">Description (Optional)</label>
          <textarea
            id="mealDescription"
            value={mealDescription}
            onChange={(e) => setMealDescription(e.target.value)}
            className="form-control"
            placeholder="Describe your meal"
            rows="3"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="cookingInstructions" className="form-label">Cooking Instructions (Optional)</label>
          <textarea
            id="cookingInstructions"
            value={cookingInstructions}
            onChange={(e) => setCookingInstructions(e.target.value)}
            className="form-control"
            placeholder="Explain how you'd like these ingredients to be prepared"
            rows="4"
          ></textarea>
          <small className="form-text text-muted">Share your recipe or specific preparation instructions for the chef</small>
        </div>
        
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            Make this meal public (others can see and order it)
          </label>
        </div>
      </div>
      
      <div className="ingredients-section" style={{ marginTop: '2rem' }}>
        <h2>Select Ingredients</h2>
        
        {availableIngredients.length === 0 ? (
          <div className="alert alert-warning">
            No ingredients available for custom meals.
          </div>
        ) : (
          <>
            <div className="search-container" style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ width: '100%' }}
              />
            </div>
            <div className="ingredient-list">
            {availableIngredients
              .filter(ingredient => 
                ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (ingredient.description && ingredient.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                ingredient.unit.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(ingredient => (
              <div key={ingredient.id} className="ingredient-item">
                <h4>{ingredient.name}</h4>
                <p>{ingredient.description}</p>
                <p><strong>Price:</strong> ${ingredient.price_per_unit} per {ingredient.unit}</p>
                
                <div className="ingredient-controls">
                  <div className="quantity-control">
                    <button 
                      className="quantity-btn"
                      onClick={() => handleIngredientChange(
                        ingredient, 
                        Math.max(0, getIngredientQuantity(ingredient.id) - 1)
                      )}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={getIngredientQuantity(ingredient.id)}
                      onChange={(e) => handleIngredientChange(
                        ingredient, 
                        parseInt(e.target.value) || 0
                      )}
                      className="quantity-input"
                      min="0"
                    />
                    <button 
                      className="quantity-btn"
                      onClick={() => handleIngredientChange(
                        ingredient, 
                        getIngredientQuantity(ingredient.id) + 1
                      )}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
      
      <div className="summary-section" style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: 'var(--border-radius)' }}>
        <h2>Meal Summary</h2>
        
        {selectedIngredients.length === 0 ? (
          <p>No ingredients selected yet.</p>
        ) : (
          <>
            <ul style={{ marginBottom: '1rem' }}>
              {selectedIngredients.map(item => (
                <li key={item.id} style={{ marginBottom: '0.5rem' }}>
                  {item.name} x {item.quantity} - ${(item.price_per_unit * item.quantity).toFixed(2)}
                </li>
              ))}
            </ul>
            
            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
              Total Price: ${totalPrice.toFixed(2)}
            </div>
          </>
        )}
        
        <button 
          className="btn btn-primary" 
          style={{ marginTop: '1rem', width: '100%' }}
          onClick={handleCreateMeal}
          disabled={selectedIngredients.length === 0 || !mealName.trim() || mealLoading}
        >
          {mealLoading ? 'Creating...' : 'Create and Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default CustomMealBuilder;