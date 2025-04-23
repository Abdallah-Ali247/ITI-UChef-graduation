import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// API URL constant
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ReviewForm = ({
  type,
  itemId,
  onReviewSubmitted,
  existingReview = null,
}) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    rating: existingReview?.rating || 5,
    comment: existingReview?.comment || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  // Get the item ID field name based on review type
  const getItemField = () => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "rating" ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Validate form
    if (formData.rating < 1 || formData.rating > 5) {
      setError("Rating must be between 1 and 5");
      return;
    }

    if (!formData.comment.trim()) {
      setError("Please provide a comment");
      return;
    }

    if (formData.comment.trim().length < 10) {
      setError("Comment must be at least 10 characters long");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication required");

      const endpoint = getEndpoint();
      const itemField = getItemField();

      if (!endpoint || !itemField) {
        throw new Error("Invalid review type");
      }

      // Prepare the review data
      const reviewData = {
        rating: formData.rating,
        comment: formData.comment,
        [itemField]: itemId,
      };

      // Debug information
      console.log("Submitting review with data:", reviewData);
      console.log("Token:", token);
      console.log("Endpoint:", endpoint);
      console.log("Item field:", itemField);
      console.log("Item ID:", itemId);

      let response;

      // Create the headers with the authentication token
      const headers = {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      };

      console.log("Request headers:", headers);

      if (existingReview) {
        // Update existing review
        response = await axios.put(
          `${endpoint}${existingReview.id}/`,
          reviewData,
          { headers }
        );
      } else {
        // Create new review
        response = await axios.post(endpoint, reviewData, { headers });
      }

      setSuccess("Review submitted successfully!");

      // Reset form if it's a new review
      if (!existingReview) {
        setFormData({
          rating: 5,
          comment: "",
        });
      }

      // Notify parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(response.data);
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error("Error submitting review:", error);
      console.log("Error response data:", error.response?.data);

      if (
        error.response?.status === 400 &&
        error.response?.data?.non_field_errors?.[0]?.includes("unique")
      ) {
        setError(
          "You have already reviewed this item. You can edit your existing review instead."
        );
      } else if (error.response?.data) {
        // Display the actual error message from the server
        const errorMessages = [];
        for (const field in error.response.data) {
          errorMessages.push(`${field}: ${error.response.data[field]}`);
        }
        setError(errorMessages.join(", "));
      } else {
        setError(
          error.response?.data?.detail ||
            error.message ||
            "Failed to submit review"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h3>{existingReview ? "Edit Review" : "Write a Review"}</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="rating">Rating (1-5 stars)*</label>
          <div className="rating-input">
            {[1, 2, 3, 4, 5].map((star) => (
              <label key={star} className="star-label">
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  checked={formData.rating === star}
                  onChange={handleChange}
                  className="star-input"
                />
                <span
                  className={`star ${formData.rating >= star ? "filled" : ""}`}
                >
                  ★
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Your Review*</label>
          <textarea
            id="comment"
            name="comment"
            value={formData.comment}
            onChange={handleChange}
            rows={4}
            placeholder="Share your experience (minimum 10 characters)"
            required
          ></textarea>
          <small>{formData.comment.length}/500 characters</small>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading
            ? "Submitting..."
            : existingReview
            ? "Update Review"
            : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
