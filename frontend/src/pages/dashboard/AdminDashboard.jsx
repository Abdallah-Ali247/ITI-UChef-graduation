import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers } from '../../store/slices/authSlice';
import { fetchRestaurants } from '../../store/slices/restaurantSlice';
import { fetchUserOrders } from '../../store/slices/orderSlice';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, users, loading: authLoading, error: authError } = useSelector(state => state.auth);
  const { restaurants, loading: restaurantsLoading, error: restaurantsError } = useSelector(state => state.restaurants);
  const { orders, loading: ordersLoading, error: ordersError } = useSelector(state => state.orders);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    
    // Fetch initial data for the dashboard
    dispatch(fetchAllUsers());
    dispatch(fetchRestaurants());
    dispatch(fetchUserOrders());
  }, [dispatch, isAuthenticated, navigate, user]);
  
  // Filter users based on search term
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Filter restaurants based on search term
  const filteredRestaurants = restaurants?.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    restaurant.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter orders based on search term and status
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.id.toString().includes(searchTerm) || 
      (order.user_details?.username && order.user_details.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.restaurant_name && order.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      <div className="menu-tabs" style={{ marginTop: '2rem' }}>
        <div 
          className={`menu-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div 
          className={`menu-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </div>
        <div 
          className={`menu-tab ${activeTab === 'restaurants' ? 'active' : ''}`}
          onClick={() => setActiveTab('restaurants')}
        >
          Restaurants
        </div>
        <div 
          className={`menu-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </div>
        <div 
          className={`menu-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </div>
      </div>
      
      <div className="tab-content" style={{ marginTop: '2rem' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2>Platform Overview</h2>
            
            <div className="dashboard-stats" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>{users?.length || 0}</h3>
                    <p>Total Users</p>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>{restaurants?.length || 0}</h3>
                    <p>Restaurants</p>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>{orders?.length || 0}</h3>
                    <p>Total Orders</p>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center' }}>
                    <h3>
                      ${orders
                        ? orders.reduce((total, order) => total + order.total_price, 0).toFixed(2)
                        : '0.00'
                      }
                    </h3>
                    <p>Total Revenue</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <h3>Recent Activity</h3>
              
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-body">
                  <h4>Latest Orders</h4>
                  
                  {ordersLoading ? (
                    <div className="loading">
                      <div className="spinner"></div>
                    </div>
                  ) : orders?.length === 0 ? (
                    <p>No orders yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Order ID</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Customer</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Restaurant</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(order => (
                          <tr key={order.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                            <td style={{ padding: '0.75rem' }}>{order.id}</td>
                            <td style={{ padding: '0.75rem' }}>{order.user_details?.username || 'Anonymous'}</td>
                            <td style={{ padding: '0.75rem' }}>{order.restaurant_name}</td>
                            <td style={{ padding: '0.75rem' }}>${order.total_price}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`order-status status-${order.status}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  
                  {orders?.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <button 
                        className="btn btn-outline"
                        onClick={() => setActiveTab('orders')}
                      >
                        View All Orders
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card" style={{ marginTop: '1rem' }}>
                <div className="card-body">
                  <h4>New Users</h4>
                  
                  {authLoading ? (
                    <div className="loading">
                      <div className="spinner"></div>
                    </div>
                  ) : users?.length === 0 ? (
                    <p>No users yet.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Username</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>User Type</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Join Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 5).map(user => (
                          <tr key={user.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                            <td style={{ padding: '0.75rem' }}>{user.username}</td>
                            <td style={{ padding: '0.75rem' }}>{user.email}</td>
                            <td style={{ padding: '0.75rem' }}>{user.first_name} {user.last_name}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span className={`order-status ${
                                user.user_type === 'admin' 
                                  ? 'status-ready' 
                                  : user.user_type === 'restaurant' 
                                    ? 'status-preparing' 
                                    : 'status-confirmed'
                              }`}>
                                {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>{new Date(user.date_joined).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  
                  {users?.length > 5 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <button 
                        className="btn btn-outline"
                        onClick={() => setActiveTab('users')}
                      >
                        View All Users
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="users-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>User Management</h2>
              <Link to="/admin/add-user" className="btn btn-primary">
                Add New User
              </Link>
            </div>
            
            <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
            
            {authLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : authError ? (
              <div className="alert alert-danger">
                {typeof authError === 'object' ? Object.values(authError).flat().join(', ') : authError}
              </div>
            ) : filteredUsers?.length === 0 ? (
              <div className="alert alert-info">
                No users found matching your search.
              </div>
            ) : (
              <div className="users-list">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Username</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>User Type</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                        <td style={{ padding: '0.75rem' }}>{user.id}</td>
                        <td style={{ padding: '0.75rem' }}>{user.username}</td>
                        <td style={{ padding: '0.75rem' }}>{user.email}</td>
                        <td style={{ padding: '0.75rem' }}>{user.first_name} {user.last_name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`order-status ${
                            user.user_type === 'admin' 
                              ? 'status-ready' 
                              : user.user_type === 'restaurant' 
                                ? 'status-preparing' 
                                : 'status-confirmed'
                          }`}>
                            {user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/admin/edit-user/${user.id}`} className="btn btn-sm btn-outline">
                              Edit
                            </Link>
                            <button className="btn btn-sm btn-danger">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div className="restaurants-tab">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Restaurant Management</h2>
              <Link to="/admin/add-restaurant" className="btn btn-primary">
                Add New Restaurant
              </Link>
            </div>
            
            <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                placeholder="Search restaurants..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control"
              />
            </div>
            
            {restaurantsLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : restaurantsError ? (
              <div className="alert alert-danger">
                {typeof restaurantsError === 'object' ? Object.values(restaurantsError).flat().join(', ') : restaurantsError}
              </div>
            ) : filteredRestaurants?.length === 0 ? (
              <div className="alert alert-info">
                No restaurants found matching your search.
              </div>
            ) : (
              <div className="restaurants-list">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Owner</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRestaurants.map(restaurant => (
                      <tr key={restaurant.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                        <td style={{ padding: '0.75rem' }}>{restaurant.id}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {restaurant.logo && (
                              <img 
                                src={restaurant.logo} 
                                alt={restaurant.name} 
                                style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '0.75rem', borderRadius: 'var(--border-radius-sm)' }}
                              />
                            )}
                            <div>
                              <strong>{restaurant.name}</strong>
                              <p><small>{restaurant.description.substring(0, 50)}...</small></p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{restaurant.owner_details?.username || 'N/A'}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`order-status ${restaurant.is_active ? 'status-confirmed' : 'status-cancelled'}`}>
                            {restaurant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/admin/edit-restaurant/${restaurant.id}`} className="btn btn-sm btn-outline">
                              Edit
                            </Link>
                            <button className="btn btn-sm btn-danger">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <h2>Order Management</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="search-bar" style={{ flexGrow: 1, marginRight: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-control"
                />
              </div>
              
              <div className="filter-dropdown">
                <select 
                  className="form-control"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            {ordersLoading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : ordersError ? (
              <div className="alert alert-danger">
                {typeof ordersError === 'object' ? Object.values(ordersError).flat().join(', ') : ordersError}
              </div>
            ) : filteredOrders?.length === 0 ? (
              <div className="alert alert-info">
                No orders found matching your search.
              </div>
            ) : (
              <div className="orders-list">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--light-gray)' }}>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Order ID</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Customer</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Restaurant</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--light-gray)' }}>
                        <td style={{ padding: '0.75rem' }}>{order.id}</td>
                        <td style={{ padding: '0.75rem' }}>{order.user_details?.username || 'Anonymous'}</td>
                        <td style={{ padding: '0.75rem' }}>{order.restaurant_name}</td>
                        <td style={{ padding: '0.75rem' }}>${order.total_price}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className={`order-status status-${order.status}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/admin/orders/${order.id}`} className="btn btn-sm btn-outline">
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>Platform Settings</h2>
            
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-body">
                <h3>General Settings</h3>
                
                <form>
                  <div className="form-group">
                    <label htmlFor="site_name" className="form-label">Site Name</label>
                    <input
                      type="text"
                      id="site_name"
                      name="site_name"
                      className="form-control"
                      defaultValue="UChef"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="contact_email" className="form-label">Contact Email</label>
                    <input
                      type="email"
                      id="contact_email"
                      name="contact_email"
                      className="form-control"
                      defaultValue="support@uchef.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="currency" className="form-label">Currency</label>
                    <select
                      id="currency"
                      name="currency"
                      className="form-control"
                      defaultValue="USD"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    Save Settings
                  </button>
                </form>
              </div>
            </div>
            
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-body">
                <h3>Payment Settings</h3>
                
                <form>
                  <div className="form-group">
                    <label htmlFor="payment_gateway" className="form-label">Default Payment Gateway</label>
                    <select
                      id="payment_gateway"
                      name="payment_gateway"
                      className="form-control"
                      defaultValue="stripe"
                    >
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
                      <option value="cash">Cash on Delivery Only</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="api_key" className="form-label">API Key</label>
                    <input
                      type="password"
                      id="api_key"
                      name="api_key"
                      className="form-control"
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="api_secret" className="form-label">API Secret</label>
                    <input
                      type="password"
                      id="api_secret"
                      name="api_secret"
                      className="form-control"
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    Save Payment Settings
                  </button>
                </form>
              </div>
            </div>
            
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-body">
                <h3>Email Settings</h3>
                
                <form>
                  <div className="form-group">
                    <label htmlFor="smtp_host" className="form-label">SMTP Host</label>
                    <input
                      type="text"
                      id="smtp_host"
                      name="smtp_host"
                      className="form-control"
                      defaultValue="smtp.example.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="smtp_port" className="form-label">SMTP Port</label>
                    <input
                      type="number"
                      id="smtp_port"
                      name="smtp_port"
                      className="form-control"
                      defaultValue="587"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="smtp_user" className="form-label">SMTP Username</label>
                    <input
                      type="text"
                      id="smtp_user"
                      name="smtp_user"
                      className="form-control"
                      defaultValue="notifications@uchef.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="smtp_password" className="form-label">SMTP Password</label>
                    <input
                      type="password"
                      id="smtp_password"
                      name="smtp_password"
                      className="form-control"
                      defaultValue="••••••••••••••••"
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    Save Email Settings
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
