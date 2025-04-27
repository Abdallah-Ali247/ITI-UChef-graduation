import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserOrders } from '../../store/slices/orderSlice';

const OrderHistory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orders);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchUserOrders());
  }, [dispatch, isAuthenticated, navigate]);
  
  // Helper function to get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'confirmed':
        return 'status-confirmed';
      case 'preparing':
        return 'status-preparing';
      case 'ready':
        return 'status-ready';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="alert alert-danger">
        {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="empty-orders" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h1>No Orders Yet</h1>
        <p style={{ marginBottom: '2rem' }}>You haven't placed any orders yet.</p>
        <Link to="/restaurants" className="btn btn-primary">
          Browse Restaurants
        </Link>
      </div>
    );
  }
  
  return (
    <div className="order-history-page">
      <h1>Order History</h1>
      
      <div className="orders-list" style={{ marginTop: '2rem' }}>
        {orders.map(order => (
          <div key={order.id} className="order-card card">
            <div className="order-header">
              <div>
                <h3>Order #{order.id}</h3>
                <p>{order.restaurant_name}</p>
                <p><small>{formatDate(order.created_at)}</small></p>
              </div>
              
              <div>
                <span className={`order-status ${getStatusClass(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <div style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>
                  ${order.total_price}
                </div>
              </div>
            </div>
            
            <div className="order-items">
              <h4>Items</h4>
              <ul>
                {order.items.map(item => (
                  <li key={item.id} className="order-item">
                    {item.meal_details ? item.meal_details.name : 
                     item.custom_meal_details ? item.custom_meal_details.name : 
                     `Meal #${item.meal || item.custom_meal}`} 
                    x {item.quantity} - ${item.price * item.quantity}
                  </li>
                ))}
              </ul>
              
              <Link to={`/orders/${order.id}`} className="btn btn-outline" style={{ marginTop: '1rem' }}>
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;