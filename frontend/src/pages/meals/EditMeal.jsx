import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

const EditMeal = () => {
  const { mealId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { currentRestaurant } = useSelector((state) => state.restaurants);

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    category: "",
    preparation_time: 30,
    is_available: true,
    is_customizable: false,
    image: null,
  });

  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const {
    name,
    description,
    base_price,
    category,
    preparation_time,
    is_available,
    is_customizable,
  } = formData;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.user_type !== "restaurant") {
      navigate("/");
      return;
    }

    const fetchMeal = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required. Please log in again.");
          setFetchLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/meals/meals/${mealId}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        const meal = response.data;

        setFormData({
          name: meal.name || "",
          description: meal.description || "",
          base_price: meal.base_price || "",
          category: meal.category || "",
          preparation_time: meal.preparation_time || 30,
          is_available:
            meal.is_available !== undefined ? meal.is_available : true,
          is_customizable:
            meal.is_customizable !== undefined ? meal.is_customizable : false,
        });

        // If meal has ingredients, set them as selected
        if (meal.ingredients && meal.ingredients.length > 0) {
          setSelectedIngredients(meal.ingredients.map((ing) => ing.id));
        }

        setFetchLoading(false);
      } catch (err) {
        console.error("Failed to fetch meal:", err);
        setError("Failed to load meal details. Please try again.");
        setFetchLoading(false);
      }
    };

    // Fetch ingredients for this restaurant
    const fetchIngredients = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !currentRestaurant) return;

        const response = await axios.get(
          `${API_URL}/restaurants/restaurants/${currentRestaurant.id}/ingredients/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        setIngredients(response.data);
      } catch (err) {
        console.error("Failed to fetch ingredients:", err);
      }
    };

    // Fetch meal categories
    const fetchCategories = async () => {
      setCategoryLoading(true);
      try {
        const response = await axios.get(`${API_URL}/meals/categories/`);
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load meal categories. Please try again.");
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchMeal();
    fetchIngredients();
    fetchCategories();
  }, [isAuthenticated, navigate, user, currentRestaurant, mealId]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleNewCategoryChange = (e) => {
    const { name, value } = e.target;
    setNewCategory((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.name) {
      alert("Category name is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      const response = await axios.post(
        `${API_URL}/meals/categories/`,
        newCategory,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Add the new category to the list and select it
      setCategories([...categories, response.data]);
      setFormData((prevState) => ({
        ...prevState,
        category: response.data.id,
      }));

      // Reset the form and hide it
      setNewCategory({ name: "", description: "" });
      setShowNewCategoryForm(false);
    } catch (err) {
      console.error("Failed to create category:", err);
      alert(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Failed to create category. Please try again."
      );
    }
  };

  const handleIngredientToggle = (ingredientId) => {
    setSelectedIngredients((prevSelected) => {
      if (prevSelected.includes(ingredientId)) {
        return prevSelected.filter((id) => id !== ingredientId);
      } else {
        return [...prevSelected, ingredientId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in again.");
        setLoading(false);
        return;
      }

      if (!currentRestaurant) {
        setError("Restaurant information not found.");
        setLoading(false);
        return;
      }

      // Create FormData object for file upload
      const mealData = new FormData();
      mealData.append("name", name);
      mealData.append("description", description);
      mealData.append("base_price", base_price);
      mealData.append("category", category);
      mealData.append("preparation_time", preparation_time);
      mealData.append("is_available", is_available);
      mealData.append("is_customizable", is_customizable);
      mealData.append("restaurant", currentRestaurant.id);

      // Add selected ingredients
      selectedIngredients.forEach((ingredientId) => {
        mealData.append("ingredients", ingredientId);
      });

      // Add image if provided
      if (formData.image) {
        mealData.append("image", formData.image);
      }

      const response = await axios.put(
        `${API_URL}/meals/meals/${mealId}/`,
        mealData,
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Success - navigate to restaurant dashboard
      navigate("/restaurant-dashboard");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          JSON.stringify(err.response?.data) ||
          "Failed to update meal. Please try again."
      );
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.user_type !== "restaurant") {
    return (
      <div className="alert alert-danger">
        You must be logged in as a restaurant owner to edit meals.
      </div>
    );
  }

  if (!currentRestaurant) {
    return (
      <div className="alert alert-warning">
        You need to set up your restaurant before editing meals.
      </div>
    );
  }

  if (fetchLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading meal details...</p>
      </div>
    );
  }

  return (
    <div className="edit-meal-page">
      <h1>Edit Meal</h1>
      <p>Update the details of your menu item.</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Meal Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                placeholder="Describe your meal, including key ingredients and flavors"
                required
              ></textarea>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label htmlFor="base_price" className="form-label">
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  value={base_price}
                  onChange={handleChange}
                  className="form-control"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category" className="form-label">
                  Category *
                </label>
                {categoryLoading ? (
                  <div className="loading-indicator">Loading categories...</div>
                ) : (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <select
                        id="category"
                        name="category"
                        value={category}
                        onChange={handleChange}
                        className="form-control"
                        required={!showNewCategoryForm}
                        disabled={showNewCategoryForm}
                        style={{ flex: 1 }}
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() =>
                          setShowNewCategoryForm(!showNewCategoryForm)
                        }
                      >
                        {showNewCategoryForm ? "Cancel" : "New Category"}
                      </button>
                    </div>

                    {showNewCategoryForm && (
                      <div
                        className="new-category-form"
                        style={{
                          border: "1px solid var(--light-gray)",
                          padding: "1rem",
                          borderRadius: "var(--border-radius)",
                          marginBottom: "1rem",
                        }}
                      >
                        <h4>Create New Category</h4>
                        <div className="form-group">
                          <label
                            htmlFor="new-category-name"
                            className="form-label"
                          >
                            Category Name *
                          </label>
                          <input
                            type="text"
                            id="new-category-name"
                            name="name"
                            value={newCategory.name}
                            onChange={handleNewCategoryChange}
                            className="form-control"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label
                            htmlFor="new-category-description"
                            className="form-label"
                          >
                            Description
                          </label>
                          <textarea
                            id="new-category-description"
                            name="description"
                            value={newCategory.description}
                            onChange={handleNewCategoryChange}
                            className="form-control"
                            rows="2"
                          ></textarea>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleCreateCategory}
                          style={{ marginTop: "0.5rem" }}
                        >
                          Create Category
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="preparation_time" className="form-label">
                Preparation Time (minutes) *
              </label>
              <input
                type="number"
                id="preparation_time"
                name="preparation_time"
                value={preparation_time}
                onChange={handleChange}
                className="form-control"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="image" className="form-label">
                Update Meal Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleChange}
                className="form-control"
                accept="image/*"
              />
              <small className="form-text text-muted">
                Upload a new image only if you want to change the current one
              </small>
            </div>

            <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
              <div
                className="form-group"
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  id="is_available"
                  name="is_available"
                  checked={is_available}
                  onChange={handleChange}
                  style={{ marginRight: "0.5rem" }}
                />
                <label htmlFor="is_available">Available on menu</label>
              </div>

              <div
                className="form-group"
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  id="is_customizable"
                  name="is_customizable"
                  checked={is_customizable}
                  onChange={handleChange}
                  style={{ marginRight: "0.5rem" }}
                />
                <label htmlFor="is_customizable">Allow customization</label>
              </div>
            </div>

            {ingredients.length > 0 && (
              <div className="form-group" style={{ marginTop: "1.5rem" }}>
                <label className="form-label">Ingredients</label>
                <div
                  className="ingredients-list"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {ingredients.map((ingredient) => (
                    <div key={ingredient.id} className="form-check">
                      <input
                        type="checkbox"
                        id={`ingredient-${ingredient.id}`}
                        checked={selectedIngredients.includes(ingredient.id)}
                        onChange={() => handleIngredientToggle(ingredient.id)}
                        className="form-check-input"
                      />
                      <label
                        htmlFor={`ingredient-${ingredient.id}`}
                        className="form-check-label"
                      >
                        {ingredient.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: "2rem" }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Meal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditMeal;
