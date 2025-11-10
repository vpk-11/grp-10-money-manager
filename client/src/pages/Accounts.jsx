import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { api } from '../utils/api';
import { formatCurrency } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner';

const Accounts = () => {
  // React Query v5 object syntax
  const { data: accounts, isLoading, isError, error } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      try {
        const res = await api.get('/accounts');
        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error('API error:', err);
        return [];
      }
    },
    retry: false,
  });

  const handleEdit = (account) => {
    console.log('Edit account:', account);
  };

  const handleDelete = (id) => {
    console.log('Delete account:', id);
  };

  if (isLoading) return <LoadingSpinner />;

  if (isError)
    return (
      <div className="text-red-500 text-center mt-8">
        Error loading accounts: {error?.message || 'Unknown error'}
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => console.log('Add account clicked')}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(accounts) && accounts.length > 0 ? (
          accounts.map((account) => (
            <div
              key={account._id}
              className="card p-4 border rounded shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Account Info */}
                <div className="flex items-center">
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: account.color + '20' }}
                  >
                    <Wallet
                      className="h-6 w-6"
                      style={{ color: account.color }}
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                  </div>
                </div>

                {/* Edit/Delete Buttons */}
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

              {/* Balance */}
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(account.balance, account.currency)}
                </p>
                {account.description && (
                  <p className="text-sm text-gray-500 mt-1">{account.description}</p>
                )}
              </div>
            </div>
          ))
        ) : (
          // Empty State
          <div className="col-span-full">
            <div className="text-center py-12 card border rounded shadow">
              <Wallet className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first account.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => console.log('Add account clicked')}
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
    </div>
  );
};

export default Accounts;
