import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService, accountService, categoryService } from '../lib/services';
import { formatCurrency, formatDate, getTransactionTypeColor, groupTransactionsByDate } from '../lib/utils';
import { 
  Plus, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Edit,
  Trash2,
  Calendar
} from 'lucide-react';

interface TransactionFilters {
  search: string;
  account_id: string;
  category_id: string;
  transaction_type: string;
  start_date: string;
  end_date: string;
}

const Transactions = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    account_id: '',
    category_id: '',
    transaction_type: '',
    start_date: '',
    end_date: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', filters, currentPage],
    queryFn: () => transactionService.getAll({ 
      ...filters, 
      page: currentPage, 
      limit: 20 
    }),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAll,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: transactionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleDeleteTransaction = (transactionId: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransactionMutation.mutate(transactionId);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions?.transactions || []);

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track all your income and expenses
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="btn-secondary"
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transfer
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-8 card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label htmlFor="search-transactions" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="search-transactions"
                name="search"
                type="text"
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="input pl-10"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="filter-account" className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <select
              id="filter-account"
              name="account_id"
              value={filters.account_id || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, account_id: e.target.value }))}
              className="input"
            >
              <option value="">All Accounts</option>
              {accounts?.map((account: any) => (
                <option key={account.account_id} value={account.account_id}>
                  {account.account_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="filter-category"
              name="category_id"
              value={filters.category_id}
              onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value }))}
              className="input"
            >
              <option value="">All categories</option>
              {categories?.map((category: any) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="filter-type"
              name="transaction_type"
              value={filters.transaction_type}
              onChange={(e) => setFilters(prev => ({ ...prev, transaction_type: e.target.value }))}
              className="input"
            >
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
            </select>
          </div>

          <div>
            <label htmlFor="filter-start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="filter-start-date"
              name="start_date"
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label htmlFor="filter-end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="filter-end-date"
              name="end_date"
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="mt-8 space-y-6">
        {groupedTransactions.map((group) => (
          <div key={group.date}>
            <div className="flex items-center mb-4">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <h3 className="text-sm font-medium text-gray-900">
                {formatDate(group.date)}
              </h3>
              <div className="ml-auto text-sm text-gray-500">
                {group.transactions.length} transactions
              </div>
            </div>
            
            <div className="space-y-2">
              {group.transactions.map((transaction: any) => (
                <div key={transaction.transaction_id} className="card p-4">
                  <div className="flex items-center justify-between">
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
                      
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.description || `${transaction.transaction_type} - ${transaction.account_name}`}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 space-x-2">
                          <span>{transaction.account_name}</span>
                          {transaction.category_name && (
                            <>
                              <span>•</span>
                              <span>{transaction.category_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`text-lg font-semibold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'EXPENSE' ? '-' : '+'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingTransaction(transaction)}
                          className="p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(transaction.transaction_id)}
                          className="p-1 text-gray-400 hover:text-danger-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {transactions?.pagination && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700">
              Page {currentPage} of {transactions.pagination.pages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= transactions.pagination.pages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddModal && (
        <TransactionModal
          accounts={accounts}
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
          }}
        />
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          accounts={accounts}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            setShowTransferModal(false);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
          }}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          transaction={editingTransaction}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => {
            setEditingTransaction(null);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
          }}
        />
      )}
    </div>
  );
};

// Transaction Modal Component
const TransactionModal = ({ 
  transaction, 
  accounts, 
  categories, 
  onClose, 
  onSuccess 
}: any) => {
  const [formData, setFormData] = useState({
    account_id: transaction?.account_id || '',
    category_id: transaction?.category_id || '',
    amount: transaction?.amount || '',
    transaction_type: transaction?.transaction_type || 'EXPENSE',
    description: transaction?.description || '',
    transaction_date: transaction?.transaction_date?.split('T')[0] || new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<any>({});

  const mutation = useMutation({
    mutationFn: transaction 
      ? (data: any) => transactionService.update(transaction.transaction_id, data)
      : transactionService.create,
    onSuccess,
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Operation failed' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.account_id) newErrors.account_id = 'Account is required';
    if (!formData.amount || parseFloat(formData.amount.toString()) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount.toString()),
    });
  };

  const filteredCategories = categories?.filter((cat: any) => 
    cat.category_type === (formData.transaction_type === 'INCOME' ? 'Income' : 'Expense')
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  transaction_type: e.target.value,
                  category_id: '' // Reset category when type changes
                }))}
                className="input"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account
              </label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                className={`input ${errors.account_id ? 'border-danger-500' : ''}`}
              >
                <option value="">Select account</option>
                {accounts?.map((account: any) => (
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
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="input"
              >
                <option value="">Select category</option>
                {filteredCategories?.map((category: any) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className={`input ${errors.amount ? 'border-danger-500' : ''}`}
                placeholder="₹0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-danger-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                placeholder="Enter description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                className="input"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary"
              >
                {mutation.isPending ? 'Saving...' : (transaction ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Transfer Modal Component
const TransferModal = ({ accounts, onClose, onSuccess }: any) => {
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    description: 'Account Transfer',
  });
  const [errors, setErrors] = useState<any>({});

  const mutation = useMutation({
    mutationFn: transactionService.createTransfer,
    onSuccess,
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Transfer failed' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.from_account_id) newErrors.from_account_id = 'From account is required';
    if (!formData.to_account_id) newErrors.to_account_id = 'To account is required';
    if (formData.from_account_id === formData.to_account_id) {
      newErrors.to_account_id = 'Cannot transfer to the same account';
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    mutation.mutate({
      from_account_id: parseInt(formData.from_account_id),
      to_account_id: parseInt(formData.to_account_id),
      amount: parseFloat(formData.amount),
      description: formData.description,
      transfer_date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Transfer Between Accounts
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Account
              </label>
              <select
                value={formData.from_account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, from_account_id: e.target.value }))}
                className={`input ${errors.from_account_id ? 'border-danger-500' : ''}`}
              >
                <option value="">Select account</option>
                {accounts?.map((account: any) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.account_name} ({formatCurrency(account.current_balance)})
                  </option>
                ))}
              </select>
              {errors.from_account_id && (
                <p className="mt-1 text-sm text-danger-600">{errors.from_account_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Account
              </label>
              <select
                value={formData.to_account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, to_account_id: e.target.value }))}
                className={`input ${errors.to_account_id ? 'border-danger-500' : ''}`}
              >
                <option value="">Select account</option>
                {accounts?.filter((account: any) => account.account_id !== formData.from_account_id)
                  .map((account: any) => (
                  <option key={account.account_id} value={account.account_id}>
                    {account.account_name} ({formatCurrency(account.current_balance)})
                  </option>
                ))}
              </select>
              {errors.to_account_id && (
                <p className="mt-1 text-sm text-danger-600">{errors.to_account_id}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className={`input ${errors.amount ? 'border-danger-500' : ''}`}
                placeholder="₹0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-danger-600">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                placeholder="Enter description"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary"
              >
                {mutation.isPending ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Transactions;