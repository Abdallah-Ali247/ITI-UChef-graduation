import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, deleteUser } from '../../store/slices/authSlice';
import { fetchRestaurants, updateRestaurantStatus } from '../../store/slices/restaurantSlice';
import { fetchUserOrders } from '../../store/slices/orderSlice';
import axios from 'axios';

// API URL constant
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// CSS for dashboard
const styles = {
  tabs: {
    display: 'flex',
    gap: '1rem',
    borderBottom: '1px solid #e0e0e0',
    marginBottom: '1.5rem',
    paddingBottom: '0.5rem'
  },
  tab: {
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    borderRadius: '4px',
    fontWeight: '500',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#555'
  },
  activeTab: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  btnPrimary: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer'
  },
  btnOutline: {
    backgroundColor: 'transparent',
    color: '#007bff',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: '1px solid #007bff',
    cursor: 'pointer'
  },
  btnSuccess: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer'
  },
  btnDanger: {
    backgroundColor: '#dc3545',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer'
  }
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated, users, loading: authLoading, error: authError } = useSelector(state => state.auth);
  const { restaurants, loading: restaurantsLoading, error: restaurantsError } = useSelector(state => state.restaurants);
  const { orders, loading: ordersLoading, error: ordersError } = useSelector(state => state.orders);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  
  // Restaurant approval state
  const [restaurantToApprove, setRestaurantToApprove] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalAction, setApprovalAction] = useState('approve'); // 'approve' or 'reject'
  
  // State to track if data is loading and if it has been loaded
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [error, setError] = useState(null);
  
  // State to store data directly instead of using Redux - ensure they're always arrays
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminRestaurants, setAdminRestaurants] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  
  // Authentication and role check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
  }, [isAuthenticated, navigate, user]);
  
  // Manual data fetching to avoid Redux issues
  useEffect(() => {
    // Only fetch data once and only if user is authenticated and is admin
    if (!hasLoadedData && isAuthenticated && user?.user_type === 'admin' && !isLoading) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Authentication required');
          
          const headers = { Authorization: `Token ${token}` };
          
          // Fetch all data in parallel
          const [usersResponse, restaurantsResponse, ordersResponse] = await Promise.all([
            axios.get(`${API_URL}/users/users/`, { headers }),
            axios.get(`${API_URL}/restaurants/restaurants/`, { headers }),
            axios.get(`${API_URL}/orders/orders/`, { headers })
          ]);
          
          // Update local state - ensure we're always setting arrays
          // For users, we need to handle the response format correctly
          const usersData = usersResponse.data;
          setAdminUsers(Array.isArray(usersData) ? usersData : 
                        (usersData && typeof usersData === 'object' && usersData.results ? usersData.results : []));
          
          setAdminRestaurants(Array.isArray(restaurantsResponse.data) ? restaurantsResponse.data : 
                             (restaurantsResponse.data && typeof restaurantsResponse.data === 'object' && 
                              restaurantsResponse.data.results ? restaurantsResponse.data.results : []));
          
          setAdminOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : 
                        (ordersResponse.data && typeof ordersResponse.data === 'object' && 
                         ordersResponse.data.results ? ordersResponse.data.results : []));
          setHasLoadedData(true);
        } catch (error) {
          console.error('Error fetching admin dashboard data:', error);
          setError(error.message || 'Failed to load dashboard data');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [isAuthenticated, user, hasLoadedData, isLoading]);
  
  // Ensure all data arrays are actually arrays before filtering
  const safeAdminUsers = Array.isArray(adminUsers) ? adminUsers : [];
  const safeAdminRestaurants = Array.isArray(adminRestaurants) ? adminRestaurants : [];
  const safeAdminOrders = Array.isArray(adminOrders) ? adminOrders : [];
  
  // Filter users based on search term and exclude admin users
  const filteredUsers = safeAdminUsers.filter(user => 
    // Exclude admin users
    user.user_type !== 'admin' && (
      (user?.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (user?.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user?.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user?.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );
  
  // Filter restaurants based on search term
  const filteredRestaurants = safeAdminRestaurants.filter(restaurant => 
    (restaurant?.name && restaurant.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (restaurant?.description && restaurant.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Filter orders based on search term and status
  const filteredOrders = safeAdminOrders.filter(order => {
    const matchesSearch = 
      (order.id && order.id.toString().includes(searchTerm)) || 
      (order.user_details?.username && order.user_details.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.restaurant_name && order.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1>Admin Dashboard</h1>
      
      {/* Error message */}
      {error && (
        <div className="alert alert-danger" style={{ marginTop: '1rem' }}>
          <strong>Error:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-danger" 
            style={{ marginLeft: '1rem' }}
            onClick={() => {
              setError(null);
              setHasLoadedData(false); // Allow retry
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '1rem' }}>Loading dashboard data...</p>
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="dashboard-content">
          <div style={styles.tabs}>
            <button 
              style={{...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              style={{...styles.tab, ...(activeTab === 'users' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
            <button 
              style={{...styles.tab, ...(activeTab === 'restaurants' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('restaurants')}
            >
              Restaurants
            </button>
            <button 
              style={{...styles.tab, ...(activeTab === 'orders' ? styles.activeTab : {})}}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
            {/* Settings tab removed as requested */}
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
                        <h3>{safeAdminUsers.length}</h3>
                        <p>Total Users</p>
                      </div>
                    </div>
                    
                    <div className="card">
                      <div className="card-body" style={{ textAlign: 'center' }}>
                        <h3>{safeAdminRestaurants.length}</h3>
                        <p>Restaurants</p>
                      </div>
                    </div>
                    
                    <div className="card">
                      <div className="card-body" style={{ textAlign: 'center' }}>
                        <h3>{safeAdminOrders.length}</h3>
                        <p>Total Orders</p>
                      </div>
                    </div>
                    
                    <div className="card">
                      <div className="card-body" style={{ textAlign: 'center' }}>
                        <h3>
                          ${safeAdminOrders.length > 0
                            ? safeAdminOrders.reduce((total, order) => total + (parseFloat(order?.total_price) || 0), 0).toFixed(2)
                            : '0.00'
                          }
                        </h3>
                        <p>Total Revenue</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity section removed as requested */}
              </div>
            )}
            
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="users-tab">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>User Management</h2>
                  <Link to="/admin/add-user" style={styles.btnPrimary}>
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
                                <Link to={`/admin/edit-user/${user.id}`} style={{...styles.btnOutline, fontSize: '0.875rem', padding: '0.25rem 0.5rem'}}>
                                  Edit
                                </Link>
                                <button 
                                  style={{...styles.btnDanger, fontSize: '0.875rem', padding: '0.25rem 0.5rem'}}
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setShowDeleteModal(true);
                                  }}
                                >
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
                  <Link to="/admin/add-restaurant" style={styles.btnPrimary}>
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
                              <span className={`order-status ${restaurant.is_approved ? 'status-confirmed' : restaurant.is_approved === false ? 'status-cancelled' : 'status-pending'}`}>
                                {restaurant.is_approved ? 'Approved' : restaurant.is_approved === false ? 'Rejected' : 'Pending Approval'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link to={`/admin/edit-restaurant/${restaurant.id}`} style={{...styles.btnOutline, fontSize: '0.875rem', padding: '0.25rem 0.5rem'}}>
                                  Edit
                                </Link>
                                <div className="restaurant-card-actions">
                                  {/* Show Approve button if not already approved */}
                                  {restaurant.is_approved !== true && (
                                    <button 
                                      style={{...styles.btnSuccess, fontSize: '0.875rem', padding: '0.25rem 0.5rem'}}
                                      onClick={() => {
                                        setRestaurantToApprove(restaurant);
                                        setApprovalAction('approve');
                                        setShowApprovalModal(true);
                                      }}
                                    >
                                      {restaurant.is_approved === null ? 'Approve' : 'Change to Approved'}
                                    </button>
                                  )}
                                  
                                  {/* Show Reject button if not already rejected */}
                                  {restaurant.is_approved !== false && (
                                    <button 
                                      style={{...styles.btnDanger, fontSize: '0.875rem', padding: '0.25rem 0.5rem'}}
                                      onClick={() => {
                                        setRestaurantToApprove(restaurant);
                                        setApprovalAction('reject');
                                        setShowApprovalModal(true);
                                      }}
                                    >
                                      {restaurant.is_approved === null ? 'Reject' : 'Change to Rejected'}
                                    </button>
                                  )}
                                  
                                  {/* Show Reset to Pending button if already approved or rejected */}
                                  {restaurant.is_approved !== null && (
                                    <button 
                                      style={{...styles.btnOutline, fontSize: '0.875rem', padding: '0.25rem 0.5rem'}}
                                      onClick={() => {
                                        // Confirm before resetting to pending
                                        if (window.confirm(`Reset ${restaurant.name} to Pending Approval?`)) {
                                          const token = localStorage.getItem('token');
                                          if (!token) {
                                            alert('Authentication required');
                                            return;
                                          }
                                          
                                          // Call API to set is_approved to null (pending)
                                          axios.patch(`${API_URL}/restaurants/restaurants/${restaurant.id}/`, { 
                                            is_approved: null,
                                            rejection_reason: null
                                          }, {
                                            headers: {
                                              Authorization: `Token ${token}`,
                                              'Content-Type': 'application/json'
                                            }
                                          })
                                          .then(response => {
                                            // Update local state
                                            setAdminRestaurants(
                                              Array.isArray(adminRestaurants) 
                                                ? adminRestaurants.map(r => 
                                                    r?.id === restaurant.id ? response.data : r
                                                  )
                                                : []
                                            );
                                            
                                            setActionSuccess(`Restaurant ${restaurant.name} has been reset to Pending Approval.`);
                                            
                                            // Clear success message after 5 seconds
                                            setTimeout(() => {
                                              setActionSuccess(null);
                                            }, 5000);
                                          })
                                          .catch(error => {
                                            console.error('Error resetting restaurant status:', error);
                                            alert(`Failed to reset restaurant: ${error.message || 'Unknown error'}`);
                                          });
                                        }
                                      }}
                                    >
                                      Reset to Pending
                                    </button>
                                  )}
                                </div>
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
                                <Link to={`/admin/orders/${order.id}`} style={{...styles.btnOutline, fontSize: '0.875rem', padding: '0.25rem 0.5rem'}}>
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
            
            {/* Settings Tab removed as requested */}
          </div>
        </div>
      )}
      
      {/* Delete User Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                  setDeleteError(null);
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {deleteError && (
                <div className="alert alert-danger">
                  {deleteError}
                </div>
              )}
              <p>Are you sure you want to delete the user <strong>{userToDelete?.username}</strong>?</p>
              <p>This action cannot be undone and will remove all data associated with this user.</p>
              
              {userToDelete?.user_type === 'restaurant' && (
                <div className="alert alert-warning">
                  <strong>Warning:</strong> This user is a restaurant owner. Deleting this user will also remove their restaurant from the platform.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                style={{...styles.btnOutline, marginRight: '0.5rem'}}
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                  setDeleteError(null);
                }}
              >
                Cancel
              </button>
              <button 
                style={styles.btnDanger}
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                      throw new Error('Authentication required');
                    }
                    
                    // Call the API to delete the user
                    await axios.delete(`${API_URL}/users/users/${userToDelete.id}/`, {
                      headers: {
                        Authorization: `Token ${token}`,
                      }
                    });
                    
                    // Update local state - ensure we're working with arrays
                    setAdminUsers(Array.isArray(adminUsers) ? adminUsers.filter(u => u?.id !== userToDelete.id) : []);
                    
                    // Close the modal and show success message
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                    setActionSuccess(`User ${userToDelete.username} has been deleted successfully.`);
                    
                    // Clear success message after 5 seconds
                    setTimeout(() => {
                      setActionSuccess(null);
                    }, 5000);
                  } catch (error) {
                    console.error('Error deleting user:', error);
                    setDeleteError(
                      error.response?.data?.detail || 
                      error.response?.data?.error || 
                      error.message || 
                      'Failed to delete user. Please try again.'
                    );
                  }
                }}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Restaurant Approval/Rejection Modal */}
      {showApprovalModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{approvalAction === 'approve' ? 'Approve' : 'Reject'} Restaurant</h3>
              <button 
                className="close-btn" 
                onClick={() => {
                  setShowApprovalModal(false);
                  setRestaurantToApprove(null);
                  setRejectionReason('');
                }}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Restaurant: <strong>{restaurantToApprove?.name}</strong></p>
              <p>Owner: <strong>{restaurantToApprove?.owner_details?.username || 'Unknown'}</strong></p>
              
              {approvalAction === 'reject' && (
                <div className="form-group">
                  <label htmlFor="rejection_reason" className="form-label">Rejection Reason</label>
                  <textarea
                    id="rejection_reason"
                    className="form-control"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection"
                    rows={4}
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                style={{...styles.btnOutline, marginRight: '0.5rem'}}
                onClick={() => {
                  setShowApprovalModal(false);
                  setRestaurantToApprove(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button 
                style={approvalAction === 'approve' ? styles.btnSuccess : styles.btnDanger}
                onClick={async () => {
                  try {
                    // Get token from localStorage
                    const token = localStorage.getItem('token');
                    if (!token) throw new Error('Authentication required');
                    
                    // Call the API directly to update restaurant status
                    const response = await axios.patch(`${API_URL}/restaurants/restaurants/${restaurantToApprove.id}/`, { 
                      is_approved: approvalAction === 'approve',
                      rejection_reason: approvalAction === 'reject' ? rejectionReason : null
                    }, {
                      headers: {
                        Authorization: `Token ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    // Update local state - ensure we're working with arrays
                    setAdminRestaurants(
                      Array.isArray(adminRestaurants) 
                        ? adminRestaurants.map(r => 
                            r?.id === restaurantToApprove.id ? response.data : r
                          )
                        : []
                    );
                    
                    // Close the modal and show success message
                    setShowApprovalModal(false);
                    setRestaurantToApprove(null);
                    setRejectionReason('');
                    setActionSuccess(`Restaurant ${restaurantToApprove.name} has been ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully.`);
                    
                    // Clear success message after 5 seconds
                    setTimeout(() => {
                      setActionSuccess(null);
                    }, 5000);
                  } catch (error) {
                    console.error('Error updating restaurant status:', error);
                    alert(`Failed to ${approvalAction} restaurant: ${error.message || 'Unknown error'}`)
                  }
                }}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'} Restaurant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {actionSuccess && (
        <div className="success-toast" style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'var(--success)',
          color: 'white',
          padding: '1rem',
          borderRadius: 'var(--border-radius)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          maxWidth: '400px'
        }}>
          {actionSuccess}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
