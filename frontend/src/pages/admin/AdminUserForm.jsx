import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { validateField, validateForm, isFormValid } from '../../utils/validation';

// API URL constant
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// CSS for form
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem'
  },
  formGroup: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    backgroundColor: 'white'
  },
  btnPrimary: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500'
  },
  btnOutline: {
    backgroundColor: 'transparent',
    color: '#007bff',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    border: '1px solid #007bff',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    marginRight: '1rem'
  },
  error: {
    color: '#dc3545',
    marginTop: '0.5rem'
  },
  success: {
    color: '#28a745',
    marginTop: '0.5rem'
  }
};

const AdminUserForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    user_type: 'customer'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch user data if in edit mode
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Check admin role
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    
    // Fetch user data if in edit mode
    if (isEdit && id) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Authentication required');
          
          const response = await axios.get(`${API_URL}/users/users/${id}/`, {
            headers: {
              Authorization: `Token ${token}`
            }
          });
          
          // Update form data with user details
          const userData = response.data;
          setFormData({
            username: userData.username || '',
            email: userData.email || '',
            password: '',
            confirm_password: '',
            first_name: userData.first_name || '',
            last_name: userData.last_name || '',
            user_type: userData.user_type || 'customer'
          });
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError(error.response?.data || 'Failed to fetch user data');
          setLoading(false);
        }
      };
      
      fetchUserData();
    }
  }, [isEdit, id, isAuthenticated, navigate, user]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear general error when user makes changes
    setError(null);
    
    // Validate field as it changes
    let fieldError = null;
    
    switch (name) {
      case 'username':
        fieldError = validateField('Username', value, { 
          required: true, 
          minLength: 3,
          maxLength: 30
        });
        break;
        
      case 'email':
        fieldError = validateField('Email', value, { 
          required: true, 
          email: true 
        });
        break;
        
      case 'password':
        fieldError = isEdit && !value ? null : validateField('Password', value, { 
          required: !isEdit,
          password: true
        });
        
        // If password changes, also validate confirm_password
        if (prevData.confirm_password) {
          const confirmError = validateField('Confirm Password', prevData.confirm_password, {
            required: !isEdit,
            match: {
              name: 'password',
              value: value
            }
          });
          
          setFormErrors(prev => ({
            ...prev,
            confirm_password: confirmError
          }));
        }
        break;
        
      case 'confirm_password':
        fieldError = isEdit && !value ? null : validateField('Confirm Password', value, {
          required: !isEdit,
          match: {
            name: 'password',
            value: prevData.password
          }
        });
        break;
        
      case 'first_name':
      case 'last_name':
        fieldError = validateField(name === 'first_name' ? 'First Name' : 'Last Name', value, {
          minLength: 2
        });
        break;
        
      default:
        break;
    }
    
    // Update form errors
    setFormErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create validation rules based on whether we're editing or creating
    const validationRules = {
      username: { required: true, minLength: 3, maxLength: 30 },
      email: { required: true, email: true },
      first_name: { minLength: 2 },
      last_name: { minLength: 2 }
    };
    
    // Add password validation rules (different for edit vs. create)
    if (!isEdit) {
      // For new users, password is required
      validationRules.password = { required: true, password: true };
      validationRules.confirm_password = { 
        required: true,
        match: {
          name: 'password',
          value: formData.password
        }
      };
    } else if (formData.password) {
      // For existing users, only validate password if provided
      validationRules.password = { password: true };
      validationRules.confirm_password = { 
        match: {
          name: 'password',
          value: formData.password
        }
      };
    }
    
    // Validate the entire form
    const errors = validateForm(formData, validationRules);
    setFormErrors(errors);
    
    // Check if the form is valid
    if (!isFormValid(errors)) {
      // Scroll to the first error field
      const firstErrorField = document.querySelector('.is-invalid');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Additional validation checks
    if (formData.password !== formData.confirm_password && (formData.password || formData.confirm_password)) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate that password is provided for new users
    if (!isEdit && !formData.password) {
      setError('Password is required when creating a new user');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      let response;
      
      if (isEdit) {
        // Update existing user
        console.log('Updating user with ID:', id);
        
        // First update all fields except password
        const userData = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          user_type: formData.user_type
        };
        
        // If password is provided, include it
        if (formData.password) {
          userData.password = formData.password;
        }
        
        // Update the user with all data
        response = await axios.patch(`${API_URL}/users/users/${id}/`, userData, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        setSuccess('User updated successfully');
      } else {
        // Create new user using the register endpoint
        console.log('Creating new user');
        
        // Use the register endpoint which properly handles password hashing
        response = await axios.post(`${API_URL}/users/register/`, {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password2: formData.password, // Add password confirmation field
          first_name: formData.first_name,
          last_name: formData.last_name,
          user_type: formData.user_type
        }, {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // If successful, update the user type if needed
        if (formData.user_type !== 'customer' && response.data && response.data.id) {
          const newUserId = response.data.id;
          await axios.patch(`${API_URL}/users/users/${newUserId}/`, {
            user_type: formData.user_type
          }, {
            headers: {
              Authorization: `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });
        }
        
        setSuccess('User created successfully');
        
        // Reset form after successful creation
        setFormData({
          username: '',
          email: '',
          password: '',
          confirm_password: '',
          first_name: '',
          last_name: '',
          user_type: 'customer'
        });
      }
      
      setLoading(false);
      
      // Redirect back to admin dashboard after a short delay
      setTimeout(() => {
        navigate('/admin-dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.response?.data || 'Failed to save user');
      setLoading(false);
    }
  };
  
  return (
    <div style={styles.container}>
      <h1>{isEdit ? 'Edit User' : 'Add New User'}</h1>
      
      {error && (
        <div style={{ ...styles.error, padding: '1rem', backgroundColor: '#f8d7da', borderRadius: '4px', marginBottom: '1rem' }}>
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}
      
      {success && (
        <div style={{ ...styles.success, padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px', marginBottom: '1rem' }}>
          {success}
        </div>
      )}
      
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="username" style={styles.label}>Username*</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{...styles.input, borderColor: formErrors.username ? '#dc3545' : '#ddd'}}
              required
            />
            {formErrors.username && (
              <div style={styles.error}>
                {formErrors.username}
              </div>
            )}
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{...styles.input, borderColor: formErrors.email ? '#dc3545' : '#ddd'}}
              required
            />
            {formErrors.email && (
              <div style={styles.error}>
                {formErrors.email}
              </div>
            )}
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              {isEdit ? 'Password (leave blank to keep current)' : 'Password*'}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={{...styles.input, borderColor: !isEdit && !formData.password ? '#dc3545' : '#ddd'}}
              required={!isEdit}
            />
            {!isEdit && !formData.password && (
              <div style={styles.error}>Password is required for new users</div>
            )}
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="confirm_password" style={styles.label}>
              {isEdit ? 'Confirm Password (leave blank to keep current)' : 'Confirm Password*'}
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              style={{...styles.input, 
                borderColor: (formData.password !== formData.confirm_password && formData.confirm_password) ? 
                  '#dc3545' : '#ddd'}}
              required={!isEdit}
            />
            {formData.password !== formData.confirm_password && formData.confirm_password && (
              <div style={styles.error}>Passwords do not match</div>
            )}
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="first_name" style={styles.label}>First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="last_name" style={styles.label}>Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label htmlFor="user_type" style={styles.label}>User Type*</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="customer">Customer</option>
              <option value="restaurant">Restaurant Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', marginTop: '2rem' }}>
            <button
              type="button"
              style={styles.btnOutline}
              onClick={() => navigate('/admin-dashboard')}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminUserForm;
