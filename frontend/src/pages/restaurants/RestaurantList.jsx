import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';

const RestaurantList = () => {
  const dispatch = useDispatch();
  const { restaurants, loading, error } = useSelector(state => state.restaurants);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);
  
  // Filter restaurants based on search term
  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    restaurant.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="restaurant-list-page">
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>Restaurants</h1>
        <p>Choose from our selection of restaurants and customize your perfect meal.</p>
      </div>
      
      <div className="search-bar" style={{ marginBottom: '2rem' }}>
        <input 
          type="text" 
          placeholder="Search restaurants..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control"
          style={{ maxWidth: '500px' }}
        />
      </div>
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
        </div>
      ) : (
        <>
          {filteredRestaurants.length === 0 ? (
            <div className="no-results" style={{ textAlign: 'center', padding: '2rem' }}>
              <h3>No restaurants found</h3>
              <p>Try a different search term or check back later.</p>
            </div>
          ) : (
            <div className="grid">
              {filteredRestaurants.map(restaurant => (
                <div key={restaurant.id} className="card">
                  <img 
                    src={restaurant.logo || 'https://via.placeholder.com/300x200?text=Restaurant'} 
                    alt={restaurant.name} 
                    className="card-img"
                  />
                  <div className="card-body">
                    <h3 className="card-title">{restaurant.name}</h3>
                    <p className="card-text">{restaurant.description.substring(0, 100)}...</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        {restaurant.is_active ? (
                          <span style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>Open</span>
                        ) : (
                          <span style={{ color: 'var(--danger-color)' }}>Closed</span>
                        )}
                      </span>
                      <Link to={`/restaurants/${restaurant.id}`} className="btn btn-primary">
                        View Menu
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RestaurantList;