import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Async thunks
export const fetchMeals = createAsyncThunk(
  'meals/fetchMeals',
  async (params, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/meals/meals/`;
      if (params?.restaurantId) {
        url += `?restaurant=${params.restaurantId}`;
      }
      if (params?.categoryId) {
        url += params.restaurantId ? `&category=${params.categoryId}` : `?category=${params.categoryId}`;
      }
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchMealById = createAsyncThunk(
  'meals/fetchMealById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/meals/meals/${id}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchMealCategories = createAsyncThunk(
  'meals/fetchMealCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/meals/categories/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchCustomMeals = createAsyncThunk(
  'meals/fetchCustomMeals',
  async (params, { rejectWithValue }) => {
    try {
      let url = `${API_URL}/meals/custom-meals/`;
      if (params?.userId) {
        url += `?user=${params.userId}`;
      }
      if (params?.isPublic !== undefined) {
        url += params.userId ? `&is_public=${params.isPublic}` : `?is_public=${params.isPublic}`;
      }
      
      const token = localStorage.getItem('token');
      const response = await axios.get(url, {
        headers: token ? { Authorization: `Token ${token}` } : {}
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createCustomMeal = createAsyncThunk(
  'meals/createCustomMeal',
  async ({ mealData, ingredients }, { rejectWithValue, getState }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      // Get the current user ID from auth state
      const { user } = getState().auth;
      
      // Create the payload with required fields
      const payload = {
        ...mealData,
        user: user.id,
        ingredients: ingredients
      };
      
      const response = await axios.post(`${API_URL}/meals/custom-meals/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Custom meal creation error:', error.response?.data);
      return rejectWithValue(error.response?.data || 'Failed to create custom meal');
    }
  }
);

const initialState = {
  meals: [],
  currentMeal: null,
  categories: [],
  customMeals: [],
  loading: false,
  error: null,
};

const mealSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {
    clearMealError: (state) => {
      state.error = null;
    },
    clearCurrentMeal: (state) => {
      state.currentMeal = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all meals
      .addCase(fetchMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeals.fulfilled, (state, action) => {
        state.loading = false;
        state.meals = action.payload;
      })
      .addCase(fetchMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch meals';
      })
      
      // Fetch meal by ID
      .addCase(fetchMealById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMeal = action.payload;
      })
      .addCase(fetchMealById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch meal';
      })
      
      // Fetch meal categories
      .addCase(fetchMealCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMealCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchMealCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch categories';
      })
      
      // Fetch custom meals
      .addCase(fetchCustomMeals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomMeals.fulfilled, (state, action) => {
        state.loading = false;
        state.customMeals = action.payload;
      })
      .addCase(fetchCustomMeals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch custom meals';
      })
      
      // Create custom meal
      .addCase(createCustomMeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomMeal.fulfilled, (state, action) => {
        state.loading = false;
        state.customMeals.push(action.payload);
      })
      .addCase(createCustomMeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create custom meal';
      });
  },
});

export const { clearMealError, clearCurrentMeal } = mealSlice.actions;
export default mealSlice.reducer;
