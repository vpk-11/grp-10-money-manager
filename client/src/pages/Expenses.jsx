import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Expenses = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    account: '',
    startDate: '',
    endDate: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Always correct today in your local timezone
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    categoryId: '',
    accountId: '',
    date: today,
    tags: '',
    location: '',
    paymentMethod: 'cash'
  });

  const queryClient = useQueryClient();

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => api.get('/expenses', { params: filters }).then(res => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get('/expense-categories').then(res => res.data),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(res => res.data),
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingExpense) {
        return api.put(`/expenses/${editingExpense._id}`, data);
      }
      return api.post('/expenses', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['budgets']);
      toast.success(editingExpense ? 'Expense updated!' : 'Expense created!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['dashboard']);
      queryClient.invalidateQueries(['budgets']);
      toast.success('Expense deleted!');
    }
  });

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        amount: expense.amount,
        description: expense.description,
        categoryId: expense.categoryId?._id || '',
        accountId: expense.accountId?._id || '',
        date: expense.date ? new Date(expense.date).toLocaleDateString('en-CA') : today,
        tags: expense.tags?.join(', ') || '',
        location: expense.location || '',
        paymentMethod: expense.paymentMethod || 'cash'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      amount: '',
      description: '',
      categoryId: '',
      accountId: '',
      date: today,
      tags: '',
      location: '',
      paymentMethod: 'cash'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.accountId) {
      toast.error('Please select Category and Account');
      return;
    }

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    };

    saveMutation.mutate(payload);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">
            Expenses
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track and manage your spending</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-danger flex items-center justify-center w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </button>
      </div>

      <div className="card bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10 text-sm"
                placeholder="Search expenses..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input text-sm"
            >
              <option value="">All Categories</option>
              {categories?.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
            <select
              value={filters.account}
              onChange={(e) => handleFilterChange('account', e.target.value)}
              className="input text-sm"
            >
              <option value="">All Accounts</option>
              {accounts?.map(acc => (
                <option key={acc._id} value={acc._id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input flex-1"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {expensesData?.expenses?.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{expense.description}</div>
                    {expense.tags?.length > 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{expense.tags.join(', ')}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: expense.categoryId?.color }}></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{expense.categoryId?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{expense.accountId?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">
                    -{formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleOpenModal(expense)} className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3 transition-colors">
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(expense._id)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {expensesData?.expenses?.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No expenses found</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="input" placeholder="0.00" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                    <select required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="input">
                      <option value="">Select Category</option>
                      {categories?.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account <span className="text-red-500">*</span></label>
                    <select required value={formData.accountId} onChange={e => setFormData({ ...formData, accountId: e.target.value })} className="input">
                      <option value="">Select Account</option>
                      {accounts?.map(acc => (
                        <option key={acc._id} value={acc._id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="input" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })} className="input">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="digital_wallet">Digital Wallet</option>
                      <option value="check">Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="input" placeholder="Store name, city, etc." />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="input" placeholder="What did you spend on?" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} className="input" placeholder="groceries, food, lunch" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
                    {saveMutation.isPending ? 'Saving...' : editingExpense ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;