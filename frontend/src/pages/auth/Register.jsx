import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../store/slices/authSlice';
import { validateForm, validationRules, isFormValid } from '../../utils/validation';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    user_type: 'customer',
    phone_number: '',
    address: ''
  });
  
  const [errors, setErrors] = useState({});
  
  const { 
    username, email, password, password2, first_name, 
    last_name, user_type, phone_number, address 
  } = formData;
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Clear any previous errors
    dispatch(clearError());
    
    // If user is already authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/');
    }
  }, [dispatch, isAuthenticated, navigate]);
  
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate field on change
    const fieldRules = validationRules.register[name];
    if (fieldRules) {
      // For password confirmation, we need to set the match value dynamically
      if (name === 'password2') {
        fieldRules.match = {
          name: 'password',
          value: formData.password
        };
      }
      
      // Validate the field
      const fieldError = validateForm(
        { [name]: value },
        { [name]: fieldRules }
      );
      
      // Update errors state
      setErrors(prev => ({
        ...prev,
        [name]: fieldError[name] || null
      }));
    }
  };
  
  const handleSubmit = e => {
    e.preventDefault();
    
    // Create a custom validation rules object based on the register rules
    const customValidationRules = { ...validationRules.register };
    
    // Set the match value for password confirmation dynamically
    if (customValidationRules.password2) {
      customValidationRules.password2.match = {
        name: 'password',
        value: formData.password
      };
    }
    
    // Validate the entire form
    const formErrors = validateForm(formData, customValidationRules);
    setErrors(formErrors);
    
    // Only proceed if the form is valid
    if (isFormValid(formErrors)) {
      dispatch(register(formData));
    } else {
      // Scroll to the first error
      const firstErrorField = document.querySelector('.is-invalid');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  return (
    <div className="auth-page" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create an Account</h1>
      
      {error && (
        <div className="alert alert-danger">
          {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="first_name" className="form-label">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={first_name}
              onChange={handleChange}
              className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
              required
            />
            {errors.first_name && (
              <div className="invalid-feedback">
                {errors.first_name}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="last_name" className="form-label">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={last_name}
              onChange={handleChange}
              className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
              required
            />
            {errors.last_name && (
              <div className="invalid-feedback">
                {errors.last_name}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="username" className="form-label">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={handleChange}
            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
            required
          />
          {errors.username && (
            <div className="invalid-feedback">
              {errors.username}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleChange}
            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
            required
          />
          {errors.email && (
            <div className="invalid-feedback">
              {errors.email}
            </div>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              required
            />
            {errors.password && (
              <div className="invalid-feedback">
                {errors.password}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password2" className="form-label">Confirm Password</label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={password2}
              onChange={handleChange}
              className={`form-control ${errors.password2 ? 'is-invalid' : ''}`}
              required
            />
            {errors.password2 && (
              <div className="invalid-feedback">
                {errors.password2}
              </div>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="user_type" className="form-label">Account Type</label>
          <select
            id="user_type"
            name="user_type"
            value={user_type}
            onChange={handleChange}
            className="form-control"
            required
          >
            <option value="customer">Customer</option>
            <option value="restaurant">Restaurant Owner</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="phone_number" className="form-label">Phone Number</label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={phone_number}
            onChange={handleChange}
            className={`form-control ${errors.phone_number ? 'is-invalid' : ''}`}
            placeholder="+1234567890"
          />
          {errors.phone_number && (
            <div className="invalid-feedback">
              {errors.phone_number}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="address" className="form-label">Address</label>
          <textarea
            id="address"
            name="address"
            value={address}
            onChange={handleChange}
            className="form-control"
            rows="3"
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem' }}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;
