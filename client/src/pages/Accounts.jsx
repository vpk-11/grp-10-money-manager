import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Wallet, X } from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Accounts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: '', balance: '', description: '', color: '#34d399' });

  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts').then(res => res.data),
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to load accounts');
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingAccount
        ? api.put(`/accounts/${editingAccount._id}`, data)
        : api.post('/accounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(editingAccount ? 'Account updated!' : 'Account created!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save account');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (id) => api.delete(`/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    },
  });

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance,
      description: account.description || '',
      color: account.color || '#34d399',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteAccountMutation.mutate(id);
    }
  };

  const handleOpenModal = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: '', balance: '', description: '', color: '#34d399' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    setFormData({ name: '', type: '', balance: '', description: '', color: '#34d399' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate({ ...formData, balance: parseFloat(formData.balance) || 0 });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Accounts</h1>
        <button
          onClick={handleOpenModal}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((account) => (
          <div key={account._id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: account.color + '20' }}
                >
                  <Wallet className="h-6 w-6" style={{ color: account.color }} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{account.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.type}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(account)}
                  className="p-2 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(account._id)}
                  className="p-2 text-gray-400 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(account.balance, account.currency)}
              </p>
              {account.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{account.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {accounts?.length === 0 && (
        <div className="text-center py-12">
          <Wallet className="h-12 w-12 text-gray-400 dark:text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No accounts yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first account.</p>
          <button
            onClick={handleOpenModal}
            className="btn btn-primary"
          >
            Add Account
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {editingAccount ? 'Edit Account' : 'Add New Account'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Type</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  >
                    <option value="">Select Type</option>
                    <option value="savings">Savings</option>
                    <option value="checking">Checking</option>
                    <option value="credit">Credit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
                    {saveMutation.isPending ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
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

export default Accounts;
