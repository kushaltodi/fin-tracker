import api from './api';

// Type definitions
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface UpdateProfileData {
  username?: string;
  email?: string;
}

interface AccountData {
  account_name: string;
  account_type: string;
  initial_balance?: number;
}

interface CategoryData {
  category_name: string;
  category_type: string;
  description?: string;
}

interface TransactionData {
  account_id: number;
  category_id: number;
  amount: number;
  transaction_type: 'INCOME' | 'EXPENSE';
  description: string;
  transaction_date: string;
}

interface TransferData {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  description: string;
  transfer_date: string;
}

interface TradeData {
  account_id: number;
  security_id: number;
  trade_type: 'BUY' | 'SELL';
  quantity: number;
  price_per_share: number;
  trade_date: string;
  fees?: number;
}

interface SecurityData {
  ticker_symbol: string;
  company_name: string;
  sector: string;
}

// Auth Services
export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async register(userData: RegisterData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
};

// User Services
export const userService = {
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  async updateProfile(userData: UpdateProfileData) {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },

  async getStats() {
    const response = await api.get('/users/stats');
    return response.data;
  }
};

// Account Services
export const accountService = {
  async getAll() {
    const response = await api.get('/accounts');
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  async create(accountData: AccountData) {
    const response = await api.post('/accounts', accountData);
    return response.data;
  },

  async update(id: number, accountData: Partial<AccountData>) {
    const response = await api.put(`/accounts/${id}`, accountData);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  async getTrash() {
    const response = await api.get('/accounts/trash');
    return response.data;
  },

  async restore(id: number) {
    const response = await api.put(`/accounts/${id}/restore`);
    return response.data;
  },

  async permanentDelete(id: number) {
    const response = await api.delete(`/accounts/${id}/permanent`);
    return response.data;
  }
};

// Category Services
export const categoryService = {
  async getAll() {
    const response = await api.get('/categories');
    return response.data;
  },

  async create(categoryData: CategoryData) {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  async update(id: number, categoryData: Partial<CategoryData>) {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  async getStats(id: number) {
    const response = await api.get(`/categories/${id}/stats`);
    return response.data;
  },

  async getTrash() {
    const response = await api.get('/categories/trash');
    return response.data;
  },

  async restore(id: number) {
    const response = await api.put(`/categories/${id}/restore`);
    return response.data;
  }
};

// Transaction Services
export const transactionService = {
  async getAll(params = {}) {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  async getById(id: number) {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  async create(transactionData: TransactionData) {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  async createTransfer(transferData: TransferData) {
    const response = await api.post('/transactions/transfer', transferData);
    return response.data;
  },

  async update(id: number, transactionData: Partial<TransactionData>) {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  async delete(id: number) {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  async getTransfers() {
    const response = await api.get('/transactions/transfers');
    return response.data;
  },

  async getTrash() {
    const response = await api.get('/transactions/trash');
    return response.data;
  },

  async restore(id: number) {
    const response = await api.put(`/transactions/${id}/restore`);
    return response.data;
  }
};

// Portfolio Services
export const portfolioService = {
  async getTrades(params = {}) {
    const response = await api.get('/portfolio/trades', { params });
    return response.data;
  },

  async createTrade(tradeData: TradeData) {
    const response = await api.post('/portfolio/trades', tradeData);
    return response.data;
  },

  async updateTrade(id: number, tradeData: Partial<TradeData>) {
    const response = await api.put(`/portfolio/trades/${id}`, tradeData);
    return response.data;
  },

  async deleteTrade(id: number) {
    const response = await api.delete(`/portfolio/trades/${id}`);
    return response.data;
  },

  async getHoldings() {
    const response = await api.get('/portfolio/holdings');
    return response.data;
  },

  async getSecurities() {
    const response = await api.get('/portfolio/securities');
    return response.data;
  },

  async createSecurity(securityData: SecurityData) {
    const response = await api.post('/portfolio/securities', securityData);
    return response.data;
  }
};

// Dashboard Services
export const dashboardService = {
  async getSummary() {
    const response = await api.get('/dashboard/summary');
    return response.data;
  }
};