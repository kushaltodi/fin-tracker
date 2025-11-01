/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('categories').del();
  await knex('securities').del();
  
  // Insert default categories for expense
  const expenseCategories = [
    { category_name: 'Food & Dining', category_type: 'Expense' },
    { category_name: 'Transportation', category_type: 'Expense' },
    { category_name: 'Shopping', category_type: 'Expense' },
    { category_name: 'Entertainment', category_type: 'Expense' },
    { category_name: 'Bills & Utilities', category_type: 'Expense' },
    { category_name: 'Healthcare', category_type: 'Expense' },
    { category_name: 'Education', category_type: 'Expense' },
    { category_name: 'Travel', category_type: 'Expense' },
    { category_name: 'Personal Care', category_type: 'Expense' },
    { category_name: 'Home & Garden', category_type: 'Expense' },
    { category_name: 'Insurance', category_type: 'Expense' },
    { category_name: 'Taxes', category_type: 'Expense' },
    { category_name: 'Miscellaneous', category_type: 'Expense' }
  ];

  // Insert default categories for income
  const incomeCategories = [
    { category_name: 'Salary', category_type: 'Income' },
    { category_name: 'Freelance', category_type: 'Income' },
    { category_name: 'Investment', category_type: 'Income' },
    { category_name: 'Business', category_type: 'Income' },
    { category_name: 'Rental', category_type: 'Income' },
    { category_name: 'Gift', category_type: 'Income' },
    { category_name: 'Other Income', category_type: 'Income' }
  ];

  // Insert some common securities
  const securities = [
    { ticker_symbol: 'RELIANCE.NS', security_name: 'Reliance Industries Limited', asset_type: 'Stock' },
    { ticker_symbol: 'TCS.NS', security_name: 'Tata Consultancy Services Limited', asset_type: 'Stock' },
    { ticker_symbol: 'HDFCBANK.NS', security_name: 'HDFC Bank Limited', asset_type: 'Stock' },
    { ticker_symbol: 'INFY.NS', security_name: 'Infosys Limited', asset_type: 'Stock' },
    { ticker_symbol: 'HINDUNILVR.NS', security_name: 'Hindustan Unilever Limited', asset_type: 'Stock' },
    { ticker_symbol: 'ICICIBANK.NS', security_name: 'ICICI Bank Limited', asset_type: 'Stock' },
    { ticker_symbol: 'KOTAKBANK.NS', security_name: 'Kotak Mahindra Bank Limited', asset_type: 'Stock' },
    { ticker_symbol: 'BHARTIARTL.NS', security_name: 'Bharti Airtel Limited', asset_type: 'Stock' },
    { ticker_symbol: 'ITC.NS', security_name: 'ITC Limited', asset_type: 'Stock' },
    { ticker_symbol: 'SBIN.NS', security_name: 'State Bank of India', asset_type: 'Stock' }
  ];

  // Note: In a real application, categories would be associated with specific users
  // For demo purposes, we'll create them without user_id (they can be copied when users register)
  await knex('categories').insert([...expenseCategories, ...incomeCategories]);
  await knex('securities').insert(securities);
};