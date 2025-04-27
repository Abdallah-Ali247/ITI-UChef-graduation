/**
 * Form validation utility functions for UChef application
 */

// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Password validation (min 8 characters, at least one number, one uppercase letter)
  export const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*\d)(?=.*[A-Z]).{8,}$/;
    return passwordRegex.test(password);
  };
  
  // Phone number validation
  export const isValidPhoneNumber = (phoneNumber) => {
    const phoneRegex =  /^(?:\+20|0020|0)?1[0125][0-9]{8}$/;
    return phoneRegex.test(phoneNumber);
  };
  
  // Required field validation
  export const isRequired = (value) => {
    return value !== undefined && value !== null && value.trim() !== '';
  };
  
  // Min length validation
  export const minLength = (value, min) => {
    return value && value.length >= min;
  };
  
  // Max length validation
  export const maxLength = (value, max) => {
    return value && value.length <= max;
  };
  
  // Number validation
  export const isNumber = (value) => {
    return !isNaN(Number(value));
  };
  
  // Positive number validation
  export const isPositiveNumber = (value) => {
    return isNumber(value) && Number(value) > 0;
  };
  
  // Match validation (for password confirmation)
  export const matches = (value, matchValue) => {
    return value === matchValue;
  };
  
  /**
   * Validate a form field based on rules
   * @param {string} name - Field name
   * @param {any} value - Field value
   * @param {Object} rules - Validation rules
   * @returns {string|null} - Error message or null if valid
   */
  export const validateField = (name, value, rules) => {
    // Required validation
    if (rules.required && !isRequired(value)) {
      return `${name} is required`;
    }
    
    // Email validation
    if (rules.email && !isValidEmail(value)) {
      return 'Please enter a valid email address';
    }
    
    // Password validation
    if (rules.password && !isValidPassword(value)) {
      return 'Password must be at least 8 characters with at least one number and one uppercase letter';
    }
    
    // Phone validation
    if (rules.phone && !isValidPhoneNumber(value)) {
      return 'Please enter a valid phone number';
    }
    
    // Min length validation
    if (rules.minLength && !minLength(value, rules.minLength)) {
      return `${name} must be at least ${rules.minLength} characters`;
    }
    
    // Max length validation
    if (rules.maxLength && !maxLength(value, rules.maxLength)) {
      return `${name} must be less than ${rules.maxLength} characters`;
    }
    
    // Number validation
    if (rules.number && !isNumber(value)) {
      return `${name} must be a number`;
    }
    
    // Positive number validation
    if (rules.positiveNumber && !isPositiveNumber(value)) {
      return `${name} must be a positive number`;
    }
    
    // Match validation
    if (rules.match && !matches(value, rules.match.value)) {
      return `${name} must match ${rules.match.name}`;
    }
    
    return null;
  };
  
  /**
   * Validate an entire form
   * @param {Object} formData - Form data object
   * @param {Object} validationRules - Validation rules for each field
   * @returns {Object} - Object with errors for each field
   */
  export const validateForm = (formData, validationRules) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(
        fieldName, 
        formData[fieldName], 
        validationRules[fieldName]
      );
      
      if (error) {
        errors[fieldName] = error;
      }
    });
    
    return errors;
  };
  
  /**
   * Check if a form is valid
   * @param {Object} errors - Form errors object
   * @returns {boolean} - True if form is valid
   */
  export const isFormValid = (errors) => {
    return Object.keys(errors).length === 0;
  };
  
  /**
   * Common validation rules for UChef forms
   */
  export const validationRules = {
    // Auth forms
    register: {
      username: {
        required: true,
        minLength: 3,
        maxLength: 30
      },
      email: {
        required: true,
        email: true
      },
      password: {
        required: true,
        password: true
      },
      password2: {
        required: true,
        match: {
          name: 'password',
          value: '' // This should be set dynamically
        }
      },
      first_name: {
        required: true,
        minLength: 2
      },
      last_name: {
        required: true,
        minLength: 2
      },
      phone_number: {
        phone: true
      }
    },
    
    // Checkout form
    checkout: {
      delivery_address: {
        required: true,
        minLength: 10
      },
      payment_method: {
        required: true
      }
    },
    
    // Custom meal form
    customMeal: {
      name: {
        required: true,
        minLength: 3,
        maxLength: 100
      },
      total_price: {
        required: true,
        positiveNumber: true
      }
    },
    
    // Restaurant review form
    review: {
      rating: {
        required: true,
        number: true,
        min: 1,
        max: 5
      },
      comment: {
        required: true,
        minLength: 10
      }
    }
  };