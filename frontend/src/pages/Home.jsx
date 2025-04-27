import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchRestaurants } from "../store/slices/restaurantSlice";
import { fetchMeals } from "../store/slices/mealSlice";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const dispatch = useDispatch();
  const { restaurants, loading: restaurantsLoading } = useSelector(
    (state) => state.restaurants
  );
  const { meals, loading: mealsLoading } = useSelector((state) => state.meals);
  const [topCustomMeals, setTopCustomMeals] = useState([]);
  const [loadingCustomMeals, setLoadingCustomMeals] = useState(true);

  useEffect(() => {
    dispatch(fetchRestaurants());
    dispatch(fetchMeals({ isPublic: true }));

    // Fetch top custom meals
    const fetchTopCustomMeals = async () => {
      try {
        setLoadingCustomMeals(true);
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:8000"
          }/api/meals/custom-meals/top-rated/`
        );

        // Make sure we're dealing with an array
        const data = Array.isArray(response.data) ? response.data : [];
        setTopCustomMeals(data);
      } catch (error) {
        console.error("Error fetching top custom meals:", error);
        setTopCustomMeals([]);
      } finally {
        setLoadingCustomMeals(false);
      }
    };

    fetchTopCustomMeals();
  }, [dispatch]);

  // Get featured restaurants (first 6)
  const featuredRestaurants = restaurants.slice(0, 6);

  // Get featured meals (first 6) - if none are featured, show the first 6 meals
  const featuredMeals =
    meals.filter((meal) => meal.is_featured).length > 0
      ? meals.filter((meal) => meal.is_featured).slice(0, 6)
      : meals.slice(0, 6);

  // Slider settings
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        className="hero"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          padding: "5rem 1rem",
          textAlign: "center",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Create Your Perfect Meal
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            maxWidth: "800px",
            margin: "0 auto 1.5rem",
          }}
        >
          UChef lets you customize your meals exactly how you want them. Choose
          your ingredients, control your portions, and enjoy your perfect meal.
        </p>
        <Link
          to="/restaurants"
          className="btn btn-primary"
          style={{ fontSize: "1.1rem", padding: "0.75rem 2rem" }}
        >
          Order Now
        </Link>
      </section>

      {/* Featured Restaurants Section */}
      <section className="section">
        <div
          className="section-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2>Featured Restaurants</h2>
          <Link to="/restaurants" className="btn btn-outline">
            View All
          </Link>
        </div>

        {restaurantsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="slider-container" style={{ margin: "0 -15px" }}>
            <Slider {...sliderSettings}>
              {featuredRestaurants.map((restaurant) => (
                <div key={restaurant.id} style={{ padding: "0 15px" }}>
                  <div className="card">
                    <img
                      src={
                        restaurant.logo ||
                        "https://via.placeholder.com/300x200?text=Restaurant"
                      }
                      alt={restaurant.name}
                      className="card-img"
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body">
                      <h3 className="card-title">{restaurant.name}</h3>
                      <p className="card-text">
                        {restaurant.description.substring(0, 100)}...
                      </p>
                      <Link
                        to={`/restaurants/${restaurant.id}`}
                        className="btn btn-primary"
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}
      </section>

      {/* Featured Meals Section */}
      <section className="section">
        <div
          className="section-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2>Featured Meals</h2>
          <Link to="/meals" className="btn btn-outline">
            View All
          </Link>
        </div>

        {mealsLoading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="slider-container" style={{ margin: "0 -15px" }}>
            <Slider {...sliderSettings}>
              {featuredMeals.map((meal) => (
                <div key={meal.id} style={{ padding: "0 15px" }}>
                  <div className="card">
                    <img
                      src={
                        meal.image ||
                        "https://via.placeholder.com/300x200?text=Meal"
                      }
                      alt={meal.name}
                      className="card-img"
                      style={{ height: "200px", objectFit: "cover" }}
                    />
                    <div className="card-body">
                      <h3 className="card-title">{meal.name}</h3>
                      <p className="card-text">
                        {meal.description.substring(0, 100)}...
                      </p>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: "bold" }}>
                          ${meal.base_price}
                        </span>
                        <Link
                          to={`/meals/${meal.id}`}
                          className="btn btn-primary"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
        )}
      </section>

      {/* Featured Custom Meals Section */}
      <section className="section">
        <div
          className="section-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2>Featured Custom Meals</h2>
          <Link to="/top-custom-meals" className="btn btn-outline">
            View All
          </Link>
        </div>

        {loadingCustomMeals ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="slider-container" style={{ margin: "0 -15px" }}>
            {topCustomMeals.length > 0 ? (
              <Slider {...sliderSettings}>
                {topCustomMeals.map((meal) => (
                  <div key={meal.id} style={{ padding: "0 15px" }}>
                    <div className="card">
                      <div
                        className="card-img"
                        style={{
                          height: "200px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "var(--accent-light)",
                          color: "var(--primary-color)",
                          fontSize: "1.2rem",
                          fontWeight: "bold",
                        }}
                      >
                        Custom Meal
                      </div>
                      <div className="card-body">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                          }}
                        >
                          <h3 className="card-title">{meal.name}</h3>
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <span style={{ marginRight: "5px" }}>⭐</span>
                            <span>{meal.avg_rating?.toFixed(1) || "N/A"}</span>
                          </div>
                        </div>
                        <p
                          className="card-text"
                          style={{ marginBottom: "0.5rem" }}
                        >
                          By: {meal.user_username || "Anonymous"}
                        </p>
                        <p className="card-text">
                          {meal.description?.substring(0, 80) ||
                            "No description"}
                          ...
                        </p>
                        <Link
                          to={`/meals/custom/${meal.id}`}
                          className="btn btn-primary"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p>
                  No custom meals available yet. Be the first to create one!
                </p>
                <Link
                  to="/create-custom-meal"
                  className="btn btn-primary"
                  style={{ marginTop: "1rem" }}
                >
                  Create Custom Meal
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Top Custom Meals Competition Section */}
      <section
        className="section"
        style={{
          textAlign: "center",
          padding: "3rem 0",
          backgroundColor: "var(--accent-light)",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ marginBottom: "1rem" }}>Custom Meal Competition</h2>
        <p
          style={{
            fontSize: "1.1rem",
            maxWidth: "800px",
            margin: "0 auto 1.5rem",
          }}
        >
          Create your own custom meal and compete to be in the Top 10! Show off
          your culinary creativity and get recognized by the UChef community.
        </p>
        <Link
          to="/top-custom-meals"
          className="btn btn-primary"
          style={{
            fontSize: "1.1rem",
            padding: "0.75rem 2rem",
            marginBottom: "1rem",
          }}
        >
          View Top Custom Meals
        </Link>
      </section>

      {/* How It Works Section */}
      <section
        className="section"
        style={{ textAlign: "center", padding: "3rem 0" }}
      >
        <h2 style={{ marginBottom: "2rem" }}>How UChef Works</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "2rem",
          }}
        >
          <div className="step">
            <div
              className="step-icon"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-color)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 1rem",
              }}
            >
              1
            </div>
            <h3>Choose a Restaurant</h3>
            <p>
              Browse our selection of restaurants and find your favorite
              cuisine.
            </p>
          </div>

          <div className="step">
            <div
              className="step-icon"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-color)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 1rem",
              }}
            >
              2
            </div>
            <h3>Customize Your Meal</h3>
            <p>
              Select ingredients, adjust portions, and create your perfect meal.
            </p>
          </div>

          <div className="step">
            <div
              className="step-icon"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "var(--primary-color)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 1rem",
              }}
            >
              3
            </div>
            <h3>Place Your Order</h3>
            <p>
              Review your order, make payment, and wait for your delicious meal.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
