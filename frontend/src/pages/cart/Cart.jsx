import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { removeFromCart, updateQuantity, clearCart } from '../../store/slices/cartSlice';

const Cart = () => {
  const { items, restaurantName, total } = useSelector(state => state.cart);
  const { isAuthenticated } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const handleRemoveItem = (id, type) => {
    dispatch(removeFromCart({ id, type }));
  };
  
  const handleQuantityChange = (id, type, quantity) => {
    dispatch(updateQuantity({ id, type, quantity }));
  };
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    navigate('/checkout');
  };
  
  if (items.length === 0) {
    return (
      <div className="empty-cart" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h1>Your Cart is Empty</h1>
        <p style={{ marginBottom: '2rem' }}>Looks like you haven't added any items to your cart yet.</p>
        <Link to="/restaurants" className="btn btn-primary">
          Browse Restaurants
        </Link>
      </div>
    );
  }
  
  return (
    <div className="cart-page">
      <h1>Your Cart</h1>
      <p>Items from {restaurantName}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div className="cart-items">
          {items.map(item => (
            <div key={`${item.type}-${item.id || item.customMealId}`} className="cart-item">
              <img 
                src={item.image || 'https://via.placeholder.com/100x100?text=Meal'} 
                alt={item.name} 
                className="cart-item-img"
              />
              
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                <p>{item.type === 'custom' ? 'Custom Meal' : ''}</p>
                <p>${item.price} each</p>
                
                {item.specialInstructions && (
                  <p><small>Special instructions: {item.specialInstructions}</small></p>
                )}
              </div>
              
              <div className="cart-item-actions">
                <div className="quantity-control">
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(
                      item.type === 'regular' ? item.id : item.customMealId,
                      item.type,
                      Math.max(1, item.quantity - 1)
                    )}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(
                      item.type === 'regular' ? item.id : item.customMealId,
                      item.type,
                      parseInt(e.target.value) || 1
                    )}
                    className="quantity-input"
                    min="1"
                  />
                  <button 
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(
                      item.type === 'regular' ? item.id : item.customMealId,
                      item.type,
                      item.quantity + 1
                    )}
                  >
                    +
                  </button>
                </div>
                
                <button 
                  className="btn btn-outline"
                  style={{ marginLeft: '1rem', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                  onClick={() => handleRemoveItem(
                    item.type === 'regular' ? item.id : item.customMealId,
                    item.type
                  )}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div style={{ margin: '1.5rem 0', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            {items.map(item => (
              <div 
                key={`${item.type}-${item.id || item.customMealId}-summary`} 
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}
              >
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>
          
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={() => dispatch(clearCart())}
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
