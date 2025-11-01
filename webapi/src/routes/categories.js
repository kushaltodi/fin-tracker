const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { validateCategory } = require('../middleware/validation');

const router = express.Router();

// Get all categories for the authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { category_type } = req.query;

    let query = db('categories')
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at');

    if (category_type) {
      query = query.where('category_type', category_type);
    }

    const categories = await query.orderBy('category_name', 'asc');

    res.json(categories);
  } catch (error) {
    next(error);
  }
});

// Get soft-deleted categories
router.get('/trash', authenticateToken, async (req, res, next) => {
  try {
    const deletedCategories = await db('categories')
      .where('user_id', req.user.user_id)
      .whereNotNull('deleted_at')
      .orderBy('deleted_at', 'desc');

    res.json(deletedCategories);
  } catch (error) {
    next(error);
  }
});

// Get a specific category
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const category = await db('categories')
      .where('category_id', req.params.id)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    next(error);
  }
});

// Create a new category
router.post('/', authenticateToken, validateCategory, async (req, res, next) => {
  try {
    const { category_name, category_type } = req.body;

    // Check if category with same name already exists for this user
    const existingCategory = await db('categories')
      .where('user_id', req.user.user_id)
      .where('category_name', category_name)
      .whereNull('deleted_at')
      .first();

    if (existingCategory) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    const [categoryId] = await db('categories').insert({
      user_id: req.user.user_id,
      category_name,
      category_type
    });

    const newCategory = await db('categories').where('category_id', categoryId).first();

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory
    });
  } catch (error) {
    next(error);
  }
});

// Update a category
router.put('/:id', authenticateToken, validateCategory, async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const { category_name, category_type } = req.body;

    // Check if category exists and belongs to user
    const existingCategory = await db('categories')
      .where('category_id', categoryId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if another category with same name exists
    const duplicateCategory = await db('categories')
      .where('user_id', req.user.user_id)
      .where('category_name', category_name)
      .where('category_id', '!=', categoryId)
      .whereNull('deleted_at')
      .first();

    if (duplicateCategory) {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }

    await db('categories')
      .where('category_id', categoryId)
      .update({
        category_name: category_name || existingCategory.category_name,
        category_type: category_type || existingCategory.category_type
      });

    const updatedCategory = await db('categories').where('category_id', categoryId).first();

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    next(error);
  }
});

// Delete a category (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    // Check if category exists and belongs to user
    const existingCategory = await db('categories')
      .where('category_id', categoryId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Soft delete the category
    await db('categories')
      .where('category_id', categoryId)
      .update({ deleted_at: new Date() });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Restore a soft-deleted category
router.put('/:id/restore', authenticateToken, async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    // Check if category exists and belongs to user (including soft deleted)
    const existingCategory = await db('categories')
      .where('category_id', categoryId)
      .where('user_id', req.user.user_id)
      .first();

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!existingCategory.deleted_at) {
      return res.status(400).json({ error: 'Category is not deleted' });
    }

    // Restore the category
    await db('categories')
      .where('category_id', categoryId)
      .update({ deleted_at: null });

    const restoredCategory = await db('categories').where('category_id', categoryId).first();

    res.json({
      message: 'Category restored successfully',
      category: restoredCategory
    });
  } catch (error) {
    next(error);
  }
});

// Get category spending statistics
router.get('/:id/stats', authenticateToken, async (req, res, next) => {
  try {
    const categoryId = req.params.id;
    const { startDate, endDate } = req.query;

    // Check if category exists and belongs to user
    const category = await db('categories')
      .where('category_id', categoryId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let query = db('transactions')
      .where('category_id', categoryId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at');

    if (startDate) query = query.where('transaction_date', '>=', startDate);
    if (endDate) query = query.where('transaction_date', '<=', endDate);

    const stats = await query
      .select(
        db.raw('COUNT(*) as transactionCount'),
        db.raw('SUM(amount) as totalAmount'),
        db.raw('AVG(amount) as averageAmount'),
        db.raw('MIN(amount) as minAmount'),
        db.raw('MAX(amount) as maxAmount')
      )
      .first();

    res.json({
      category,
      statistics: {
        transactionCount: parseInt(stats.transactionCount) || 0,
        totalAmount: parseFloat(stats.totalAmount) || 0,
        averageAmount: parseFloat(stats.averageAmount) || 0,
        minAmount: parseFloat(stats.minAmount) || 0,
        maxAmount: parseFloat(stats.maxAmount) || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get spending by category (for charts/reports)
router.get('/stats/spending', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate, transaction_type = 'EXPENSE' } = req.query;

    let query = db('transactions')
      .join('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.user_id', req.user.user_id)
      .where('transactions.transaction_type', transaction_type)
      .whereNull('transactions.deleted_at')
      .whereNull('categories.deleted_at');

    if (startDate) query = query.where('transactions.transaction_date', '>=', startDate);
    if (endDate) query = query.where('transactions.transaction_date', '<=', endDate);

    const categorySpending = await query
      .select(
        'categories.category_id',
        'categories.category_name',
        'categories.category_type',
        db.raw('SUM(transactions.amount) as totalAmount'),
        db.raw('COUNT(transactions.transaction_id) as transactionCount')
      )
      .groupBy('categories.category_id', 'categories.category_name', 'categories.category_type')
      .orderBy('totalAmount', 'desc');

    const formattedData = categorySpending.map(item => ({
      ...item,
      totalAmount: parseFloat(item.totalAmount),
      transactionCount: parseInt(item.transactionCount)
    }));

    res.json(formattedData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;