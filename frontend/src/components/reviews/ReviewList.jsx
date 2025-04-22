import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import ReviewForm from "./ReviewForm";

// API URL constant
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ReviewList = ({ type, itemId }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [editingReview, setEditingReview] = useState(false);

  // Determine the API endpoint based on review type
  const getEndpoint = () => {
    switch (type) {
      case "restaurant":
        return `${API_URL}/reviews/restaurant-reviews/`;
      case "meal":
        return `${API_URL}/reviews/meal-reviews/`;
      case "custom_meal":
        return `${API_URL}/reviews/custom-meal-reviews/`;
      default:
        return null;
    }
  };

  // Get the query parameter based on review type
  const getQueryParam = () => {
    switch (type) {
      case "restaurant":
        return "restaurant";
      case "meal":
        return "meal";
      case "custom_meal":
        return "custom_meal";
      default:
        return null;
    }
  };

  // Fetch reviews for the item
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const endpoint = getEndpoint();
      const queryParam = getQueryParam();

      if (!endpoint || !queryParam) {
        throw new Error("Invalid review type");
      }

      console.log(`Fetching reviews from: ${endpoint}?${queryParam}=${itemId}`);
      const response = await axios.get(`${endpoint}?${queryParam}=${itemId}`);
      console.log("Reviews data:", response.data);
      setReviews(response.data);

      // Check if the user has already reviewed this item
      if (isAuthenticated && user) {
        console.log("Looking for user review with user ID:", user.id);
        const userReviewFound = response.data.find(
          (review) => review.user === user.id
        );
        console.log("User review found:", userReviewFound);
        if (userReviewFound) {
          setUserReview(userReviewFound);
        } else {
          setUserReview(null);
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // Delete a review
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const endpoint = getEndpoint();

      await axios.delete(`${endpoint}${reviewId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      // Update the reviews list
      setReviews(reviews.filter((review) => review.id !== reviewId));
      setUserReview(null);
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    }
  };

  // Handle review submission (new or updated)
  const handleReviewSubmitted = (reviewData) => {
    if (editingReview) {
      // Update existing review in the list
      setReviews(
        reviews.map((review) =>
          review.id === reviewData.id ? reviewData : review
        )
      );
      setUserReview(reviewData);
    } else {
      // Add new review to the list
      setReviews([...reviews, reviewData]);
      setUserReview(reviewData);
    }

    setShowReviewForm(false);
    setEditingReview(false);
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;

    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Load reviews when component mounts or when itemId changes
  useEffect(() => {
    if (itemId) {
      fetchReviews();
    }
  }, [itemId, type]);

  // Render star rating
  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`star ${rating >= star ? "filled" : ""}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return <div className="loading">Loading reviews...</div>;
  }

  if (error && reviews.length === 0) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="reviews-section">
      <h3>Reviews</h3>

      {reviews.length > 0 ? (
        <div className="reviews-summary">
          <div className="average-rating">
            <span className="rating-number">{calculateAverageRating()}</span>
            {renderStars(calculateAverageRating())}
            <span className="review-count">
              ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      ) : (
        <p>No reviews yet. Be the first to review!</p>
      )}

      {isAuthenticated ? (
        userReview ? (
          <div className="user-review-actions">
            <p>You've already reviewed this {type}.</p>
            <div className="action-buttons">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setEditingReview(true);
                  setShowReviewForm(true);
                }}
              >
                Edit Your Review
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteReview(userReview.id)}
              >
                Delete Your Review
              </button>
            </div>
          </div>
        ) : (
          <div className="review-form-toggle">
            {showReviewForm ? (
              <ReviewForm
                type={type}
                itemId={itemId}
                onReviewSubmitted={handleReviewSubmitted}
              />
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowReviewForm(true)}
              >
                Write a Review
              </button>
            )}
          </div>
        )
      ) : (
        <p>
          <a href="/login">Log in</a> to write a review.
        </p>
      )}

      {editingReview && (
        <div className="edit-review-form">
          <ReviewForm
            type={type}
            itemId={itemId}
            existingReview={userReview}
            onReviewSubmitted={handleReviewSubmitted}
          />
          <button
            className="btn btn-outline"
            onClick={() => {
              setEditingReview(false);
              setShowReviewForm(false);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-card">
            <div className="review-header">
              <div className="reviewer-info">
                <strong>{review.user_username}</strong>
                <span className="review-date">
                  {formatDate(review.created_at)}
                </span>
              </div>
              <div className="review-rating">{renderStars(review.rating)}</div>
            </div>
            <div className="review-content">
              <p>{review.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewList;
