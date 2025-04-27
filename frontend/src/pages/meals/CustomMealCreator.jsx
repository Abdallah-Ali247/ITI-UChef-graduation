import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMealById } from '../../store/slices/mealSlice';
import { fetchIngredients } from '../../store/slices/restaurantSlice';
import { createCustomMeal } from '../../store/slices/mealSlice';
import { addToCart } from '../../store/slices/cartSlice';

const CustomMealCreator = () => {
  const { mealId, restaurantId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentMeal, loading: mealLoading, error: mealError } = useSelector(state => state.meals);
  const { ingredients, loading: ingredientsLoading, error: ingredientsError } = useSelector(state => state.restaurants);
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  const [customMeal, setCustomMeal] = useState({
    name: '',
    description: '',
    base_meal: mealId,
    is_public: false,
    ingredients: [],
    total_price: 0
  });
  
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchMealById(mealId));
    dispatch(fetchIngredients(restaurantId));
  }, [dispatch, mealId, restaurantId, isAuthenticated, navigate]);
  
  useEffect(() => {
    if (currentMeal) {
      // Initialize custom meal with base meal data
      setCustomMeal(prev => ({
        ...prev,
        name: `Custom ${currentMeal.name}`,
        description: `Customized version of ${currentMeal.name}`,
        base_meal: currentMeal.id,
        total_price: currentMeal.price
      }));
      
      // Initialize selected ingredients with base meal ingredients
      if (currentMeal.ingredients) {
        setSelectedIngredients(
          currentMeal.ingredients.map(ing => ({
            ...ing,
            isFromBaseMeal: true,
            quantity: ing.quantity || 1
          }))
        );
      }
    }
  }, [currentMeal]);
  
  useEffect(() => {
    if (ingredients.length > 0 && selectedIngredients.length > 0) {
      // Filter out ingredients that are already selected
      const selectedIds = selectedIngredients.map(ing => ing.id);
      setAvailableIngredients(
        ingredients.filter(ing => !selectedIds.includes(ing.id))
      );
    } else if (ingredients.length > 0) {
      setAvailableIngredients(ingredients);
    }
  }, [ingredients, selectedIngredients]);
  
  useEffect(() => {
    // Calculate total price based on selected ingredients
    const basePrice = currentMeal ? currentMeal.price : 0;
    const ingredientsPrice = selectedIngredients.reduce((sum, ing) => {
      // Only add price for ingredients not from base meal
      if (!ing.isFromBaseMeal) {
        return sum + (ing.price * ing.quantity);
      }
      return sum;
    }, 0);
    
    setCustomMeal(prev => ({
      ...prev,
      total_price: basePrice + ingredientsPrice,
      ingredients: selectedIngredients.map(ing => ({
        ingredient: ing.id,
        quantity: ing.quantity || 1
      }))
    }));
  }, [selectedIngredients, currentMeal]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomMeal({
      ...customMeal,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleAddIngredient = (ingredient) => {
    setSelectedIngredients([
      ...selectedIngredients,
      { ...ingredient, isFromBaseMeal: false, quantity: 1 }
    ]);
    
    // Remove from available ingredients
    setAvailableIngredients(
      availableIngredients.filter(ing => ing.id !== ingredient.id)
    );
  };
  
  const handleRemoveIngredient = (ingredientId) => {
    const ingredient = selectedIngredients.find(ing => ing.id === ingredientId);
    
    // Only allow removing ingredients that aren't from the base meal
    if (ingredient && !ingredient.isFromBaseMeal) {
      setSelectedIngredients(
        selectedIngredients.filter(ing => ing.id !== ingredientId)
      );
      
      // Add back to available ingredients
      setAvailableIngredients([...availableIngredients, ingredient]);
    }
  };
  
  const handleQuantityChange = (ingredientId, quantity) => {
    setSelectedIngredients(
      selectedIngredients.map(ing => 
        ing.id === ingredientId 
          ? { ...ing, quantity: Math.max(1, quantity) } 
          : ing
      )
    );
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const resultAction = await dispatch(createCustomMeal(customMeal));
      
      if (createCustomMeal.fulfilled.match(resultAction)) {
        const createdMeal = resultAction.payload;
        
        // Show success message
        alert('Custom meal created successfully!');
        
        // Option to add to cart
        const addToCartConfirm = window.confirm('Would you like to add this custom meal to your cart?');
        
        if (addToCartConfirm) {
          dispatch(addToCart({
            item: {
              id: null,
              customMealId: createdMeal.id,
              name: createdMeal.name,
              price: createdMeal.total_price,
              type: 'custom',
              quantity: 1
            },
            restaurantId: parseInt(restaurantId),
            restaurantName: currentMeal.restaurant_name
          }));
          
          navigate('/cart');
        } else {
          navigate(`/restaurants/${restaurantId}`);
        }
      }
    } catch (error) {
      console.error('Failed to create custom meal:', error);
    }
  };
  
  if (mealLoading || ingredientsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (mealError || ingredientsError) {
    return (
      <div className="alert alert-danger">
        {mealError || ingredientsError}
      </div>
    );
  }
  
  if (!currentMeal) {
    return (
      <div className="alert alert-warning">
        Meal not found.
      </div>
    );
  }
  
  return (
    <div className="custom-meal-creator">
      <h1>Create Your Custom Meal</h1>
      <p>Customize <strong>{currentMeal.name}</strong> to your liking</p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
          <div className="custom-meal-details">
            <div className="card">
              <div className="card-body">
                <h2>Meal Details</h2>
                
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={customMeal.name}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={customMeal.description}
                    onChange={handleInputChange}
                    className="form-control"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                  <input
                    type="checkbox"
                    id="is_public"
                    name="is_public"
                    checked={customMeal.is_public}
                    onChange={handleInputChange}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <label htmlFor="is_public">Make this custom meal public</label>
                </div>
                
                <div className="base-meal-info" style={{ marginTop: '1.5rem' }}>
                  <h3>Base Meal</h3>
                  <div className="card" style={{ padding: '1rem', backgroundColor: '#f8f9fa' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {currentMeal.image && (
                        <img 
                          src={currentMeal.image} 
                          alt={currentMeal.name} 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', marginRight: '1rem' }}
                        />
                      )}
                      <div>
                        <h4>{currentMeal.name}</h4>
                        <p>{currentMeal.description}</p>
                        <p><strong>${currentMeal.price.toFixed(2)}</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="ingredients-selection">
            <div className="card">
              <div className="card-body">
                <h2>Ingredients</h2>
                
                <div className="selected-ingredients" style={{ marginBottom: '2rem' }}>
                  <h3>Selected Ingredients</h3>
                  {selectedIngredients.length === 0 ? (
                    <p>No ingredients selected yet.</p>
                  ) : (
                    <ul className="ingredients-list" style={{ listStyle: 'none', padding: 0 }}>
                      {selectedIngredients.map(ingredient => (
                        <li 
                          key={ingredient.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.5rem',
                            borderBottom: '1px solid #eee'
                          }}
                        >
                          <div>
                            <strong>{ingredient.name}</strong>
                            <p><small>${ingredient.price} each</small></p>
                            {ingredient.isFromBaseMeal && (
                              <span style={{ 
                                fontSize: '0.8rem', 
                                backgroundColor: '#e9ecef', 
                                padding: '0.2rem 0.4rem',
                                borderRadius: '3px'
                              }}>
                                Base ingredient
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="quantity-control" style={{ display: 'flex', alignItems: 'center' }}>
                              <button 
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleQuantityChange(
                                  ingredient.id, 
                                  ingredient.quantity - 1
                                )}
                                disabled={ingredient.isFromBaseMeal}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={ingredient.quantity}
                                onChange={(e) => handleQuantityChange(
                                  ingredient.id,
                                  parseInt(e.target.value) || 1
                                )}
                                min="1"
                                style={{ width: '40px', textAlign: 'center', margin: '0 0.5rem' }}
                                disabled={ingredient.isFromBaseMeal}
                              />
                              <button 
                                type="button"
                                className="btn btn-sm"
                                onClick={() => handleQuantityChange(
                                  ingredient.id, 
                                  ingredient.quantity + 1
                                )}
                                disabled={ingredient.isFromBaseMeal}
                              >
                                +
                              </button>
                            </div>
                            
                            {!ingredient.isFromBaseMeal && (
                              <button 
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleRemoveIngredient(ingredient.id)}
                                style={{ marginLeft: '0.5rem' }}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="available-ingredients">
                  <h3>Available Ingredients</h3>
                  {availableIngredients.length === 0 ? (
                    <p>No additional ingredients available.</p>
                  ) : (
                    <ul className="ingredients-list" style={{ listStyle: 'none', padding: 0 }}>
                      {availableIngredients.map(ingredient => (
                        <li 
                          key={ingredient.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            padding: '0.5rem',
                            borderBottom: '1px solid #eee'
                          }}
                        >
                          <div>
                            <strong>{ingredient.name}</strong>
                            <p><small>${ingredient.price} each</small></p>
                          </div>
                          
                          <button 
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleAddIngredient(ingredient)}
                          >
                            Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="price-summary" style={{ 
          marginTop: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px'
        }}>
          <div>
            <h3>Total Price</h3>
            <p>Base meal + additional ingredients</p>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            ${customMeal.total_price.toFixed(2)}
          </div>
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => navigate(`/restaurants/${restaurantId}`)}
          >
            Cancel
          </button>
          
          <button type="submit" className="btn btn-primary">
            Create Custom Meal
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomMealCreator;