const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { validateBudget } = require('../middleware/validation');

const router = express.Router();

// Get all budgets for the authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { period, isActive } = req.query;

    let query = db('budgets')
      .join('categories', 'budgets.categoryId', 'categories.id')
      .where('budgets.userId', req.user.id)
      .select(
        'budgets.*',
        'categories.name as categoryName',
        'categories.color as categoryColor',
        'categories.type as categoryType'
      );

    if (period) {
      query = query.where('budgets.period', period);
    }

    if (isActive !== undefined) {
      query = query.where('budgets.isActive', isActive === 'true');
    }

    const budgets = await query.orderBy('budgets.created_at', 'desc');

    // Calculate spent amount and remaining for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        // Calculate date range based on period
        const now = new Date();
        let startDate, endDate;

        if (budget.period === 'monthly') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (budget.period === 'yearly') {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
        } else {
          startDate = new Date(budget.startDate);
          endDate = budget.endDate ? new Date(budget.endDate) : new Date();
        }

        // Get spent amount for the period
        const spentResult = await db('transactions')
          .where('userId', req.user.id)
          .where('categoryId', budget.categoryId)
          .where('type', 'expense')
          .whereBetween('date', [
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ])
          .sum('amount as spent')
          .first();

        const spent = parseFloat(spentResult.spent) || 0;
        const budgetAmount = parseFloat(budget.amount);
        const remaining = budgetAmount - spent;
        const percentageUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        return {
          ...budget,
          spent,
          remaining,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          isOverBudget: spent > budgetAmount,
          currentPeriod: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          }
        };
      })
    );

    res.json(budgetsWithSpending);
  } catch (error) {
    next(error);
  }
});

// Get a specific budget
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const budget = await db('budgets')
      .join('categories', 'budgets.categoryId', 'categories.id')
      .where('budgets.id', req.params.id)
      .where('budgets.userId', req.user.id)
      .select(
        'budgets.*',
        'categories.name as categoryName',
        'categories.color as categoryColor',
        'categories.type as categoryType'
      )
      .first();

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Calculate spent amount for current period
    const now = new Date();
    let startDate, endDate;

    if (budget.period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (budget.period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      startDate = new Date(budget.startDate);
      endDate = budget.endDate ? new Date(budget.endDate) : new Date();
    }

    const spentResult = await db('transactions')
      .where('userId', req.user.id)
      .where('categoryId', budget.categoryId)
      .where('type', 'expense')
      .whereBetween('date', [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ])
      .sum('amount as spent')
      .first();

    const spent = parseFloat(spentResult.spent) || 0;
    const budgetAmount = parseFloat(budget.amount);
    const remaining = budgetAmount - spent;
    const percentageUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

    res.json({
      ...budget,
      spent,
      remaining,
      percentageUsed: Math.round(percentageUsed * 100) / 100,
      isOverBudget: spent > budgetAmount,
      currentPeriod: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create a new budget
router.post('/', authenticateToken, validateBudget, async (req, res, next) => {
  try {
    const { categoryId, amount, period, startDate, endDate } = req.body;

    // Verify category belongs to user and is of type 'expense'
    const category = await db('categories')
      .where('id', categoryId)
      .where('userId', req.user.id)
      .where('type', 'expense')
      .first();

    if (!category) {
      return res.status(400).json({ error: 'Invalid category or category must be of type expense' });
    }

    // Check if budget already exists for this category and period
    const existingBudget = await db('budgets')
      .where('userId', req.user.id)
      .where('categoryId', categoryId)
      .where('period', period)
      .where('isActive', true)
      .first();

    if (existingBudget) {
      return res.status(409).json({ error: 'Active budget already exists for this category and period' });
    }

    const budgetData = {
      userId: req.user.id,
      categoryId,
      amount,
      period,
      startDate: startDate || new Date().toISOString().split('T')[0]
    };

    if (endDate) {
      budgetData.endDate = endDate;
    }

    const [budgetId] = await db('budgets').insert(budgetData);

    const newBudget = await db('budgets')
      .join('categories', 'budgets.categoryId', 'categories.id')
      .where('budgets.id', budgetId)
      .select(
        'budgets.*',
        'categories.name as categoryName',
        'categories.color as categoryColor',
        'categories.type as categoryType'
      )
      .first();

    res.status(201).json({
      message: 'Budget created successfully',
      budget: newBudget
    });
  } catch (error) {
    next(error);
  }
});

// Update a budget
router.put('/:id', authenticateToken, validateBudget, async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    const { categoryId, amount, period, startDate, endDate, isActive } = req.body;

    // Check if budget exists and belongs to user
    const existingBudget = await db('budgets')
      .where('id', budgetId)
      .where('userId', req.user.id)
      .first();

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    // Verify category belongs to user and is of type 'expense'
    const category = await db('categories')
      .where('id', categoryId)
      .where('userId', req.user.id)
      .where('type', 'expense')
      .first();

    if (!category) {
      return res.status(400).json({ error: 'Invalid category or category must be of type expense' });
    }

    // Check for duplicate budget (if category or period changed)
    if (categoryId !== existingBudget.categoryId || period !== existingBudget.period) {
      const duplicateBudget = await db('budgets')
        .where('userId', req.user.id)
        .where('categoryId', categoryId)
        .where('period', period)
        .where('isActive', true)
        .where('id', '!=', budgetId)
        .first();

      if (duplicateBudget) {
        return res.status(409).json({ error: 'Active budget already exists for this category and period' });
      }
    }

    const updateData = {
      categoryId,
      amount,
      period,
      startDate: startDate || existingBudget.startDate,
      isActive: isActive !== undefined ? isActive : existingBudget.isActive,
      updated_at: new Date()
    };

    if (endDate !== undefined) {
      updateData.endDate = endDate;
    }

    await db('budgets')
      .where('id', budgetId)
      .update(updateData);

    const updatedBudget = await db('budgets')
      .join('categories', 'budgets.categoryId', 'categories.id')
      .where('budgets.id', budgetId)
      .select(
        'budgets.*',
        'categories.name as categoryName',
        'categories.color as categoryColor',
        'categories.type as categoryType'
      )
      .first();

    res.json({
      message: 'Budget updated successfully',
      budget: updatedBudget
    });
  } catch (error) {
    next(error);
  }
});

// Delete a budget
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const budgetId = req.params.id;

    const existingBudget = await db('budgets')
      .where('id', budgetId)
      .where('userId', req.user.id)
      .first();

    if (!existingBudget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    await db('budgets').where('id', budgetId).del();

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get budget performance/analytics
router.get('/stats/performance', authenticateToken, async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;

    // Get all active budgets for the user
    const budgets = await db('budgets')
      .join('categories', 'budgets.categoryId', 'categories.id')
      .where('budgets.userId', req.user.id)
      .where('budgets.isActive', true)
      .where('budgets.period', period)
      .select(
        'budgets.*',
        'categories.name as categoryName',
        'categories.color as categoryColor'
      );

    const performance = await Promise.all(
      budgets.map(async (budget) => {
        // Calculate date range
        const now = new Date();
        let startDate, endDate;

        if (period === 'monthly') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
        }

        const spentResult = await db('transactions')
          .where('userId', req.user.id)
          .where('categoryId', budget.categoryId)
          .where('type', 'expense')
          .whereBetween('date', [
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ])
          .sum('amount as spent')
          .first();

        const spent = parseFloat(spentResult.spent) || 0;
        const budgetAmount = parseFloat(budget.amount);
        const percentageUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

        return {
          budgetId: budget.id,
          categoryName: budget.categoryName,
          categoryColor: budget.categoryColor,
          budgetAmount,
          spent,
          remaining: budgetAmount - spent,
          percentageUsed: Math.round(percentageUsed * 100) / 100,
          isOverBudget: spent > budgetAmount,
          status: spent > budgetAmount ? 'over' : spent > budgetAmount * 0.8 ? 'warning' : 'good'
        };
      })
    );

    // Calculate overall statistics
    const totalBudget = performance.reduce((sum, item) => sum + item.budgetAmount, 0);
    const totalSpent = performance.reduce((sum, item) => sum + item.spent, 0);
    const overBudgetCount = performance.filter(item => item.isOverBudget).length;

    res.json({
      period,
      overallStats: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        overallPercentageUsed: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100 * 100) / 100 : 0,
        budgetsOverLimit: overBudgetCount,
        totalBudgets: performance.length
      },
      budgetPerformance: performance
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;