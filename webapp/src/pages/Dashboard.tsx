import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../lib/services';
import { formatCurrency, formatDate, getTransactionTypeColor, getAccountTypeColor } from '../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  DollarSign, 
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Dashboard = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getSummary,
  });

  if (isLoading) {
    return (
      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Failed to load dashboard data. Please try again.
        </div>
      </div>
    );
  }

  const {
    net_worth,
    total_cash,
    total_investments,
    total_liabilities,
    account_balances,
    investment_summary,
    recent_transactions,
    monthly_trends,
    top_categories
  } = dashboardData || {};

  const stats = [
    {
      name: 'Net Worth',
      value: formatCurrency(net_worth || 0),
      icon: DollarSign,
      color: net_worth >= 0 ? 'text-success-600' : 'text-danger-600',
      bgColor: net_worth >= 0 ? 'bg-success-100' : 'bg-danger-100',
    },
    {
      name: 'Total Cash',
      value: formatCurrency(total_cash || 0),
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Investments',
      value: formatCurrency(total_investments || 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Liabilities',
      value: formatCurrency(total_liabilities || 0),
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const currentMonth = monthly_trends?.[monthly_trends.length - 1];
  const previousMonth = monthly_trends?.[monthly_trends.length - 2];
  const monthlyChange = currentMonth && previousMonth ? 
    currentMonth.net - previousMonth.net : 0;

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of your financial health and recent activity
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className={`text-2xl font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Balances */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Account Balances</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {account_balances?.map((account: any) => (
                  <div key={account.account_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getAccountTypeColor(account.account_type)}`}>
                        {account.account_type}
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {account.account_name}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      account.current_balance >= 0 ? 'text-gray-900' : 'text-danger-600'
                    }`}>
                      {formatCurrency(account.current_balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Performance */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">This Month</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Income</span>
                  <span className="text-sm font-semibold text-success-600">
                    {formatCurrency(currentMonth?.income || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Expenses</span>
                  <span className="text-sm font-semibold text-danger-600">
                    {formatCurrency(currentMonth?.expense || 0)}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Net</span>
                    <div className="flex items-center">
                      {monthlyChange > 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-success-500 mr-1" />
                      ) : monthlyChange < 0 ? (
                        <ArrowDownRight className="h-4 w-4 text-danger-500 mr-1" />
                      ) : null}
                      <span className={`text-sm font-semibold ${
                        (currentMonth?.net || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {formatCurrency(currentMonth?.net || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Transactions</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {recent_transactions?.slice(0, 5).map((transaction: any) => (
                <div key={transaction.transaction_id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'INCOME' ? 'bg-success-100' : 'bg-danger-100'
                    }`}>
                      {transaction.transaction_type === 'INCOME' ? (
                        <ArrowUpRight className="h-4 w-4 text-success-600" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-danger-600" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.account_name} • {formatDate(transaction.transaction_date)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                    {transaction.transaction_type === 'EXPENSE' ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Spending Categories</h3>
            <p className="text-sm text-gray-500">This month</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {top_categories?.map((category: any) => (
                <div key={category.category_id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-gray-100">
                      <PieChart className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {category.category_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.transaction_count} transactions
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(category.total_amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Investment Summary */}
      {investment_summary && investment_summary.holdings_count > 0 && (
        <div className="mt-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Investment Portfolio</h3>
            </div>
            <div className="card-content">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Portfolio Value</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(investment_summary.total_value)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Invested</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(investment_summary.total_invested)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Unrealized P&L</p>
                  <p className={`text-2xl font-semibold ${
                    investment_summary.total_unrealized_pl >= 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {formatCurrency(investment_summary.total_unrealized_pl)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Holdings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {investment_summary.holdings_count}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;