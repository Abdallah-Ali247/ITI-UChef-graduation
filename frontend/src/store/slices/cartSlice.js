import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  restaurantId: null,
  restaurantName: '',
  total: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { item, restaurantId, restaurantName } = action.payload;
      
      // If adding from a different restaurant, clear the cart first
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
      }
      
      // Set the restaurant info
      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;
      
      // Check if the item already exists in the cart
      const existingItemIndex = state.items.findIndex(
        cartItem => {
          if (item.type === 'custom' && cartItem.type === 'custom') {
            return item.customMealId === cartItem.customMealId;
          } else if (item.type === 'regular' && cartItem.type === 'regular') {
            return item.id === cartItem.id;
          }
          return false;
        }
      );
      
      if (existingItemIndex >= 0) {
        // If item exists, increase quantity
        state.items[existingItemIndex].quantity += item.quantity || 1;
      } else {
        // Otherwise add new item
        state.items.push({
          ...item,
          quantity: item.quantity || 1,
          cartItemId: Date.now() // Add a unique identifier for each cart item
        });
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
    },
    
    removeFromCart: (state, action) => {
      const { id, type } = action.payload;
      
      state.items = state.items.filter(item => 
        !(item.id === id && item.type === type) && 
        !(item.customMealId === id && type === 'custom')
      );
      
      // If cart is empty, reset restaurant info
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = '';
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
    },
    
    updateQuantity: (state, action) => {
      const { id, type, quantity } = action.payload;
      
      const itemIndex = state.items.findIndex(item => 
        (item.id === id && item.type === type) || 
        (item.customMealId === id && type === 'custom')
      );
      
      if (itemIndex >= 0) {
        state.items[itemIndex].quantity = quantity;
        
        // Remove item if quantity is 0
        if (quantity <= 0) {
          state.items.splice(itemIndex, 1);
          
          // If cart is empty, reset restaurant info
          if (state.items.length === 0) {
            state.restaurantId = null;
            state.restaurantName = '';
          }
        }
      }
      
      // Recalculate total
      state.total = state.items.reduce(
        (sum, item) => sum + (item.price * item.quantity), 
        0
      );
    },
    
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = '';
      state.total = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
