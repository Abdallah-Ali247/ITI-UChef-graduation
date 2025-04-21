import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurantById, fetchRestaurantIngredients } from '../../store/slices/restaurantSlice';
import { fetchMeals } from '../../store/slices/mealSlice';
import { addToCart } from '../../store/slices/cartSlice';
import ReviewList from '../../components/reviews/ReviewList';

const RestaurantDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentRestaurant, ingredients, loading: restaurantLoading, error: restaurantError } = useSelector(state => state.restaurants);
  const { meals, loading: mealsLoading, error: mealsError } = useSelector(state => state.meals);
  const [activeTab, setActiveTab] = useState('menu');
  
  useEffect(() => {
    dispatch(fetchRestaurantById(id));
    dispatch(fetchRestaurantIngredients(id));
    dispatch(fetchMeals({ restaurantId: id }));
  }, [dispatch, id]);
  
  const handleAddToCart = (meal) => {
    dispatch(addToCart({
      item: {
        id: meal.id,
        name: meal.name,
        price: meal.base_price,
        image: meal.image,
        type: 'regular',
        quantity: 1
      },
      restaurantId: currentRestaurant.id,
      restaurantName: currentRestaurant.name
    }));
    
    // Show a success message (you could use a toast notification library here)
    alert(`${meal.name} added to cart!`);
  };
  
  if (restaurantLoading || mealsLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (restaurantError || mealsError) {
    return (
      <div className="alert alert-danger">
        {restaurantError || mealsError}
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
  
  // Group meals by category
  const mealsByCategory = meals.reduce((acc, meal) => {
    const categoryName = meal.category_name || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(meal);
    return acc;
  }, {});
  
  return (
    <div className="restaurant-detail-page">
      <div className="restaurant-header">
        <img 
          src={currentRestaurant.logo || 'https://via.placeholder.com/300x200?text=Restaurant'} 
          alt={currentRestaurant.name} 
          className="restaurant-image"
        />
        <div className="restaurant-info">
          <h1>{currentRestaurant.name}</h1>
          <p>{currentRestaurant.description}</p>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Address:</strong> {currentRestaurant.address}</p>
            <p><strong>Phone:</strong> {currentRestaurant.phone_number}</p>
            <p>
              <strong>Hours:</strong> {currentRestaurant.opening_time} - {currentRestaurant.closing_time}
              {currentRestaurant.is_active ? (
                <span style={{ color: 'var(--success-color)', marginLeft: '0.5rem' }}>Open</span>
              ) : (
                <span style={{ color: 'var(--danger-color)', marginLeft: '0.5rem' }}>Closed</span>
              )}
            </p>
          </div>
        </div>
      </div>
      
      <div className="menu-tabs">
        <div 
          className={`menu-tab ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Menu
        </div>
        <div 
          className={`menu-tab ${activeTab === 'custom' ? 'active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Create Custom Meal
        </div>
        <div 
          className={`menu-tab ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews
        </div>
      </div>
      
      {activeTab === 'menu' ? (
        <div className="menu-section">
          {Object.keys(mealsByCategory).length === 0 ? (
            <div className="no-results" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>No meals available</h3>
              <p>This restaurant hasn't added any meals to their menu yet.</p>
            </div>
          ) : (
            Object.entries(mealsByCategory).map(([category, categoryMeals]) => (
              <div key={category} className="category-section" style={{ marginBottom: '2rem' }}>
                <h2>{category}</h2>
                <div className="grid">
                  {categoryMeals.map(meal => (
                    <div key={meal.id} className="card">
                      <img 
                        src={meal.image || 'https://via.placeholder.com/300x200?text=Meal'} 
                        alt={meal.name} 
                        className="card-img"
                      />
                      <div className="card-body">
                        <h3 className="card-title">{meal.name}</h3>
                        <p className="card-text">{meal.description.substring(0, 100)}...</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span style={{ fontWeight: 'bold' }}>${meal.base_price}</span>
                          {meal.is_available ? (
                            <span style={{ color: 'var(--success-color)' }}>Available</span>
                          ) : (
                            <span style={{ color: 'var(--danger-color)' }}>Unavailable</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Link to={`/meals/${meal.id}`} className="btn btn-outline">
                            Details
                          </Link>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleAddToCart(meal)}
                            disabled={!meal.is_available}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === 'custom' ? (
        <div className="custom-meal-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Create Your Custom Meal</h2>
            <Link to={`/custom-meal/${id}`} className="btn btn-primary">
              Start Building
            </Link>
          </div>
          
          <p style={{ marginBottom: '2rem' }}>
            Create your own custom meal by selecting ingredients from {currentRestaurant.name}'s inventory.
            Mix and match ingredients to create your perfect dish!
          </p>
          
          <h3>Available Ingredients</h3>
          {ingredients.length === 0 ? (
            <div className="no-results" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>No ingredients available for custom meals.</p>
            </div>
          ) : (
            <div className="ingredient-list">
              {ingredients.map(ingredient => (
                <div key={ingredient.id} className="ingredient-item">
                  <h4>{ingredient.name}</h4>
                  <p>{ingredient.description}</p>
                  <p><strong>Price:</strong> ${ingredient.price_per_unit} per {ingredient.unit}</p>
                  {ingredient.is_available ? (
                    <span style={{ color: 'var(--success-color)' }}>In Stock</span>
                  ) : (
                    <span style={{ color: 'var(--danger-color)' }}>Out of Stock</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'reviews' ? (
        <div className="reviews-section-container">
          <h2>Customer Reviews</h2>
          <ReviewList type="restaurant" itemId={id} />
        </div>
      ) : null}
    </div>
  );
};

export default RestaurantDetail;
