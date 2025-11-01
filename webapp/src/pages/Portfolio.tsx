import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioService, accountService } from '../lib/services';
import { formatCurrency, formatDate, formatPercent } from '../lib/utils';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  PieChart,
  Activity,
  Trash2
} from 'lucide-react';

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState<'holdings' | 'trades' | 'securities'>('holdings');
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [showAddSecurityModal, setShowAddSecurityModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ['portfolio-holdings'],
    queryFn: portfolioService.getHoldings,
  });

  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ['portfolio-trades'],
    queryFn: portfolioService.getTrades,
  });

  const { data: securities } = useQuery({
    queryKey: ['portfolio-securities'],
    queryFn: portfolioService.getSecurities,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAll,
  });

  const deleteTradeumeration = useMutation({
    mutationFn: portfolioService.deleteTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-trades'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-holdings'] });
    },
  });

  const handleDeleteTrade = (tradeId: number) => {
    if (window.confirm('Are you sure you want to delete this trade?')) {
      deleteTradeumeration.mutate(tradeId);
    }
  };

  const portfolioSummary = holdings?.reduce((acc: any, holding: any) => {
    acc.totalValue += holding.current_value || holding.total_invested;
    acc.totalInvested += holding.total_invested;
    acc.totalUnrealizedPL += holding.unrealized_pl || 0;
    return acc;
  }, { totalValue: 0, totalInvested: 0, totalUnrealizedPL: 0 });

  const tabs = [
    { id: 'holdings', name: 'Holdings', icon: PieChart },
    { id: 'trades', name: 'Trades', icon: Activity },
    { id: 'securities', name: 'Securities', icon: TrendingUp },
  ];

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Investment Portfolio</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track your investments and portfolio performance
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <button
            type="button"
            onClick={() => setShowAddSecurityModal(true)}
            className="btn-secondary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Security
          </button>
          <button
            type="button"
            onClick={() => setShowAddTradeModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolioSummary && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-lg bg-primary-100">
                <DollarSign className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Portfolio Value</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(portfolioSummary.totalValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Invested</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(portfolioSummary.totalInvested)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-2 rounded-lg ${
                portfolioSummary.totalUnrealizedPL >= 0 ? 'bg-success-100' : 'bg-danger-100'
              }`}>
                {portfolioSummary.totalUnrealizedPL >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-success-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-danger-600" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unrealized P&L</p>
                <p className={`text-2xl font-semibold ${
                  portfolioSummary.totalUnrealizedPL >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {formatCurrency(portfolioSummary.totalUnrealizedPL)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 rounded-lg bg-purple-100">
                <PieChart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Holdings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {holdings?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'holdings' && (
          <HoldingsTab holdings={holdings} isLoading={holdingsLoading} />
        )}
        {activeTab === 'trades' && (
          <TradesTab trades={trades} isLoading={tradesLoading} onDeleteTrade={handleDeleteTrade} />
        )}
        {activeTab === 'securities' && (
          <SecuritiesTab securities={securities} />
        )}
      </div>

      {/* Add Trade Modal */}
      {showAddTradeModal && (
        <TradeModal
          securities={securities}
          accounts={accounts}
          onClose={() => setShowAddTradeModal(false)}
          onSuccess={() => {
            setShowAddTradeModal(false);
            queryClient.invalidateQueries({ queryKey: ['portfolio-trades'] });
            queryClient.invalidateQueries({ queryKey: ['portfolio-holdings'] });
          }}
        />
      )}

      {/* Add Security Modal */}
      {showAddSecurityModal && (
        <SecurityModal
          onClose={() => setShowAddSecurityModal(false)}
          onSuccess={() => {
            setShowAddSecurityModal(false);
            queryClient.invalidateQueries({ queryKey: ['portfolio-securities'] });
          }}
        />
      )}
    </div>
  );
};

// Holdings Tab Component
const HoldingsTab = ({ holdings, isLoading }: { holdings: any[]; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!holdings?.length) {
    return (
      <div className="text-center py-12">
        <PieChart className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No holdings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start by adding some stock trades to build your portfolio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {holdings.map((holding: any) => (
        <div key={holding.ticker_symbol} className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {holding.ticker_symbol}
                </h3>
                <p className="text-sm text-gray-500">{holding.company_name}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>{holding.total_quantity} shares</p>
                <p>Avg. cost: {formatCurrency(holding.average_cost)}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(holding.current_value || holding.total_invested)}
              </p>
              <div className="flex items-center justify-end space-x-2">
                <span className={`text-sm font-medium ${
                  (holding.unrealized_pl || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {(holding.unrealized_pl || 0) >= 0 ? '+' : ''}
                  {formatCurrency(holding.unrealized_pl || 0)}
                </span>
                <span className={`text-xs ${
                  (holding.unrealized_pl_percent || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  ({(holding.unrealized_pl_percent || 0) >= 0 ? '+' : ''}
                  {formatPercent((holding.unrealized_pl_percent || 0) / 100)})
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Trades Tab Component
const TradesTab = ({ 
  trades, 
  isLoading, 
  onDeleteTrade 
}: { 
  trades: any[]; 
  isLoading: boolean; 
  onDeleteTrade: (id: number) => void;
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!trades?.length) {
    return (
      <div className="text-center py-12">
        <Activity className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No trades</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add your first stock trade to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trades.map((trade: any) => (
        <div key={trade.trade_id} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-full ${
                trade.trade_type === 'BUY' ? 'bg-success-100' : 'bg-danger-100'
              }`}>
                {trade.trade_type === 'BUY' ? (
                  <TrendingUp className="h-4 w-4 text-success-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-danger-600" />
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    {trade.trade_type} {trade.ticker_symbol}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trade.trade_type === 'BUY' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
                  }`}>
                    {trade.trade_type}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {trade.quantity} shares @ {formatCurrency(trade.price_per_share)} • {formatDate(trade.trade_date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(trade.quantity * trade.price_per_share)}
                </p>
                {trade.fees > 0 && (
                  <p className="text-xs text-gray-500">
                    Fees: {formatCurrency(trade.fees)}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => onDeleteTrade(trade.trade_id)}
                className="p-1 text-gray-400 hover:text-danger-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Securities Tab Component
const SecuritiesTab = ({ securities }: { securities: any[] }) => {
  if (!securities?.length) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No securities</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add securities to start tracking your investments.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {securities.map((security: any) => (
        <div key={security.security_id} className="card p-4">
          <h3 className="text-lg font-medium text-gray-900">
            {security.ticker_symbol}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{security.company_name}</p>
          {security.sector && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {security.sector}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Trade Modal Component
const TradeModal = ({ securities, accounts, onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    security_id: '',
    account_id: '',
    trade_type: 'BUY',
    quantity: '',
    price_per_share: '',
    trade_date: new Date().toISOString().split('T')[0],
    fees: '',
  });
  const [errors, setErrors] = useState<any>({});

  const mutation = useMutation({
    mutationFn: portfolioService.createTrade,
    onSuccess,
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Failed to create trade' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.security_id) newErrors.security_id = 'Security is required';
    if (!formData.account_id) newErrors.account_id = 'Account is required';
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (!formData.price_per_share || parseFloat(formData.price_per_share) <= 0) {
      newErrors.price_per_share = 'Price must be greater than 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({
      account_id: parseInt(formData.account_id),
      security_id: parseInt(formData.security_id),
      trade_type: formData.trade_type as 'BUY' | 'SELL',
      quantity: parseFloat(formData.quantity),
      price_per_share: parseFloat(formData.price_per_share),
      trade_date: formData.trade_date,
      fees: parseFloat(formData.fees) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Trade</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Trade Type</label>
              <select
                value={formData.trade_type}
                onChange={(e) => setFormData(prev => ({ ...prev, trade_type: e.target.value }))}
                className="input"
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Security</label>
              <select
                value={formData.security_id}
                onChange={(e) => setFormData(prev => ({ ...prev, security_id: e.target.value }))}
                className={`input ${errors.security_id ? 'border-danger-500' : ''}`}
              >
                <option value="">Select security</option>
                {securities?.map((security: any) => (
                  <option key={security.security_id} value={security.security_id}>
                    {security.ticker_symbol} - {security.company_name}
                  </option>
                ))}
              </select>
              {errors.security_id && (
                <p className="mt-1 text-sm text-danger-600">{errors.security_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Account</label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className={`input ${errors.account_id ? 'border-danger-500' : ''}`}
              >
                <option value="">Select account</option>
                {accounts?.filter((acc: any) => ['Investment', 'Brokerage'].includes(acc.account_type))
                  .map((account: any) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.account_name}
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="mt-1 text-sm text-danger-600">{errors.account_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <input
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className={`input ${errors.quantity ? 'border-danger-500' : ''}`}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-danger-600">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price per Share</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_per_share}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_share: e.target.value }))}
                className={`input ${errors.price_per_share ? 'border-danger-500' : ''}`}
                placeholder="₹0.00"
              />
              {errors.price_per_share && (
                <p className="mt-1 text-sm text-danger-600">{errors.price_per_share}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Trade Date</label>
              <input
                type="date"
                value={formData.trade_date}
                onChange={(e) => setFormData(prev => ({ ...prev, trade_date: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fees (optional)</label>
              <input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
                className="input"
                placeholder="₹0.00"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary"
              >
                {mutation.isPending ? 'Creating...' : 'Create Trade'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Security Modal Component
const SecurityModal = ({ onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    ticker_symbol: '',
    company_name: '',
    sector: '',
  });
  const [errors, setErrors] = useState<any>({});

  const mutation = useMutation({
    mutationFn: portfolioService.createSecurity,
    onSuccess,
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Failed to create security' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.ticker_symbol.trim()) {
      newErrors.ticker_symbol = 'Ticker symbol is required';
    }
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Security</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Ticker Symbol</label>
              <input
                type="text"
                value={formData.ticker_symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, ticker_symbol: e.target.value.toUpperCase() }))}
                className={`input ${errors.ticker_symbol ? 'border-danger-500' : ''}`}
                placeholder="AAPL"
              />
              {errors.ticker_symbol && (
                <p className="mt-1 text-sm text-danger-600">{errors.ticker_symbol}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className={`input ${errors.company_name ? 'border-danger-500' : ''}`}
                placeholder="Apple Inc."
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-danger-600">{errors.company_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Sector (optional)</label>
              <input
                type="text"
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                className="input"
                placeholder="Technology"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary"
              >
                {mutation.isPending ? 'Creating...' : 'Create Security'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;