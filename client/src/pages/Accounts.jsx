import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';
import AccountModal from '../components/AccountModal';
import toast from 'react-hot-toast';

const Accounts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const queryClient = useQueryClient();

  // ✅ useQuery (React Query v5 syntax)
  const {
    data: accounts,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await api.get('/accounts');
      return res.data;
    },
    retry: false,
  });

  // ✅ Delete mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/accounts/${id}`);
    },
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
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this account? This action cannot be undone.'
      )
    ) {
      deleteAccountMutation.mutate(id);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) {
    console.error(error);
    return (
      <div className="text-center py-10 text-red-500">
        Failed to load accounts.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your financial accounts
          </p>
        </div>
        <button onClick={handleAddAccount} className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </button>
      </div>

      {/* ✅ Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts && accounts.length > 0 ? (
          accounts.map((account) => (
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
                    <h3 className="text-lg font-semibold text-gray-900">
                      {account.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                  </div>
                </div>

                {/* ✅ Edit/Delete buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="Edit account"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account._id)}
                    className="p-2 text-gray-400 hover:text-red-600"
                    title="Delete account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ✅ Balance display */}
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account.balance, account.currency)}
                </p>
                {account.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {account.description}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="text-center py-12 card">
              <Wallet className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first account.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddAccount}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ AccountModal */}
      <AccountModal isOpen={isModalOpen} onClose={handleModalClose} account={editingAccount} />
    </div>
  );
};

export default Accounts;
