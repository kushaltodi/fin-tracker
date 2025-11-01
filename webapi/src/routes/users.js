const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await db('users')
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .select('user_id', 'username', 'email', 'created_at')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.user_id;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({ error: 'Username or email is required to update' });
    }

    const updateData = {};
    
    if (username) {
      // Check if username is already taken
      const existingUser = await db('users')
        .where('username', username.trim())
        .where('user_id', '!=', userId)
        .whereNull('deleted_at')
        .first();
        
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      updateData.username = username.trim();
    }

    if (email) {
      // Check if email is already taken
      const existingUser = await db('users')
        .where('email', email.trim())
        .where('user_id', '!=', userId)
        .whereNull('deleted_at')
        .first();
        
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      updateData.email = email.trim();
    }

    await db('users')
      .where('user_id', userId)
      .update(updateData);

    const updatedUser = await db('users')
      .where('user_id', userId)
      .select('user_id', 'username', 'email', 'created_at')
      .first();

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Get account count
    const accountCount = await db('accounts')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .count('* as count')
      .first();

    // Get transaction count for current month
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const transactionStats = await db('transactions')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .whereBetween('transaction_date', [startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]])
      .select(
        db.raw('COUNT(*) as transactionCount'),
        db.raw('SUM(CASE WHEN transaction_type = "INCOME" THEN amount ELSE 0 END) as monthlyIncome'),
        db.raw('SUM(CASE WHEN transaction_type = "EXPENSE" THEN amount ELSE 0 END) as monthlyExpenses')
      )
      .first();

    // Get category count
    const categoryCount = await db('categories')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .count('* as count')
      .first();

    // Get stock trades count
    const stockTradesCount = await db('stock_trades')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .count('* as count')
      .first();

    res.json({
      accounts: {
        count: parseInt(accountCount.count) || 0
      },
      transactions: {
        monthlyCount: parseInt(transactionStats.transactionCount) || 0,
        monthlyIncome: parseFloat(transactionStats.monthlyIncome) || 0,
        monthlyExpenses: parseFloat(transactionStats.monthlyExpenses) || 0
      },
      categories: {
        count: parseInt(categoryCount.count) || 0
      },
      stockTrades: {
        count: parseInt(stockTradesCount.count) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;