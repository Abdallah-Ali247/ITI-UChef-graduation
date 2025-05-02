import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { clearCart } from '../../store/slices/cartSlice';
import { useContext, useState, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import { FaSun, FaMoon, FaShoppingCart, FaUser } from 'react-icons/fa';
import NotificationIcon from '../notifications/NotificationIcon';
import NotificationList from '../notifications/NotificationList';
import { FaSun, FaMoon, FaShoppingCart, FaUser, FaBars, FaTimes } from 'react-icons/fa';

const Header = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const { items } = useSelector(state => state.cart);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the cart when logging out
    dispatch(clearCart());
    // Then logout the user
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-text">
            UChef
          </span>
        </Link>
        
        {/* Mobile menu toggle button */}
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        
        <nav className={mobileMenuOpen ? 'open' : ''}>
          <ul className="nav-menu">
            <li className="nav-item">
              <NavLink to="/" className="nav-link">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/restaurants" className="nav-link">Restaurants</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/meals" className="nav-link">Meals</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/top-custom-meals" className="nav-link">Top Custom Meals</NavLink>
            </li>
            
            {isAuthenticated ? (
              <>
                {/* Show different navigation based on user type */}
                {user?.user_type === 'restaurant' && (
                  <li className="nav-item">
                    <NavLink to="/restaurant-dashboard" className="nav-link restaurant-dashboard-link">Restaurant Dashboard</NavLink>
                  </li>
                )}
                
                {user?.user_type === 'admin' && (
                  <li className="nav-item">
                    <NavLink to="/admin-dashboard" className="nav-link admin-dashboard-link">Admin Dashboard</NavLink>
                  </li>
                )}
                
                {user?.user_type === 'customer' && (
                  <li className="nav-item">
                    <NavLink to="/orders" className="nav-link orders-link">My Orders</NavLink>
                  </li>
                )}
                
                <li className="nav-item">
                  <NavLink to="/profile" className="nav-link">
                    <FaUser className="nav-icon" /> Profile
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link logout-btn">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="nav-link">Login</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/register" className="nav-link">Register</NavLink>
                </li>
              </>
            )}
            
            <li className="nav-item cart-item">
              <NavLink to="/cart" className="nav-link cart-link">
                <FaShoppingCart className="nav-icon" />
                <span>Cart</span>
                {items.length > 0 && <span className="cart-badge">{items.length}</span>}
              </NavLink>
            </li>
            
            {isAuthenticated && (
              <li className="nav-item notification-item relative">
                <div onClick={() => setNotificationOpen(!notificationOpen)} className="nav-link cursor-pointer" style={{ color: 'var(--header-text)' }}>
                  <NotificationIcon />
                </div>
                <NotificationList isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />
              </li>
            )}
            
            <li className="nav-item theme-toggle">
              <button 
                onClick={toggleTheme} 
                className="theme-btn" 
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <FaMoon className="theme-icon" /> : <FaSun className="theme-icon" />}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
