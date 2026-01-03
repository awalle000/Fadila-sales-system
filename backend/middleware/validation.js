import validator from 'validator';

// ✅ Sanitize and validate product input
export const validateProductInput = (req, res, next) => {
  const { name, category, description, costPrice, sellingPrice, quantityInStock, unit, lowStockThreshold } = req.body;

  // Sanitize strings
  if (name) req.body.name = validator.escape(validator.trim(name));
  if (category) req.body.category = validator.escape(validator.trim(category));
  if (description) req.body.description = validator.escape(validator.trim(description));
  if (unit) req.body.unit = validator.escape(validator.trim(unit));

  // Validate required fields
  if (!name || name.length < 2 || name.length > 100) {
    return res.status(400).json({ message: 'Product name must be between 2 and 100 characters' });
  }

  if (!category || category.length < 2 || category.length > 50) {
    return res.status(400).json({ message: 'Category must be between 2 and 50 characters' });
  }

  // Validate numbers
  if (costPrice !== undefined && (!validator.isFloat(String(costPrice), { min: 0 }))) {
    return res.status(400).json({ message: 'Cost price must be a valid positive number' });
  }

  if (sellingPrice !== undefined && (!validator.isFloat(String(sellingPrice), { min: 0 }))) {
    return res.status(400).json({ message: 'Selling price must be a valid positive number' });
  }

  if (quantityInStock !== undefined && (!validator.isInt(String(quantityInStock), { min: 0 }))) {
    return res.status(400).json({ message: 'Quantity must be a valid positive integer' });
  }

  if (lowStockThreshold !== undefined && (!validator.isInt(String(lowStockThreshold), { min: 0 }))) {
    return res.status(400).json({ message: 'Low stock threshold must be a valid positive integer' });
  }

  next();
};

// ✅ Validate sale input
export const validateSaleInput = (req, res, next) => {
  const { productId, quantitySold, discount } = req.body;

  if (!productId || !validator.isMongoId(productId)) {
    return res.status(400).json({ message: 'Invalid product ID' });
  }

  if (!quantitySold || !validator.isInt(String(quantitySold), { min: 1, max: 10000 })) {
    return res.status(400).json({ message: 'Quantity sold must be between 1 and 10,000' });
  }

  if (discount !== undefined && !validator.isFloat(String(discount), { min: 0, max: 1000000 })) {
    return res.status(400).json({ message: 'Invalid discount amount' });
  }

  next();
};

// ✅ Validate user registration
export const validateUserRegistration = (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Sanitize
  if (name) req.body.name = validator.escape(validator.trim(name));
  if (email) req.body.email = validator.normalizeEmail(email);

  // Validate name
  if (name && (name.length < 2 || name.length > 50)) {
    return res.status(400).json({ message: 'Name must be between 2 and 50 characters' });
  }

  // Validate email
  if (email && !validator.isEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  // Validate password strength (only for new passwords)
  if (password && !validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  })) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
    });
  }

  // Validate role
  if (role && !['ceo', 'manager'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  next();
};

// ✅ Validate login
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (email) req.body.email = validator.normalizeEmail(email);

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Password is required' });
  }

  next();
};