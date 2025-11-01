const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { validateTransaction, validateTransfer } = require('../middleware/validation');

const router = express.Router();

// Get all transactions for the authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, account_id, category_id, transaction_type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.account_id')
      .leftJoin('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.user_id', req.user.user_id)
      .whereNull('transactions.deleted_at')
      .whereNull('accounts.deleted_at')
      .select(
        'transactions.*',
        'accounts.account_name',
        'categories.category_name',
        'categories.category_type'
      );

    // Apply filters
    if (account_id) {
      query = query.where('transactions.account_id', account_id);
    }
    if (category_id) {
      query = query.where('transactions.category_id', category_id);
    }
    if (transaction_type) {
      query = query.where('transactions.transaction_type', transaction_type);
    }
    if (startDate) {
      query = query.where('transactions.transaction_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('transactions.transaction_date', '<=', endDate);
    }

    const transactions = await query
      .orderBy('transactions.transaction_date', 'desc')
      .orderBy('transactions.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    // Get total count for pagination
    const totalQuery = db('transactions')
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at');
    
    if (account_id) totalQuery.where('account_id', account_id);
    if (category_id) totalQuery.where('category_id', category_id);
    if (transaction_type) totalQuery.where('transaction_type', transaction_type);
    if (startDate) totalQuery.where('transaction_date', '>=', startDate);
    if (endDate) totalQuery.where('transaction_date', '<=', endDate);

    const totalResult = await totalQuery.count('* as count').first();
    const total = parseInt(totalResult.count);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get soft-deleted transactions
router.get('/trash', authenticateToken, async (req, res, next) => {
  try {
    const deletedTransactions = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.account_id')
      .leftJoin('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.user_id', req.user.user_id)
      .whereNotNull('transactions.deleted_at')
      .select(
        'transactions.*',
        'accounts.account_name',
        'categories.category_name',
        'categories.category_type'
      )
      .orderBy('transactions.deleted_at', 'desc');

    res.json(deletedTransactions);
  } catch (error) {
    next(error);
  }
});

// Get a specific transaction
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const transaction = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.account_id')
      .leftJoin('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.transaction_id', req.params.id)
      .where('transactions.user_id', req.user.user_id)
      .whereNull('transactions.deleted_at')
      .select(
        'transactions.*',
        'accounts.account_name',
        'categories.category_name',
        'categories.category_type'
      )
      .first();

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
});

// Create a new transaction (INCOME or EXPENSE)
router.post('/', authenticateToken, validateTransaction, async (req, res, next) => {
  try {
    const { 
      account_id, 
      category_id, 
      amount, 
      transaction_type, 
      description, 
      transaction_date = new Date().toISOString().split('T')[0] 
    } = req.body;

    // Verify account belongs to user
    const account = await db('accounts')
      .where('account_id', account_id)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!account) {
      return res.status(400).json({ error: 'Invalid account' });
    }

    // Verify category belongs to user (if provided)
    if (category_id) {
      const category = await db('categories')
        .where('category_id', category_id)
        .where('user_id', req.user.user_id)
        .whereNull('deleted_at')
        .first();

      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      // Validate transaction type matches category type
      const expectedType = category.category_type === 'Income' ? 'INCOME' : 'EXPENSE';
      if (transaction_type !== expectedType) {
        return res.status(400).json({ 
          error: `Transaction type ${transaction_type} doesn't match category type ${category.category_type}` 
        });
      }
    }

    const [transactionId] = await db('transactions').insert({
      user_id: req.user.user_id,
      account_id,
      category_id,
      amount: Math.abs(amount),
      transaction_type,
      description,
      transaction_date
    });

    const newTransaction = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.account_id')
      .leftJoin('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.transaction_id', transactionId)
      .select(
        'transactions.*',
        'accounts.account_name',
        'categories.category_name',
        'categories.category_type'
      )
      .first();

    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: newTransaction
    });
  } catch (error) {
    next(error);
  }
});

// Create a transfer between two accounts
router.post('/transfer', authenticateToken, validateTransfer, async (req, res, next) => {
  try {
    const { 
      from_account_id, 
      to_account_id, 
      amount, 
      description, 
      transaction_date = new Date().toISOString().split('T')[0] 
    } = req.body;

    // Verify both accounts belong to user
    const fromAccount = await db('accounts')
      .where('account_id', from_account_id)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    const toAccount = await db('accounts')
      .where('account_id', to_account_id)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!fromAccount) {
      return res.status(400).json({ error: 'Invalid from account' });
    }

    if (!toAccount) {
      return res.status(400).json({ error: 'Invalid to account' });
    }

    if (from_account_id === to_account_id) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }

    // Generate a transfer group ID to link both transactions
    const transferGroupId = uuidv4();

    // Create both transactions in a single operation
    const transactionData = [
      {
        user_id: req.user.user_id,
        account_id: from_account_id,
        amount: Math.abs(amount),
        transaction_type: 'TRANSFER',
        description: description || `Transfer to ${toAccount.account_name}`,
        transaction_date,
        transfer_group_id: transferGroupId
      },
      {
        user_id: req.user.user_id,
        account_id: to_account_id,
        amount: Math.abs(amount),
        transaction_type: 'TRANSFER',
        description: description || `Transfer from ${fromAccount.account_name}`,
        transaction_date,
        transfer_group_id: transferGroupId
      }
    ];

    const transactionIds = await db('transactions').insert(transactionData);

    // Get the created transactions with account details
    const createdTransactions = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.account_id')
      .where('transactions.transfer_group_id', transferGroupId)
      .select(
        'transactions.*',
        'accounts.account_name'
      )
      .orderBy('transactions.transaction_id');

    res.status(201).json({
      message: 'Transfer created successfully',
      transfer_group_id: transferGroupId,
      transactions: createdTransactions
    });
  } catch (error) {
    next(error);
  }
});

// Update a transaction
router.put('/:id', authenticateToken, validateTransaction, async (req, res, next) => {
  try {
    const transactionId = req.params.id;
    const { 
      account_id, 
      category_id, 
      amount, 
      transaction_type, 
      description, 
      transaction_date 
    } = req.body;

    // Get existing transaction
    const existingTransaction = await db('transactions')
      .where('transaction_id', transactionId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Don't allow updating transfer transactions through this endpoint
    if (existingTransaction.transaction_type === 'TRANSFER') {
      return res.status(400).json({ 
        error: 'Transfer transactions cannot be updated individually. Please delete and recreate the transfer.' 
      });
    }

    // Verify new account belongs to user
    if (account_id) {
      const account = await db('accounts')
        .where('account_id', account_id)
        .where('user_id', req.user.user_id)
        .whereNull('deleted_at')
        .first();

      if (!account) {
        return res.status(400).json({ error: 'Invalid account' });
      }
    }

    // Verify new category belongs to user (if provided)
    if (category_id) {
      const category = await db('categories')
        .where('category_id', category_id)
        .where('user_id', req.user.user_id)
        .whereNull('deleted_at')
        .first();

      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    // Update transaction
    await db('transactions')
      .where('transaction_id', transactionId)
      .update({
        account_id: account_id || existingTransaction.account_id,
        category_id: category_id || existingTransaction.category_id,
        amount: amount ? Math.abs(amount) : existingTransaction.amount,
        transaction_type: transaction_type || existingTransaction.transaction_type,
        description: description !== undefined ? description : existingTransaction.description,
        transaction_date: transaction_date || existingTransaction.transaction_date
      });

    const updatedTransaction = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.account_id')
      .leftJoin('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.transaction_id', transactionId)
      .select(
        'transactions.*',
        'accounts.account_name',
        'categories.category_name',
        'categories.category_type'
      )
      .first();

    res.json({
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });
  } catch (error) {
    next(error);
  }
});

// Delete a transaction (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const transactionId = req.params.id;

    const existingTransaction = await db('transactions')
      .where('transaction_id', transactionId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If it's a transfer, delete both transactions
    if (existingTransaction.transaction_type === 'TRANSFER' && existingTransaction.transfer_group_id) {
      await db('transactions')
        .where('transfer_group_id', existingTransaction.transfer_group_id)
        .update({ deleted_at: new Date() });

      res.json({ message: 'Transfer transactions deleted successfully' });
    } else {
      // Soft delete single transaction
      await db('transactions')
        .where('transaction_id', transactionId)
        .update({ deleted_at: new Date() });

      res.json({ message: 'Transaction deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
});

// Restore a soft-deleted transaction
router.put('/:id/restore', authenticateToken, async (req, res, next) => {
  try {
    const transactionId = req.params.id;

    // Check if transaction exists and belongs to user (including soft deleted)
    const existingTransaction = await db('transactions')
      .where('transaction_id', transactionId)
      .where('user_id', req.user.user_id)
      .first();

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (!existingTransaction.deleted_at) {
      return res.status(400).json({ error: 'Transaction is not deleted' });
    }

    // If it's a transfer, restore both transactions
    if (existingTransaction.transaction_type === 'TRANSFER' && existingTransaction.transfer_group_id) {
      await db('transactions')
        .where('transfer_group_id', existingTransaction.transfer_group_id)
        .update({ deleted_at: null });

      const restoredTransactions = await db('transactions')
        .join('accounts', 'transactions.account_id', 'accounts.account_id')
        .where('transactions.transfer_group_id', existingTransaction.transfer_group_id)
        .select(
          'transactions.*',
          'accounts.account_name'
        );

      res.json({
        message: 'Transfer transactions restored successfully',
        transactions: restoredTransactions
      });
    } else {
      // Restore single transaction
      await db('transactions')
        .where('transaction_id', transactionId)
        .update({ deleted_at: null });

      const restoredTransaction = await db('transactions')
        .join('accounts', 'transactions.account_id', 'accounts.account_id')
        .leftJoin('categories', 'transactions.category_id', 'categories.category_id')
        .where('transactions.transaction_id', transactionId)
        .select(
          'transactions.*',
          'accounts.account_name',
          'categories.category_name',
          'categories.category_type'
        )
        .first();

      res.json({
        message: 'Transaction restored successfully',
        transaction: restoredTransaction
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get transaction statistics
router.get('/stats/summary', authenticateToken, async (req, res, next) => {
  try {
    const { startDate, endDate, account_id } = req.query;

    let query = db('transactions')
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at');

    if (startDate) query = query.where('transaction_date', '>=', startDate);
    if (endDate) query = query.where('transaction_date', '<=', endDate);
    if (account_id) query = query.where('account_id', account_id);

    const stats = await query
      .select(
        db.raw('SUM(CASE WHEN transaction_type = "INCOME" THEN amount ELSE 0 END) as totalIncome'),
        db.raw('SUM(CASE WHEN transaction_type = "EXPENSE" THEN amount ELSE 0 END) as totalExpenses'),
        db.raw('COUNT(CASE WHEN transaction_type = "INCOME" THEN 1 END) as incomeTransactions'),
        db.raw('COUNT(CASE WHEN transaction_type = "EXPENSE" THEN 1 END) as expenseTransactions'),
        db.raw('COUNT(CASE WHEN transaction_type = "TRANSFER" THEN 1 END) as transferTransactions')
      )
      .first();

    const totalIncome = parseFloat(stats.totalIncome) || 0;
    const totalExpenses = parseFloat(stats.totalExpenses) || 0;

    res.json({
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      incomeTransactions: parseInt(stats.incomeTransactions) || 0,
      expenseTransactions: parseInt(stats.expenseTransactions) || 0,
      transferTransactions: parseInt(stats.transferTransactions) || 0
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;