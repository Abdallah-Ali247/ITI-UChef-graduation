import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../store/slices/restaurantSlice';
import { fetchMeals } from '../store/slices/mealSlice';

const Home = () => {
  const dispatch = useDispatch();
  const { restaurants, loading: restaurantsLoading } = useSelector(state => state.restaurants);
  const { meals, loading: mealsLoading } = useSelector(state => state.meals);

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchMeals({ isPublic: true }));
  }, [dispatch]);

  // Get featured restaurants (first 4)
  const featuredRestaurants = restaurants.slice(0, 4);
  
  // Get featured meals (first 4)
  const featuredMeals = meals.filter(meal => meal.is_featured).slice(0, 4);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" style={{ 
        backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '5rem 1rem',
        textAlign: 'center',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Create Your Perfect Meal</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto 1.5rem' }}>
          UChef lets you customize your meals exactly how you want them. Choose your ingredients, control your portions, and enjoy your perfect meal.
        </p>
        <Link to="/restaurants" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
          Order Now
        </Link>
      </section>

      {/* Featured Restaurants Section */}
      <section className="section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Featured Restaurants</h2>
          <Link to="/restaurants" className="btn btn-outline">View All</Link>
        </div>
        
        {restaurantsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid">
            {featuredRestaurants.map(restaurant => (
              <div key={restaurant.id} className="card">
                <img 
                  src={restaurant.logo || 'https://via.placeholder.com/300x200?text=Restaurant'} 
                  alt={restaurant.name} 
                  className="card-img"
                />
                <div className="card-body">
                  <h3 className="card-title">{restaurant.name}</h3>
                  <p className="card-text">{restaurant.description.substring(0, 100)}...</p>
                  <Link to={`/restaurants/${restaurant.id}`} className="btn btn-primary">
                    View Menu
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Featured Meals Section */}
      <section className="section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Featured Meals</h2>
        </div>
        
        {mealsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid">
            {featuredMeals.map(meal => (
              <div key={meal.id} className="card">
                <img 
                  src={meal.image || 'https://via.placeholder.com/300x200?text=Meal'} 
                  alt={meal.name} 
                  className="card-img"
                />
                <div className="card-body">
                  <h3 className="card-title">{meal.name}</h3>
                  <p className="card-text">{meal.description.substring(0, 100)}...</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>${meal.base_price}</span>
                    <Link to={`/meals/${meal.id}`} className="btn btn-primary">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="section" style={{ textAlign: 'center', padding: '3rem 0' }}>
        <h2 style={{ marginBottom: '2rem' }}>How UChef Works</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          <div className="step">
            <div className="step-icon" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              margin: '0 auto 1rem' 
            }}>1</div>
            <h3>Choose a Restaurant</h3>
            <p>Browse our selection of restaurants and find your favorite cuisine.</p>
          </div>
          
          <div className="step">
            <div className="step-icon" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              margin: '0 auto 1rem' 
            }}>2</div>
            <h3>Customize Your Meal</h3>
            <p>Select ingredients, adjust portions, and create your perfect meal.</p>
          </div>
          
          <div className="step">
            <div className="step-icon" style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '2rem', 
              margin: '0 auto 1rem' 
            }}>3</div>
            <h3>Place Your Order</h3>
            <p>Review your order, make payment, and wait for your delicious meal.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
