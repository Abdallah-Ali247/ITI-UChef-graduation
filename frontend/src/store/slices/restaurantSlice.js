import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Async thunks
export const fetchRestaurants = createAsyncThunk(
  'restaurants/fetchRestaurants',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/restaurants/restaurants/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchRestaurantById = createAsyncThunk(
  'restaurants/fetchRestaurantById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/restaurants/restaurants/${id}/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchRestaurantIngredients = createAsyncThunk(
  'restaurants/fetchRestaurantIngredients',
  async (restaurantId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/restaurants/restaurants/${restaurantId}/ingredients/`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchRestaurantByOwner = createAsyncThunk(
  'restaurants/fetchRestaurantByOwner',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/restaurants/restaurants/my-restaurant/`, {
        headers: {
          Authorization: `Token ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateRestaurant = createAsyncThunk(
  'restaurants/updateRestaurant',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const response = await axios.patch(`${API_URL}/restaurants/restaurants/${id}/`, data, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateRestaurantStatus = createAsyncThunk(
  'restaurants/updateRestaurantStatus',
  async ({ id, status, rejectionReason = null }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return rejectWithValue('Authentication required');
      }
      
      const data = { 
        is_approved: status === 'approved',
        rejection_reason: rejectionReason
      };
      
      const response = await axios.patch(`${API_URL}/restaurants/restaurants/${id}/`, data, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  restaurants: [],
  currentRestaurant: null,
  ingredients: [],
  loading: false,
  error: null,
};

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    clearRestaurantError: (state) => {
      state.error = null;
    },
    clearCurrentRestaurant: (state) => {
      state.currentRestaurant = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all restaurants
      .addCase(fetchRestaurants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurants.fulfilled, (state, action) => {
        state.loading = false;
        state.restaurants = action.payload;
      })
      .addCase(fetchRestaurants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch restaurants';
      })
      
      // Fetch restaurant by ID
      .addCase(fetchRestaurantById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRestaurant = action.payload;
      })
      .addCase(fetchRestaurantById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch restaurant';
      })
      
      // Fetch restaurant ingredients
      .addCase(fetchRestaurantIngredients.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantIngredients.fulfilled, (state, action) => {
        state.loading = false;
        state.ingredients = action.payload;
      })
      .addCase(fetchRestaurantIngredients.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch ingredients';
      })
      
      // Fetch restaurant by owner
      .addCase(fetchRestaurantByOwner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRestaurantByOwner.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRestaurant = action.payload;
      })
      .addCase(fetchRestaurantByOwner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch your restaurant';
      })
      
      // Update restaurant
      .addCase(updateRestaurant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRestaurant.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRestaurant = action.payload;
      })
      .addCase(updateRestaurant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update restaurant';
      })
      
      // Update restaurant status (approve/reject)
      .addCase(updateRestaurantStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRestaurantStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the restaurant in the restaurants array
        const index = state.restaurants.findIndex(r => r.id === action.payload.id);
        if (index !== -1) {
          state.restaurants[index] = action.payload;
        }
      })
      .addCase(updateRestaurantStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update restaurant status';
      });
  },
});

export const { clearRestaurantError, clearCurrentRestaurant } = restaurantSlice.actions;
export default restaurantSlice.reducer;
