import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency, formatDate } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const Incomes = () => {
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
  const [editingIncome, setEditingIncome] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    categoryId: '',
    accountId: '',
    date: new Date().toISOString().split('T')[0],
    source: '',
    paymentMethod: 'bank_transfer'
  });

  const queryClient = useQueryClient();

  const { data: incomesData, isLoading } = useQuery({
    queryKey: ['incomes', filters],
    queryFn: () => api.get('/incomes', { params: filters }).then(res => res.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['income-categories'],
    queryFn: () => api.get('/income-categories').then(res => res.data),
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(res => res.data),
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const saveMutation = useMutation({
    mutationFn: (data) => editingIncome ? api.put(`/incomes/${editingIncome._id}`, data) : api.post('/incomes', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(editingIncome ? 'Income updated!' : 'Income created!');
      handleCloseModal();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to save income')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/incomes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['incomes']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Income deleted!');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete income')
  });

  const handleOpenModal = (income = null) => {
    if (income) {
      setEditingIncome(income);
      setFormData({
        amount: income.amount,
        description: income.description,
        categoryId: income.categoryId?._id || '',
        accountId: income.accountId?._id || '',
        date: income.date?.split('T')[0] || new Date().toISOString().split('T')[0],
        source: income.source || '',
        paymentMethod: income.paymentMethod || 'bank_transfer'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingIncome(null);
    setFormData({
      amount: '',
      description: '',
      categoryId: '',
      accountId: '',
      date: new Date().toISOString().split('T')[0],
      source: '',
      paymentMethod: 'bank_transfer'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, amount: parseFloat(formData.amount) });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Incomes
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Track and manage your income sources</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-success flex items-center justify-center w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </button>
      </div>

      {/* Filters */}
      <div className="card bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10 text-sm dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                placeholder="Search incomes..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input text-sm dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            >
              <option value="">All Categories</option>
              {categories?.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Account</label>
            <select
              value={filters.account}
              onChange={(e) => handleFilterChange('account', e.target.value)}
              className="input text-sm dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            >
              <option value="">All Accounts</option>
              {accounts?.map(account => <option key={account._id} value={account._id}>{account.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date Range</label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="input flex-1 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="input flex-1 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Incomes Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
           <thead className="bg-gray-50 dark:bg-gray-800">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Description</th>
    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Category</th>
    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Account</th>
    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Amount</th>
    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Date</th>
    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-gray-300 uppercase tracking-wider">Actions</th>
  </tr>
</thead>

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {incomesData?.incomes?.map((income) => (
                <tr key={income._id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{income.description}</div>
                    {income.source && <div className="text-sm text-gray-500 dark:text-gray-400">From: {income.source}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: income.categoryId?.color }}></div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">{income.categoryId?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{income.accountId?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                    +{formatCurrency(income.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(income.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(income)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200 mr-3 inline-flex items-center transition-colors duration-200"
                    >
                      <Edit2 className="h-4 w-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(income._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 inline-flex items-center transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {incomesData?.incomes?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No incomes found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{editingIncome ? 'Edit Income' : 'Add New Income'}</h2>
                <button onClick={handleCloseModal} className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/** Inputs **/}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Amount <span className="text-red-500">*</span></label>
                    <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" placeholder="0.00" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Category <span className="text-red-500">*</span></label>
                    <select required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                      <option value="">Select Category</option>
                      {categories?.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Account <span className="text-red-500">*</span></label>
                    <select required value={formData.accountId} onChange={(e) => setFormData({ ...formData, accountId: e.target.value })} className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                      <option value="">Select Account</option>
                      {accounts?.map(acc => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Date <span className="text-red-500">*</span></label>
                    <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Payment Method</label>
                    <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="digital_wallet">Digital Wallet</option>
                      <option value="check">Check</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Source</label>
                    <input type="text" value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" placeholder="Company name, client, etc." />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Description <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" placeholder="Brief description of the income" />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
                    {saveMutation.isPending ? 'Saving...' : editingIncome ? 'Update' : 'Create'}
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

export default Incomes;
