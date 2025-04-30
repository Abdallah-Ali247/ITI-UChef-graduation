import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { FaIceCream, FaCoffee, FaMugHot, FaGlassWhiskey, FaSnowflake, FaSun } from 'react-icons/fa';

const WeatherRecommendation = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { meals } = useSelector(state => state.meals);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        // Use OpenWeatherMap API directly with a free API key
        // This is a demo API key with limited usage - in production, use environment variables
        const apiKey = '4d8fb5b93d4af21d66a2948710284366';
        const city = 'Cairo'; // Default city
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
        );
        
        if (response.status === 200) {
          const data = {
            success: true,
            city: response.data.name,
            temperature: response.data.main.temp,
            description: response.data.weather[0].description,
            humidity: response.data.main.humidity,
            icon: response.data.weather[0].icon
          };
          setWeatherData(data);
          fetchRecommendations(data.temperature);
        } else {
          setError('Could not fetch weather data');
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        // Fallback to simulated weather data for demo purposes
        const simulatedData = {
          success: true,
          city: 'Cairo',
          temperature: Math.random() > 0.5 ? 28 : 22, // Randomly choose hot or cold
          description: Math.random() > 0.5 ? 'clear sky' : 'few clouds',
          humidity: 65,
          icon: '01d'
        };
        setWeatherData(simulatedData);
        fetchRecommendations(simulatedData.temperature);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, []);

  const fetchRecommendations = async (temperature) => {
    try {
      // Use the meals from Redux store instead of making another API call
      if (meals && meals.length > 0) {
        // Filter meals that might be appropriate for the current weather
        // This is a simple implementation - in a real app, you'd have proper categories
        const filteredMeals = meals.filter(meal => {
          const name = meal.name.toLowerCase();
          const description = meal.description ? meal.description.toLowerCase() : '';
          
          if (temperature > 25) {
            // Hot weather - look for cold items
            return (
              name.includes('ice') || 
              name.includes('cold') || 
              name.includes('cool') || 
              name.includes('frozen') ||
              name.includes('smoothie') ||
              description.includes('refreshing') ||
              description.includes('cold') ||
              description.includes('ice')
            );
          } else {
            // Cold weather - look for hot items
            return (
              name.includes('hot') || 
              name.includes('warm') || 
              name.includes('coffee') || 
              name.includes('tea') ||
              name.includes('chocolate') ||
              description.includes('warm') ||
              description.includes('hot')
            );
          }
        });
        
        if (filteredMeals.length > 0) {
          // Get up to 3 recommendations
          setRecommendations(filteredMeals.slice(0, 3));
          return;
        }
      }
      
      // Fallback to default recommendations if no matching meals found
      if (temperature > 25) {
        setRecommendations([
          { id: 'default-1', name: 'Ice Cream', description: 'Cool down with some refreshing ice cream' },
          { id: 'default-2', name: 'Cold Brew Coffee', description: 'Energize with a refreshing cold brew' },
          { id: 'default-3', name: 'Fruit Smoothie', description: 'Healthy and refreshing fruit smoothie' }
        ]);
      } else {
        setRecommendations([
          { id: 'default-1', name: 'Hot Chocolate', description: 'Warm up with a delicious hot chocolate' },
          { id: 'default-2', name: 'Spiced Chai Latte', description: 'A comforting spiced chai latte' },
          { id: 'default-3', name: 'Cappuccino', description: 'Classic cappuccino to warm your day' }
        ]);
      }
    } catch (error) {
      console.error('Error processing recommendations:', error);
      // Set default recommendations based on temperature
      if (temperature > 25) {
        setRecommendations([
          { id: 'default-1', name: 'Ice Cream', description: 'Cool down with some refreshing ice cream' },
          { id: 'default-2', name: 'Cold Brew Coffee', description: 'Energize with a refreshing cold brew' },
          { id: 'default-3', name: 'Fruit Smoothie', description: 'Healthy and refreshing fruit smoothie' }
        ]);
      } else {
        setRecommendations([
          { id: 'default-1', name: 'Hot Chocolate', description: 'Warm up with a delicious hot chocolate' },
          { id: 'default-2', name: 'Spiced Chai Latte', description: 'A comforting spiced chai latte' },
          { id: 'default-3', name: 'Cappuccino', description: 'Classic cappuccino to warm your day' }
        ]);
      }
    }
  };

  if (loading) {
    return (
      <div className="section-container" style={{ padding: '2rem 0' }}>
        <div className="container">
          <div className="loading-spinner">Loading weather recommendations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show anything if there's an error
  }

  if (!weatherData) {
    return null;
  }

  const isHot = weatherData.temperature > 25;
  const backgroundClass = isHot ? 'hot-weather-bg' : 'cold-weather-bg';
  const temperatureText = isHot ? 'hot' : 'cold';
  const WeatherIcon = isHot ? FaSun : FaSnowflake;
  const RecommendationIcon = isHot ? FaIceCream : FaMugHot;

  return (
    <section className={`weather-recommendation-section ${backgroundClass}`}>
      <div className="container">
        <div className="weather-header">
          <WeatherIcon className="weather-icon" />
          <h2>Weather-Based Recommendations</h2>
        </div>
        
        <div className="weather-info">
          <p>
            It's {temperatureText} today in {weatherData.city} with a temperature of {Math.round(weatherData.temperature)}°C!
            {isHot ? (
              <span> How about something refreshing?</span>
            ) : (
              <span> How about something to warm you up?</span>
            )}
          </p>
        </div>

        {recommendations.length > 0 ? (
          <div className="recommendation-cards">
            {recommendations.map((item, index) => (
              <div key={item.id} className="recommendation-card">
                <div className="recommendation-icon">
                  {isHot ? <FaGlassWhiskey /> : <FaCoffee />}
                </div>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                {item.id.startsWith('default') ? (
                  <Link to="/restaurants" className="btn btn-sm">Find Similar</Link>
                ) : (
                  <Link to={`/meals/${item.id}`} className="btn btn-sm">View Details</Link>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-recommendations">
            <RecommendationIcon className="recommendation-icon" />
            <p>
              {isHot ? (
                <>We recommend trying some refreshing cold drinks or ice cream today!</>
              ) : (
                <>We recommend trying some comforting hot drinks to warm up today!</>
              )}
            </p>
            <Link to="/restaurants" className="btn btn-primary">
              Explore Restaurants
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default WeatherRecommendation;
