const { body, validationResult } = require('express-validator');

/**
 * Validation middleware factory
 * Catches validation errors and returns a standardized error response
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation error',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH VALIDATION RULES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const authValidation = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),
    
    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('confirmPassword')
      .notEmpty().withMessage('Password confirmation is required')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match'),
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BOOKING VALIDATION RULES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const bookingValidation = {
  create: [
    body('serviceId')
      .notEmpty().withMessage('Service ID is required')
      .isMongoId().withMessage('Invalid service ID'),
    
    body('date')
      .notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Invalid date format')
      .custom(value => {
        const bookingDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate < today) {
          throw new Error('Cannot book appointments in the past');
        }
        return true;
      }),
    
    body('timeSlot')
      .notEmpty().withMessage('Time slot is required')
      .matches(/^(0[9]|1[0-7]):[0-5][0-9]$/).withMessage('Invalid time slot format'),
    
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
    
    body('paymentMethod')
      .notEmpty().withMessage('Payment method is required')
      .isIn(['card', 'cash', 'online']).withMessage('Invalid payment method'),
  ],

  cancel: [
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Cancellation reason cannot exceed 500 characters'),
  ],
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SERVICE VALIDATION RULES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const serviceValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Service name is required')
      .isLength({ min: 3, max: 100 }).withMessage('Service name must be between 3 and 100 characters'),
    
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    
    body('category')
      .trim()  
      .notEmpty().withMessage('Category is required'),
    
    body('price')
      .notEmpty().withMessage('Price is required')
      .isNumeric().withMessage('Price must be a number')
      .custom(value => value > 0).withMessage('Price must be greater than 0'),
    
    body('duration')
      .notEmpty().withMessage('Duration is required')
      .isNumeric().withMessage('Duration must be a number in minutes')
      .custom(value => value > 0).withMessage('Duration must be greater than 0'),
  ],

  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Service name must be between 3 and 100 characters'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters'),
    
    body('price')
      .optional()
      .isNumeric().withMessage('Price must be a number')
      .custom(value => value > 0).withMessage('Price must be greater than 0'),
    
    body('duration')
      .optional()
      .isNumeric().withMessage('Duration must be a number in minutes')
      .custom(value => value > 0).withMessage('Duration must be greater than 0'),
  ],
};

module.exports = {
  validate,
  authValidation,
  bookingValidation,
  serviceValidation,
};
