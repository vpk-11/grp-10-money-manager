import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Wallet } from 'lucide-react';
import { api } from '../utils/api';
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

  console.log('Accounts component rendered', accounts);

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

      {/* Accounts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(accounts) && accounts.length > 0 ? (
          accounts.map((account) => (
            <div key={account.id} className="card p-4 border rounded shadow">
              <h3 className="text-lg font-medium">{account.name}</h3>
              <p className="text-gray-500">{account.type}</p>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="text-center py-12 card border rounded shadow">
              <Wallet className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new account.
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
