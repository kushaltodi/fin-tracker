const express = require('express');
const db = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { validateStockTrade } = require('../middleware/validation');

const router = express.Router();

// Create a new stock trade
router.post('/trades', authenticateToken, validateStockTrade, async (req, res, next) => {
  try {
    const { 
      account_id, 
      ticker_symbol, 
      trade_type, 
      quantity, 
      price_per_share, 
      trade_date = new Date().toISOString().split('T')[0] 
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

    // Find or create security
    let security = await db('securities')
      .where('ticker_symbol', ticker_symbol.toUpperCase())
      .whereNull('deleted_at')
      .first();

    if (!security) {
      const [securityId] = await db('securities').insert({
        ticker_symbol: ticker_symbol.toUpperCase(),
        security_name: ticker_symbol.toUpperCase(), // You can enhance this with API lookup
        asset_type: 'Stock'
      });
      security = await db('securities').where('security_id', securityId).first();
    }

    // Create the stock trade
    const [tradeId] = await db('stock_trades').insert({
      user_id: req.user.user_id,
      account_id,
      security_id: security.security_id,
      trade_type: trade_type.toUpperCase(),
      quantity: parseFloat(quantity),
      price_per_share: parseFloat(price_per_share),
      trade_date
    });

    // Create corresponding transaction
    const totalAmount = parseFloat(quantity) * parseFloat(price_per_share);
    const transactionType = trade_type.toUpperCase() === 'BUY' ? 'EXPENSE' : 'INCOME';
    const description = `${trade_type.toUpperCase()} ${quantity} shares of ${ticker_symbol.toUpperCase()} @ ${price_per_share}`;

    await db('transactions').insert({
      user_id: req.user.user_id,
      account_id,
      amount: totalAmount,
      transaction_type: transactionType,
      description,
      transaction_date: trade_date
    });

    // Get the created trade with details
    const newTrade = await db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .join('accounts', 'stock_trades.account_id', 'accounts.account_id')
      .where('stock_trades.trade_id', tradeId)
      .select(
        'stock_trades.*',
        'securities.ticker_symbol',
        'securities.security_name',
        'accounts.account_name'
      )
      .first();

    res.status(201).json({
      message: 'Stock trade created successfully',
      trade: newTrade
    });
  } catch (error) {
    next(error);
  }
});

// Get all stock trades for user
router.get('/trades', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 50, account_id, ticker_symbol, trade_type } = req.query;
    const offset = (page - 1) * limit;

    let query = db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .join('accounts', 'stock_trades.account_id', 'accounts.account_id')
      .where('stock_trades.user_id', req.user.user_id)
      .whereNull('stock_trades.deleted_at')
      .whereNull('accounts.deleted_at')
      .select(
        'stock_trades.*',
        'securities.ticker_symbol',
        'securities.security_name',
        'securities.asset_type',
        'accounts.account_name'
      );

    // Apply filters
    if (account_id) {
      query = query.where('stock_trades.account_id', account_id);
    }
    if (ticker_symbol) {
      query = query.where('securities.ticker_symbol', ticker_symbol.toUpperCase());
    }
    if (trade_type) {
      query = query.where('stock_trades.trade_type', trade_type.toUpperCase());
    }

    const trades = await query
      .orderBy('stock_trades.trade_date', 'desc')
      .orderBy('stock_trades.created_at', 'desc')
      .limit(parseInt(limit))
      .offset(offset);

    // Get total count for pagination
    const totalQuery = db('stock_trades')
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at');
    
    if (account_id) totalQuery.where('account_id', account_id);
    if (ticker_symbol) {
      totalQuery.join('securities', 'stock_trades.security_id', 'securities.security_id')
        .where('securities.ticker_symbol', ticker_symbol.toUpperCase());
    }
    if (trade_type) totalQuery.where('trade_type', trade_type.toUpperCase());

    const totalResult = await totalQuery.count('* as count').first();
    const total = parseInt(totalResult.count);

    res.json({
      trades,
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

// Get portfolio holdings
router.get('/holdings', authenticateToken, async (req, res, next) => {
  try {
    // Get all trades grouped by security
    const trades = await db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .join('accounts', 'stock_trades.account_id', 'accounts.account_id')
      .where('stock_trades.user_id', req.user.user_id)
      .whereNull('stock_trades.deleted_at')
      .whereNull('accounts.deleted_at')
      .select(
        'securities.security_id',
        'securities.ticker_symbol',
        'securities.security_name',
        'securities.asset_type',
        'accounts.account_name',
        'stock_trades.trade_type',
        'stock_trades.quantity',
        'stock_trades.price_per_share'
      )
      .orderBy('securities.ticker_symbol');

    // Calculate holdings
    const holdingsMap = new Map();

    trades.forEach(trade => {
      const key = `${trade.security_id}-${trade.account_name}`;
      
      if (!holdingsMap.has(key)) {
        holdingsMap.set(key, {
          security_id: trade.security_id,
          ticker_symbol: trade.ticker_symbol,
          security_name: trade.security_name,
          asset_type: trade.asset_type,
          account_name: trade.account_name,
          total_quantity: 0,
          total_invested: 0,
          trades_count: 0
        });
      }

      const holding = holdingsMap.get(key);
      const quantity = parseFloat(trade.quantity);
      const totalValue = quantity * parseFloat(trade.price_per_share);

      if (trade.trade_type === 'BUY') {
        holding.total_quantity += quantity;
        holding.total_invested += totalValue;
      } else if (trade.trade_type === 'SELL') {
        holding.total_quantity -= quantity;
        // For sells, reduce the average cost basis proportionally
        if (holding.total_quantity > 0) {
          const sellRatio = quantity / (holding.total_quantity + quantity);
          holding.total_invested -= (holding.total_invested * sellRatio);
        }
      }
      
      holding.trades_count++;
    });

    // Convert to array and calculate additional fields
    const holdings = Array.from(holdingsMap.values())
      .filter(holding => holding.total_quantity > 0) // Only show positions with quantity > 0
      .map(holding => ({
        ...holding,
        average_cost_basis: holding.total_quantity > 0 
          ? (holding.total_invested / holding.total_quantity).toFixed(2)
          : '0.00',
        total_quantity: holding.total_quantity.toFixed(5),
        total_invested: holding.total_invested.toFixed(2),
        // You can add current_price and unrealized_pl by integrating with stock price API
        current_price: null,
        current_value: null,
        unrealized_pl: null
      }));

    res.json(holdings);
  } catch (error) {
    next(error);
  }
});

// Get specific stock trade
router.get('/trades/:id', authenticateToken, async (req, res, next) => {
  try {
    const trade = await db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .join('accounts', 'stock_trades.account_id', 'accounts.account_id')
      .where('stock_trades.trade_id', req.params.id)
      .where('stock_trades.user_id', req.user.user_id)
      .whereNull('stock_trades.deleted_at')
      .select(
        'stock_trades.*',
        'securities.ticker_symbol',
        'securities.security_name',
        'securities.asset_type',
        'accounts.account_name'
      )
      .first();

    if (!trade) {
      return res.status(404).json({ error: 'Stock trade not found' });
    }

    res.json(trade);
  } catch (error) {
    next(error);
  }
});

// Update stock trade
router.put('/trades/:id', authenticateToken, validateStockTrade, async (req, res, next) => {
  try {
    const tradeId = req.params.id;
    const { 
      account_id, 
      ticker_symbol, 
      trade_type, 
      quantity, 
      price_per_share, 
      trade_date 
    } = req.body;

    // Get existing trade
    const existingTrade = await db('stock_trades')
      .where('trade_id', tradeId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingTrade) {
      return res.status(404).json({ error: 'Stock trade not found' });
    }

    // Verify account belongs to user
    const account = await db('accounts')
      .where('account_id', account_id)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!account) {
      return res.status(400).json({ error: 'Invalid account' });
    }

    // Find or create security if ticker changed
    let security;
    if (ticker_symbol.toUpperCase() !== existingTrade.ticker_symbol) {
      security = await db('securities')
        .where('ticker_symbol', ticker_symbol.toUpperCase())
        .whereNull('deleted_at')
        .first();

      if (!security) {
        const [securityId] = await db('securities').insert({
          ticker_symbol: ticker_symbol.toUpperCase(),
          security_name: ticker_symbol.toUpperCase(),
          asset_type: 'Stock'
        });
        security = await db('securities').where('security_id', securityId).first();
      }
    }

    // Update trade
    await db('stock_trades')
      .where('trade_id', tradeId)
      .update({
        account_id: account_id || existingTrade.account_id,
        security_id: security ? security.security_id : existingTrade.security_id,
        trade_type: trade_type ? trade_type.toUpperCase() : existingTrade.trade_type,
        quantity: quantity ? parseFloat(quantity) : existingTrade.quantity,
        price_per_share: price_per_share ? parseFloat(price_per_share) : existingTrade.price_per_share,
        trade_date: trade_date || existingTrade.trade_date
      });

    // Get updated trade
    const updatedTrade = await db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .join('accounts', 'stock_trades.account_id', 'accounts.account_id')
      .where('stock_trades.trade_id', tradeId)
      .select(
        'stock_trades.*',
        'securities.ticker_symbol',
        'securities.security_name',
        'accounts.account_name'
      )
      .first();

    res.json({
      message: 'Stock trade updated successfully',
      trade: updatedTrade
    });
  } catch (error) {
    next(error);
  }
});

// Delete stock trade (soft delete)
router.delete('/trades/:id', authenticateToken, async (req, res, next) => {
  try {
    const tradeId = req.params.id;

    const existingTrade = await db('stock_trades')
      .where('trade_id', tradeId)
      .where('user_id', req.user.user_id)
      .whereNull('deleted_at')
      .first();

    if (!existingTrade) {
      return res.status(404).json({ error: 'Stock trade not found' });
    }

    // Soft delete the trade
    await db('stock_trades')
      .where('trade_id', tradeId)
      .update({ deleted_at: new Date() });

    res.json({ message: 'Stock trade deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get deleted stock trades
router.get('/trades/trash', authenticateToken, async (req, res, next) => {
  try {
    const deletedTrades = await db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .join('accounts', 'stock_trades.account_id', 'accounts.account_id')
      .where('stock_trades.user_id', req.user.user_id)
      .whereNotNull('stock_trades.deleted_at')
      .select(
        'stock_trades.*',
        'securities.ticker_symbol',
        'securities.security_name',
        'accounts.account_name'
      )
      .orderBy('stock_trades.deleted_at', 'desc');

    res.json(deletedTrades);
  } catch (error) {
    next(error);
  }
});

// Restore deleted stock trade
router.put('/trades/:id/restore', authenticateToken, async (req, res, next) => {
  try {
    const tradeId = req.params.id;

    // Check if trade exists and belongs to user (including soft deleted)
    const existingTrade = await db('stock_trades')
      .where('trade_id', tradeId)
      .where('user_id', req.user.user_id)
      .first();

    if (!existingTrade) {
      return res.status(404).json({ error: 'Stock trade not found' });
    }

    if (!existingTrade.deleted_at) {
      return res.status(400).json({ error: 'Stock trade is not deleted' });
    }

    // Restore the trade
    await db('stock_trades')
      .where('trade_id', tradeId)
      .update({ deleted_at: null });

    const restoredTrade = await db('stock_trades')
      .join('securities', 'stock_trades.security_id', 'securities.security_id')
      .join('accounts', 'stock_trades.account_id', 'accounts.account_id')
      .where('stock_trades.trade_id', tradeId)
      .select(
        'stock_trades.*',
        'securities.ticker_symbol',
        'securities.security_name',
        'accounts.account_name'
      )
      .first();

    res.json({
      message: 'Stock trade restored successfully',
      trade: restoredTrade
    });
  } catch (error) {
    next(error);
  }
});

// Get all securities (stocks) that the user has traded
router.get('/securities', authenticateToken, async (req, res, next) => {
  try {
    const securities = await db('securities')
      .select(
        'securities.security_id',
        'securities.ticker_symbol',
        'securities.security_name',
        'securities.asset_type',
        db.raw('COUNT(DISTINCT stock_trades.trade_id) as trade_count'),
        db.raw('MIN(stock_trades.trade_date) as first_trade_date'),
        db.raw('MAX(stock_trades.trade_date) as last_trade_date')
      )
      .join('stock_trades', 'securities.security_id', 'stock_trades.security_id')
      .where('stock_trades.user_id', req.user.user_id)
      .whereNull('securities.deleted_at')
      .whereNull('stock_trades.deleted_at')
      .groupBy(
        'securities.security_id',
        'securities.ticker_symbol', 
        'securities.security_name',
        'securities.asset_type'
      )
      .orderBy('securities.ticker_symbol');

    res.json({
      success: true,
      data: securities
    });
  } catch (error) {
    next(error);
  }
});

// Create a new security
router.post('/securities', authenticateToken, async (req, res, next) => {
  try {
    const { ticker_symbol, security_name, asset_type = 'Stock' } = req.body;

    if (!ticker_symbol) {
      return res.status(400).json({ error: 'Ticker symbol is required' });
    }

    // Check if security already exists
    const existingSecurity = await db('securities')
      .where('ticker_symbol', ticker_symbol.toUpperCase())
      .whereNull('deleted_at')
      .first();

    if (existingSecurity) {
      return res.status(400).json({ error: 'Security with this ticker symbol already exists' });
    }

    const [securityId] = await db('securities').insert({
      ticker_symbol: ticker_symbol.toUpperCase(),
      security_name: security_name || ticker_symbol.toUpperCase(),
      asset_type
    });

    const newSecurity = await db('securities')
      .where('security_id', securityId)
      .first();

    res.status(201).json({
      success: true,
      message: 'Security created successfully',
      data: newSecurity
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;