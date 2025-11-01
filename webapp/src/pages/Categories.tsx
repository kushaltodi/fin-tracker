import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../lib/services';
import { formatCurrency, getCategoryTypeColor } from '../lib/utils';
import { 
  Plus, 
  Edit, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  PieChart
} from 'lucide-react';

const Categories = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAll,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });

  const handleDeleteCategory = (categoryId: number) => {
    if (window.confirm('Are you sure you want to delete this category? This will not delete associated transactions.')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const incomeCategories = categories?.filter((cat: any) => cat.category_type === 'Income') || [];
  const expenseCategories = categories?.filter((cat: any) => cat.category_type === 'Expense') || [];

  return (
    <div className="h-full w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
          <p className="mt-2 text-sm text-gray-700">
            Organize your transactions with custom categories
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 rounded-lg bg-success-100">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Income Categories</p>
              <p className="text-2xl font-semibold text-gray-900">{incomeCategories.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 rounded-lg bg-danger-100">
              <TrendingDown className="h-6 w-6 text-danger-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Expense Categories</p>
              <p className="text-2xl font-semibold text-gray-900">{expenseCategories.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 rounded-lg bg-primary-100">
              <PieChart className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Categories</p>
              <p className="text-2xl font-semibold text-gray-900">{categories?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income Categories */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Income Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map((category: any) => (
            <CategoryCard 
              key={category.category_id} 
              category={category} 
              onEdit={setEditingCategory}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      </div>

      {/* Expense Categories */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map((category: any) => (
            <CategoryCard 
              key={category.category_id} 
              category={category} 
              onEdit={setEditingCategory}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <CategoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
        />
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
        />
      )}
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ 
  category, 
  onEdit, 
  onDelete 
}: { 
  category: any; 
  onEdit: (category: any) => void; 
  onDelete: (id: number) => void; 
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await categoryService.getStats(category.category_id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load category stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryTypeColor(category.category_type)}`}>
            {category.category_type}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-gray-400 hover:text-gray-500"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(category.category_id)}
            className="p-1 text-gray-400 hover:text-danger-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {category.category_name}
      </h3>
      
      {category.description && (
        <p className="text-sm text-gray-500 mb-3">
          {category.description}
        </p>
      )}

      {!stats && !loadingStats && (
        <button
          onClick={loadStats}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          View statistics →
        </button>
      )}

      {loadingStats && (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      )}

      {stats && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total spent:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(stats.total_spent)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Transactions:</span>
            <span className="font-medium text-gray-900">
              {stats.transaction_count}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Average:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(stats.average_amount)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Category Modal Component
const CategoryModal = ({ 
  category, 
  onClose, 
  onSuccess 
}: { 
  category?: any; 
  onClose: () => void; 
  onSuccess: () => void; 
}) => {
  const [formData, setFormData] = useState({
    category_name: category?.category_name || '',
    category_type: category?.category_type || 'Expense',
    description: category?.description || '',
  });
  const [errors, setErrors] = useState<any>({});

  const mutation = useMutation({
    mutationFn: category 
      ? (data: any) => categoryService.update(category.category_id, data)
      : categoryService.create,
    onSuccess,
    onError: (error: any) => {
      setErrors({ submit: error.response?.data?.message || 'Operation failed' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    if (!formData.category_name.trim()) {
      newErrors.category_name = 'Category name is required';
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
            {category ? 'Edit Category' : 'Add New Category'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.submit && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category Name
              </label>
              <input
                type="text"
                value={formData.category_name}
                onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
                className={`input ${errors.category_name ? 'border-danger-500' : ''}`}
                placeholder="Enter category name"
              />
              {errors.category_name && (
                <p className="mt-1 text-sm text-danger-600">{errors.category_name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category Type
              </label>
              <select
                value={formData.category_type}
                onChange={(e) => setFormData(prev => ({ ...prev, category_type: e.target.value }))}
                className="input"
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input"
                rows={3}
                placeholder="Enter description (optional)"
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
                {mutation.isPending ? 'Saving...' : (category ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Categories;