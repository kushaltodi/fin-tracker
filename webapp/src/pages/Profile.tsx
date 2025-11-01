import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../lib/services';
import { formatCurrency, getInitials } from '../lib/utils';
import { 
  User, 
  Mail, 
  Calendar,
  Edit,
  Save,
  X,
  Wallet,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [errors, setErrors] = useState<any>({});
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userService.getProfile,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: userService.getStats,
  });

  const updateProfileMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
      setErrors({});
    },
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Update failed' });
    },
  });

  const handleEditClick = () => {
    setFormData({
      username: profile?.username || '',
      email: profile?.email || '',
    });
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ username: '', email: '' });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  if (profileLoading) {
    return (
      <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-8"></div>
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your account information and view your statistics
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h3 className="card-title">Personal Information</h3>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="btn-secondary btn-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </button>
                )}
              </div>
            </div>
            <div className="card-content">
              {!isEditing ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-xl font-medium text-white">
                        {getInitials(profile?.username || 'User')}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-medium text-gray-900">
                        {profile?.username}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Member since {new Date(profile?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Username</p>
                        <p className="text-sm text-gray-500">{profile?.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Mail className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-500">{profile?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Joined</p>
                        <p className="text-sm text-gray-500">
                          {new Date(profile?.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errors.submit && (
                    <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                      {errors.submit}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className={`input ${errors.username ? 'border-danger-500' : ''}`}
                      placeholder="Enter your username"
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-danger-600">{errors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`input ${errors.email ? 'border-danger-500' : ''}`}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-danger-600">{errors.email}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="btn-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Account Statistics</h3>
            </div>
            <div className="card-content">
              {statsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Accounts</span>
                    </div>
                    <span className="text-sm font-semibold">{stats?.accounts_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Transactions</span>
                    </div>
                    <span className="text-sm font-semibold">{stats?.transactions_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <PieChart className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Categories</span>
                    </div>
                    <span className="text-sm font-semibold">{stats?.categories_count || 0}</span>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Income</span>
                      <span className="text-sm font-semibold text-success-600">
                        {formatCurrency(stats?.total_income || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Expenses</span>
                      <span className="text-sm font-semibold text-danger-600">
                        {formatCurrency(stats?.total_expense || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium text-gray-900">Net Worth</span>
                      <span className={`text-sm font-bold ${
                        (stats?.net_worth || 0) >= 0 ? 'text-success-600' : 'text-danger-600'
                      }`}>
                        {formatCurrency(stats?.net_worth || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-content">
              <div className="space-y-3">
                <a href="/accounts" className="block w-full btn-secondary text-left">
                  <Wallet className="h-4 w-4 mr-2 inline" />
                  Manage Accounts
                </a>
                <a href="/transactions" className="block w-full btn-secondary text-left">
                  <Activity className="h-4 w-4 mr-2 inline" />
                  View Transactions
                </a>
                <a href="/portfolio" className="block w-full btn-secondary text-left">
                  <TrendingUp className="h-4 w-4 mr-2 inline" />
                  Portfolio
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;