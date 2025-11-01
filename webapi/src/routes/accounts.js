const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { validateAccount } = require('../middleware/validation');

const router = express.Router();

// Get all accounts for the authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    // Get accounts with calculated current balance
    const accounts = await db('accounts')
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');

    // Calculate current balance for each account
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        // Calculate current balance from transactions
        const balanceResult = await db('transactions')
          .where('account_id', account.account_id)
          .whereNull('deleted_at')
          .select(
            db.raw('SUM(CASE WHEN transaction_type = "INCOME" THEN amount ELSE 0 END) as total_income'),
            db.raw('SUM(CASE WHEN transaction_type = "EXPENSE" THEN amount ELSE 0 END) as total_expense')
          )
          .first();

        const totalIncome = parseFloat(balanceResult.total_income) || 0;
        const totalExpense = parseFloat(balanceResult.total_expense) || 0;
        const currentBalance = parseFloat(account.initial_balance) + totalIncome - totalExpense;

        return {
          ...account,
          current_balance: currentBalance.toFixed(2)
        };
      })
    );

    res.json(accountsWithBalance);
  } catch (error) {
    next(error);
  }
});

// Get soft-deleted accounts
router.get('/trash', authenticateToken, async (req, res, next) => {
  try {
    const deletedAccounts = await db('accounts')
      .where('user_id', req.user.user_id)
      .whereNotNull('deleted_at')
      .orderBy('deleted_at', 'desc');

    res.json(deletedAccounts);
  } catch (error) {
    next(error);
  }
});

// Get a specific account
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const account = await db('accounts')
      .where('account_id', req.params.id)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Calculate current balance
    const balanceResult = await db('transactions')
      .where('account_id', account.account_id)
      .whereNull('deleted_at')
      .select(
        db.raw('SUM(CASE WHEN transaction_type = "INCOME" THEN amount ELSE 0 END) as total_income'),
        db.raw('SUM(CASE WHEN transaction_type = "EXPENSE" THEN amount ELSE 0 END) as total_expense')
      )
      .first();

    const totalIncome = parseFloat(balanceResult.total_income) || 0;
    const totalExpense = parseFloat(balanceResult.total_expense) || 0;
    const currentBalance = parseFloat(account.initial_balance) + totalIncome - totalExpense;

    res.json({
      ...account,
      current_balance: currentBalance.toFixed(2)
    });
  } catch (error) {
    next(error);
  }
});

// Create a new account
router.post('/', authenticateToken, validateAccount, async (req, res, next) => {
  try {
    const { account_name, account_type, initial_balance = 0 } = req.body;

    const [accountId] = await db('accounts').insert({
      user_id: req.user.user_id,
      account_name,
      account_type,
      initial_balance
    });

    const newAccount = await db('accounts').where('account_id', accountId).first();

    res.status(201).json({
      message: 'Account created successfully',
      account: {
        ...newAccount,
        current_balance: parseFloat(newAccount.initial_balance).toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update an account
router.put('/:id', authenticateToken, validateAccount, async (req, res, next) => {
  try {
    const { account_name, account_type } = req.body;
    const accountId = req.params.id;

    // Check if account exists and belongs to user
    const existingAccount = await db('accounts')
      .where('account_id', accountId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await db('accounts')
      .where('account_id', accountId)
      .update({
        account_name: account_name || existingAccount.account_name,
        account_type: account_type || existingAccount.account_type
      });

    const updatedAccount = await db('accounts').where('account_id', accountId).first();

    // Calculate current balance
    const balanceResult = await db('transactions')
      .where('account_id', accountId)
      .whereNull('deleted_at')
      .select(
        db.raw('SUM(CASE WHEN transaction_type = "INCOME" THEN amount ELSE 0 END) as total_income'),
        db.raw('SUM(CASE WHEN transaction_type = "EXPENSE" THEN amount ELSE 0 END) as total_expense')
      )
      .first();

    const totalIncome = parseFloat(balanceResult.total_income) || 0;
    const totalExpense = parseFloat(balanceResult.total_expense) || 0;
    const currentBalance = parseFloat(updatedAccount.initial_balance) + totalIncome - totalExpense;

    res.json({
      message: 'Account updated successfully',
      account: {
        ...updatedAccount,
        current_balance: currentBalance.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete an account (soft delete)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const accountId = req.params.id;

    // Check if account exists and belongs to user
    const existingAccount = await db('accounts')
      .where('account_id', accountId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Soft delete the account
    await db('accounts')
      .where('account_id', accountId)
      .update({ deleted_at: new Date() });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Restore a soft-deleted account
router.put('/:id/restore', authenticateToken, async (req, res, next) => {
  try {
    const accountId = req.params.id;

    // Check if account exists and belongs to user (including soft deleted)
    const existingAccount = await db('accounts')
      .where('account_id', accountId)
      .where('user_id', req.user.user_id)
      .first();

    if (!existingAccount) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (!existingAccount.deleted_at) {
      return res.status(400).json({ error: 'Account is not deleted' });
    }

    // Restore the account
    await db('accounts')
      .where('account_id', accountId)
      .update({ deleted_at: null });

    const restoredAccount = await db('accounts').where('account_id', accountId).first();

    // Calculate current balance
    const balanceResult = await db('transactions')
      .where('account_id', accountId)
      .whereNull('deleted_at')
      .select(
        db.raw('SUM(CASE WHEN transaction_type = "INCOME" THEN amount ELSE 0 END) as total_income'),
        db.raw('SUM(CASE WHEN transaction_type = "EXPENSE" THEN amount ELSE 0 END) as total_expense')
      )
      .first();

    const totalIncome = parseFloat(balanceResult.total_income) || 0;
    const totalExpense = parseFloat(balanceResult.total_expense) || 0;
    const currentBalance = parseFloat(restoredAccount.initial_balance) + totalIncome - totalExpense;

    res.json({
      message: 'Account restored successfully',
      account: {
        ...restoredAccount,
        current_balance: currentBalance.toFixed(2)
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;