import { createSlice } from '@reduxjs/toolkit';

// Helper function to get user-specific cart from localStorage
const getUserCart = (userId) => {
  if (!userId) return null;
  
  const savedCart = localStorage.getItem(`cart_${userId}`);
  return savedCart ? JSON.parse(savedCart) : null;
};

// Helper function to save user-specific cart to localStorage
const saveUserCart = (userId, cart) => {
  if (!userId) return;
  
  localStorage.setItem(`cart_${userId}`, JSON.stringify(cart));
};

const initialState = {
  items: [],
  restaurantId: null,
  restaurantName: '',
  total: 0,
  userId: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Set the user ID for the cart
    setUserId: (state, action) => {
      const userId = action.payload;
      state.userId = userId;
      
      // If we have a userId, load the user's cart from localStorage
      if (userId) {
        const userCart = getUserCart(userId);
        if (userCart) {
          state.items = userCart.items || [];
          state.restaurantId = userCart.restaurantId || null;
          state.restaurantName = userCart.restaurantName || '';
          state.total = userCart.total || 0;
        }
      }
    },
    
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
      
      // Save to localStorage if we have a userId
      if (state.userId) {
        saveUserCart(state.userId, {
          items: state.items,
          restaurantId: state.restaurantId,
          restaurantName: state.restaurantName,
          total: state.total
        });
      }
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
      
      // Save to localStorage if we have a userId
      if (state.userId) {
        saveUserCart(state.userId, {
          items: state.items,
          restaurantId: state.restaurantId,
          restaurantName: state.restaurantName,
          total: state.total
        });
      }
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
      
      // Save to localStorage if we have a userId
      if (state.userId) {
        saveUserCart(state.userId, {
          items: state.items,
          restaurantId: state.restaurantId,
          restaurantName: state.restaurantName,
          total: state.total
        });
      }
    },
    
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = '';
      state.total = 0;
      
      // Clear from localStorage if we have a userId
      if (state.userId) {
        localStorage.removeItem(`cart_${state.userId}`);
      }
    },
  },
});

export const { setUserId, addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
