import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../lib/services';
import { formatCurrency, formatDate, getAccountTypeColor } from '../lib/utils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Accounts = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAll,
  });

  const deleteAccountMutation = useMutation({
    mutationFn: accountService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  const handleDeleteAccount = (accountId: number) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = accounts?.reduce((sum: number, account: any) => sum + account.current_balance, 0) || 0;

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your financial accounts and track balances
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="mt-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary-100">
              <Wallet className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Balance</p>
              <p className={`text-3xl font-bold ${
                totalBalance >= 0 ? 'text-gray-900' : 'text-danger-600'
              }`}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="ml-auto">
              <div className="flex items-center text-sm text-gray-500">
                <span>{accounts?.length || 0} accounts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="mt-8 space-y-4">
        {accounts?.map((account: any) => (
          <div key={account.account_id} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAccountTypeColor(account.account_type)}`}>
                    {account.account_type}
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {account.account_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Created {formatDate(account.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className={`text-xl font-semibold ${
                    account.current_balance >= 0 ? 'text-gray-900' : 'text-danger-600'
                  }`}>
                    {formatCurrency(account.current_balance)}
                  </p>
                  {account.current_balance !== account.initial_balance && (
                    <div className="flex items-center text-sm">
                      {account.current_balance > account.initial_balance ? (
                        <ArrowUpRight className="h-4 w-4 text-success-500 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-danger-500 mr-1" />
                      )}
                      <span className="text-gray-500">
                        from {formatCurrency(account.initial_balance)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingAccount(account)}
                    className="p-2 text-gray-400 hover:text-gray-500"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAccount(account.account_id)}
                    className="p-2 text-gray-400 hover:text-danger-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <AccountModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
          }}
        />
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <AccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSuccess={() => {
            setEditingAccount(null);
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
          }}
        />
      )}
    </div>
  );
};

// Account Modal Component
const AccountModal = ({ 
  account, 
  onClose, 
  onSuccess 
}: { 
  account?: any; 
  onClose: () => void; 
  onSuccess: () => void; 
}) => {
  const [formData, setFormData] = useState({
    account_name: account?.account_name || '',
    account_type: account?.account_type || 'Checking',
    initial_balance: account?.initial_balance || 0,
  });
  const [errors, setErrors] = useState<any>({});

  const mutation = useMutation({
    mutationFn: account 
      ? (data: any) => accountService.update(account.account_id, data)
      : accountService.create,
    onSuccess,
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Operation failed' });
    },
  });

  const accountTypes = [
    'Checking', 'Savings', 'Investment', 'Credit', 'Loan', 'Cash', 'Bank', 'Brokerage', 'Debt'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required';
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {account ? 'Edit Account' : 'Add New Account'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}
            
            <div>
              <label htmlFor="account-name" className="block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                id="account-name"
                name="account_name"
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                className={`input ${errors.account_name ? 'border-danger-500' : ''}`}
                placeholder="Enter account name"
              />
              {errors.account_name && (
                <p className="mt-1 text-sm text-danger-600">{errors.account_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="account-type" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="account-type"
                name="account_type"
                value={formData.account_type}
                onChange={(e) => setFormData(prev => ({ ...prev, account_type: e.target.value }))}
                className="input"
              >
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {!account && (
              <div>
                <label htmlFor="initial-balance" className="block text-sm font-medium text-gray-700">
                  Initial Balance
                </label>
                <input
                  id="initial-balance"
                  name="initial_balance"
                  type="number"
                  step="0.01"
                  value={formData.initial_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, initial_balance: parseFloat(e.target.value) || 0 }))}
                  className="input"
                  placeholder="₹0.00"
                />
              </div>
            )}

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
                {mutation.isPending ? 'Saving...' : (account ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Accounts;