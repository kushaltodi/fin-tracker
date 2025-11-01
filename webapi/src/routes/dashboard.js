const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comprehensive dashboard summary
router.get('/summary', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Get all accounts with current balances
    const accounts = await db('accounts')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');

    const accountBalances = await Promise.all(
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
          account_id: account.account_id,
          account_name: account.account_name,
          account_type: account.account_type,
          current_balance: parseFloat(currentBalance.toFixed(2))
        };
      })
    );

    // Calculate totals by account type
    const totalCash = accountBalances
      .filter(acc => ['Bank', 'Cash', 'Checking', 'Savings'].includes(acc.account_type))
      .reduce((sum, acc) => sum + acc.current_balance, 0);

    const totalInvestments = accountBalances
      .filter(acc => ['Investment', 'Brokerage'].includes(acc.account_type))
      .reduce((sum, acc) => sum + acc.current_balance, 0);

    const totalLiabilities = accountBalances
      .filter(acc => ['Loan', 'Credit', 'Debt'].includes(acc.account_type))
      .reduce((sum, acc) => sum + Math.abs(acc.current_balance), 0);

    // Get portfolio summary
    const portfolioSummary = await getPortfolioSummary(userId);

    // Calculate net worth
    const netWorth = totalCash + totalInvestments + portfolioSummary.total_value - totalLiabilities;

    // Get recent transactions (last 10)
    const recentTransactions = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.account_id')
      .leftJoin('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.user_id', userId)
      .whereNull('transactions.deleted_at')
      .whereNull('accounts.deleted_at')
      .select(
        'transactions.transaction_id',
        'transactions.amount',
        'transactions.transaction_type',
        'transactions.description',
        'transactions.transaction_date',
        'accounts.account_name',
        'categories.category_name'
      )
      .orderBy('transactions.transaction_date', 'desc')
      .orderBy('transactions.created_at', 'desc')
      .limit(10);

    // Get monthly income/expense trend (last 6 months)
    const monthlyTrends = await getMonthlyTrends(userId);

    // Get category spending (current month)
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const categorySpending = await db('transactions')
      .join('categories', 'transactions.category_id', 'categories.category_id')
      .where('transactions.user_id', userId)
      .where('transactions.transaction_type', 'EXPENSE')
      .whereBetween('transactions.transaction_date', [
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      ])
      .whereNull('transactions.deleted_at')
      .whereNull('categories.deleted_at')
      .select(
        'categories.category_id',
        'categories.category_name',
        db.raw('SUM(transactions.amount) as total_amount'),
        db.raw('COUNT(transactions.transaction_id) as transaction_count')
      )
      .groupBy('categories.category_id', 'categories.category_name')
      .orderBy('total_amount', 'desc')
      .limit(5);

    res.json({
      net_worth: parseFloat(netWorth.toFixed(2)),
      total_cash: parseFloat(totalCash.toFixed(2)),
      total_investments: parseFloat(totalInvestments.toFixed(2)),
      total_liabilities: parseFloat(totalLiabilities.toFixed(2)),
      account_balances: accountBalances,
      investment_summary: {
        total_value: portfolioSummary.total_value,
        total_invested: portfolioSummary.total_invested,
        total_unrealized_pl: portfolioSummary.total_unrealized_pl,
        holdings_count: portfolioSummary.holdings_count
      },
      recent_transactions: recentTransactions.map(tx => ({
        transaction_id: tx.transaction_id,
        description: tx.description || `${tx.transaction_type} - ${tx.account_name}`,
        amount: tx.transaction_type === 'EXPENSE' ? -parseFloat(tx.amount) : parseFloat(tx.amount),
        transaction_type: tx.transaction_type,
        transaction_date: tx.transaction_date,
        account_name: tx.account_name,
        category_name: tx.category_name
      })),
      monthly_trends: monthlyTrends,
      top_categories: categorySpending.map(cat => ({
        category_id: cat.category_id,
        category_name: cat.category_name,
        total_amount: parseFloat(cat.total_amount),
        transaction_count: parseInt(cat.transaction_count)
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to get portfolio summary
async function getPortfolioSummary(userId) {
  try {
    const trades = await db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .where('stock_trades.user_id', userId)
      .whereNull('stock_trades.deleted_at')
      .select(
        'securities.ticker_symbol',
        'stock_trades.trade_type',
        'stock_trades.quantity',
        'stock_trades.price_per_share'
      );

    const holdingsMap = new Map();
    let totalInvested = 0;

    trades.forEach(trade => {
      const ticker = trade.ticker_symbol;
      
      if (!holdingsMap.has(ticker)) {
        holdingsMap.set(ticker, {
          quantity: 0,
          invested: 0
        });
      }

      const holding = holdingsMap.get(ticker);
      const quantity = parseFloat(trade.quantity);
      const totalValue = quantity * parseFloat(trade.price_per_share);

      if (trade.trade_type === 'BUY') {
        holding.quantity += quantity;
        holding.invested += totalValue;
        totalInvested += totalValue;
      } else if (trade.trade_type === 'SELL') {
        holding.quantity -= quantity;
        const sellRatio = quantity / (holding.quantity + quantity);
        holding.invested -= (holding.invested * sellRatio);
        totalInvested -= totalValue;
      }
    });

    const activeHoldings = Array.from(holdingsMap.values()).filter(h => h.quantity > 0);

    return {
      total_value: totalInvested, // In real app, this would be current market value
      total_invested: totalInvested,
      total_unrealized_pl: 0, // Would calculate from current prices
      holdings_count: activeHoldings.length
    };
  } catch (error) {
    return {
      total_value: 0,
      total_invested: 0,
      total_unrealized_pl: 0,
      holdings_count: 0
    };
  }
}

// Helper function to get monthly trends
async function getMonthlyTrends(userId) {
  try {
    const trends = [];
    const currentDate = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);

      const monthlyStats = await db('transactions')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .whereBetween('transaction_date', [
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        ])
        .select(
          db.raw('SUM(CASE WHEN transaction_type = "INCOME" THEN amount ELSE 0 END) as income'),
          db.raw('SUM(CASE WHEN transaction_type = "EXPENSE" THEN amount ELSE 0 END) as expense')
        )
        .first();

      trends.push({
        month: date.toISOString().slice(0, 7), // YYYY-MM format
        income: parseFloat(monthlyStats.income) || 0,
        expense: parseFloat(monthlyStats.expense) || 0,
        net: (parseFloat(monthlyStats.income) || 0) - (parseFloat(monthlyStats.expense) || 0)
      });
    }

    return trends;
  } catch (error) {
    return [];
  }
}

module.exports = router;