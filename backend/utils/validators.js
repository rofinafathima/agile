const validator = require('validator');

function validateSignup(data) {
  const errors = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }
  if (!data.email || !validator.isEmail(data.email)) {
    errors.push('Please provide a valid email address.');
  }
  if (!data.phone || !/^[6-9]\d{9}$/.test(data.phone)) {
    errors.push('Please provide a valid 10-digit Indian mobile number.');
  }
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }
  if (data.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(data.password)) {
    errors.push('Password must contain uppercase, lowercase, number, and special character.');
  }
  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match.');
  }

  return errors;
}

function validateLogin(data) {
  const errors = [];
  if (!data.email || !validator.isEmail(data.email)) {
    errors.push('Please provide a valid email address.');
  }
  if (!data.password) {
    errors.push('Password is required.');
  }
  return errors;
}

function validateMedicine(data) {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) errors.push('Medicine name is required.');
  if (!data.unit_price || data.unit_price <= 0) errors.push('Valid unit price is required.');
  if (!data.mrp || data.mrp <= 0) errors.push('Valid MRP is required.');
  if (data.pack_size && data.pack_size < 1) errors.push('Pack size must be at least 1.');
  if (data.discount && (data.discount < 0 || data.discount > 100)) errors.push('Discount must be between 0 and 100.');
  return errors;
}

function validateAddress(data) {
  const errors = [];
  if (!data.full_name || data.full_name.trim().length < 2) errors.push('Full name is required.');
  if (!data.phone || !/^[6-9]\d{9}$/.test(data.phone)) errors.push('Valid phone number is required.');
  if (!data.address_line1) errors.push('Address line 1 is required.');
  if (!data.city) errors.push('City is required.');
  if (!data.state) errors.push('State is required.');
  if (!data.pincode || !/^\d{6}$/.test(data.pincode)) errors.push('Valid 6-digit pincode is required.');
  return errors;
}

function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return validator.escape(str.trim());
}

module.exports = { validateSignup, validateLogin, validateMedicine, validateAddress, sanitizeInput };
