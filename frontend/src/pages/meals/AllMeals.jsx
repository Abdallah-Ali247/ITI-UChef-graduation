import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMeals, fetchMealCategories } from '../../store/slices/mealSlice';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AllMeals = () => {
  const dispatch = useDispatch();
  const { meals, loading, error, categories } = useSelector(state => state.meals);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    dispatch(fetchMeals({ isPublic: true }));
    dispatch(fetchMealCategories());
  }, [dispatch]);

  // Fetch ingredient availability for all meals
  useEffect(() => {
    const checkAllAvailability = async () => {
      setCheckingAvailability(true);
      let map = {};
      await Promise.all(meals.map(async meal => {
        try {
          const res = await axios.get(`${API_URL}/api/meals/meals/${meal.id}/check_availability/`);
          map[meal.id] = res.data.unavailable_ingredients.length === 0;
        } catch (err) {
          map[meal.id] = false;
        }
      }));
      setAvailabilityMap(map);
      setCheckingAvailability(false);
    };
    if (meals.length > 0) checkAllAvailability();
  }, [meals]);

  useEffect(() => {
    let result = meals;
    if (searchTerm) {
      result = result.filter(meal => meal.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedCategory) {
      result = result.filter(meal => meal.category && meal.category.toString() === selectedCategory);
    }
    result = result.filter(meal => meal.base_price >= priceRange[0] && meal.base_price <= priceRange[1]);
    setFilteredMeals(result);
  }, [meals, searchTerm, selectedCategory, priceRange]);

  const minPrice = Math.min(...meals.map(m => m.base_price), 0);
  const maxPrice = Math.max(...meals.map(m => m.base_price), 100);

  return (
    <div className="all-meals-page" style={{ padding: '2rem 0' }}>
      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>All Meals</h1>
        <div className="filters" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by meal name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="form-control"
            style={{ maxWidth: '220px' }}
          />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="form-control"
            style={{ maxWidth: '180px' }}
          >
            <option value="">All Categories</option>
            {categories && categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label>Min:</label>
            <input
              type="number"
              min={minPrice}
              max={maxPrice}
              value={priceRange[0]}
              onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
              className="form-control"
              style={{ width: '80px' }}
            />
            <span>-</span>
            <input
              type="number"
              min={minPrice}
              max={maxPrice}
              value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], +e.target.value])}
              className="form-control"
              style={{ width: '80px' }}
            /><label>Max:</label>
          </div>
        </div>
        {loading || checkingAvailability ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : filteredMeals.length === 0 ? (
          <div className="alert alert-info">No meals found matching your criteria.</div>
        ) : (
          <div className="meals-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            {filteredMeals.map(meal => (
              <div key={meal.id} className="card" style={{ opacity: availabilityMap[meal.id] === false ? 0.6 : 1 }}>
                <img
                  src={meal.image || 'https://via.placeholder.com/300x200?text=Meal'}
                  alt={meal.name}
                  className="card-img"
                  style={{ height: '180px', objectFit: 'cover' }}
                />
                <div className="card-body">
                  <h3 className="card-title">{meal.name}</h3>
                  <p className="card-text">{meal.description?.substring(0, 100)}...</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 'bold' }}>${meal.base_price}</span>
                    <Link to={`/meals/${meal.id}`} className="btn btn-primary">View Details</Link>
                  </div>
                  {availabilityMap[meal.id] === false && (
                    <div className="alert alert-warning" style={{ fontSize: '0.95rem', padding: '0.5rem', marginBottom: 0 }}>
                      Not available (some ingredients are out of stock)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllMeals;
