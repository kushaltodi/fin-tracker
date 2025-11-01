const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  handleValidationErrors
];

// Account validation rules
const validateAccount = [
  body('account_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name is required and must be less than 100 characters'),
  body('account_type')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Account type is required'),
  body('initial_balance')
    .optional()
    .isNumeric()
    .withMessage('Initial balance must be a number'),
  handleValidationErrors
];

// Transaction validation rules
const validateTransaction = [
  body('account_id')
    .isInt({ min: 1 })
    .withMessage('Valid account ID is required'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),
  body('amount')
    .isNumeric()
    .withMessage('Amount must be a number'),
  body('transaction_type')
    .isIn(['INCOME', 'EXPENSE', 'TRANSFER'])
    .withMessage('Transaction type must be INCOME, EXPENSE, or TRANSFER'),
  body('description')
    .optional()
    .trim(),
  body('transaction_date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required'),
  handleValidationErrors
];

// Category validation rules
const validateCategory = [
  body('category_name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name is required and must be less than 100 characters'),
  body('category_type')
    .isIn(['Income', 'Expense'])
    .withMessage('Category type must be Income or Expense'),
  handleValidationErrors
];

// Stock trade validation rules
const validateStockTrade = [
  body('account_id')
    .isInt({ min: 1 })
    .withMessage('Valid account ID is required'),
  body('ticker_symbol')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Ticker symbol is required and must be less than 20 characters'),
  body('trade_type')
    .isIn(['BUY', 'SELL'])
    .withMessage('Trade type must be BUY or SELL'),
  body('quantity')
    .isNumeric({ gt: 0 })
    .withMessage('Quantity must be greater than 0'),
  body('price_per_share')
    .isNumeric({ gt: 0 })
    .withMessage('Price per share must be greater than 0'),
  body('trade_date')
    .optional()
    .isISO8601()
    .withMessage('Valid trade date is required'),
  handleValidationErrors
];

// Transfer validation rules
const validateTransfer = [
  body('from_account_id')
    .isInt({ min: 1 })
    .withMessage('Valid from account ID is required'),
  body('to_account_id')
    .isInt({ min: 1 })
    .withMessage('Valid to account ID is required'),
  body('amount')
    .isNumeric({ gt: 0 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .optional()
    .trim(),
  body('transaction_date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateAccount,
  validateTransaction,
  validateCategory,
  validateStockTrade,
  validateTransfer,
  handleValidationErrors
};