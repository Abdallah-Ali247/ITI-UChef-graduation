import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrderById } from '../../store/slices/orderSlice';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector(state => state.orders);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchOrderById(id));
  }, [dispatch, id, isAuthenticated, navigate]);
  
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
  
  if (!currentOrder) {
    return (
      <div className="alert alert-warning">
        Order not found.
      </div>
    );
  }
  
  return (
    <div className="order-detail-page">
      <div className="breadcrumb" style={{ marginBottom: '1rem' }}>
        <Link to="/orders">Orders</Link> &gt; 
        <span> Order #{currentOrder.id}</span>
      </div>
      
      <div className="order-status-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1>Order #{currentOrder.id}</h1>
        <span className={`order-status ${getStatusClass(currentOrder.status)}`} style={{ fontSize: '1.2rem' }}>
          {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="order-details">
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-body">
              <h2>Order Information</h2>
              <p><strong>Restaurant:</strong> {currentOrder.restaurant_name}</p>
              <p><strong>Order Date:</strong> {formatDate(currentOrder.created_at)}</p>
              <p><strong>Delivery Address:</strong> {currentOrder.delivery_address}</p>
              
              {currentOrder.delivery_notes && (
                <p><strong>Delivery Notes:</strong> {currentOrder.delivery_notes}</p>
              )}
            </div>
          </div>
          
          <div className="card">
            <div className="card-body">
              <h2>Order Items</h2>
              <div className="order-items-list">
                {currentOrder.items.map(item => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '1rem 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <div>
                      <h4>
                        {item.custom_meal_details ? (
                          <>
                            {item.custom_meal_details.name}
                            <span style={{ color: '#666' }}> (Custom)</span>
                          </>
                        ) : item.meal_details ? (
                          item.meal_details.name
                        ) : (
                          `Meal #${item.meal}`
                        )}
                      </h4>
                      
                      {item.special_instructions && (
                        <p><small>Special instructions: {item.special_instructions}</small></p>
                      )}
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p>{item.quantity} x ${item.price}</p>
                      <p><strong>${(item.quantity * item.price).toFixed(2)}</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="order-summary">
          <div className="card">
            <div className="card-body">
              <h2>Payment Summary</h2>
              
              <div style={{ margin: '1.5rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Subtotal</span>
                  <span>${currentOrder.total_price}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Delivery Fee</span>
                  <span>$0.00</span>
                </div>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontWeight: 'bold', 
                fontSize: '1.2rem',
                borderTop: '1px solid #eee',
                paddingTop: '1rem'
              }}>
                <span>Total</span>
                <span>${currentOrder.total_price}</span>
              </div>
              
              {currentOrder.payment && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3>Payment Information</h3>
                  <p><strong>Method:</strong> {
                    currentOrder.payment.payment_method.replace('_', ' ')
                      .split(' ')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(' ')
                  }</p>
                  <p><strong>Status:</strong> {
                    currentOrder.payment.status.charAt(0).toUpperCase() + 
                    currentOrder.payment.status.slice(1)
                  }</p>
                  <p><strong>Date:</strong> {formatDate(currentOrder.payment.payment_date)}</p>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/orders" className="btn btn-outline" style={{ width: '100%' }}>
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;