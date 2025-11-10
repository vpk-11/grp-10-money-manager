import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

const AccountModal = ({ isOpen, onClose, account }) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      type: 'checking',
      currency: 'USD',
      balance: 0,
      color: '#6366F1',
      description: '',
    },
  });

  // Reset form when opening for edit or create
  useEffect(() => {
    if (account) {
      reset(account);
    } else {
      reset({
        name: '',
        type: 'checking',
        currency: 'USD',
        balance: 0,
        color: '#6366F1',
        description: '',
      });
    }
  }, [account, reset, isOpen]);

  // ✅ Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/accounts', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account created successfully!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create account');
    },
  });

  // ✅ Update account mutation
  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/accounts/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account updated successfully!');
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update account');
    },
  });

  const onSubmit = (formData) => {
    if (account) {
      updateAccountMutation.mutate({ id: account._id, data: formData });
    } else {
      createAccountMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-gray-900">
          {account ? 'Edit Account' : 'Add New Account'}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Name</label>
            <input
              type="text"
              {...register('name', { required: 'Account name is required' })}
              className="mt-1 block w-full border rounded-md p-2"
              placeholder="e.g., HDFC Savings"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Account Type</label>
            <select
              {...register('type', { required: true })}
              className="mt-1 block w-full border rounded-md p-2"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
              <option value="credit">Credit</option>
              <option value="cash">Cash</option>
              <option value="investment">Investment</option>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              {...register('currency', { required: true })}
              className="mt-1 block w-full border rounded-md p-2"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Yen</option>
              <option value="INR">INR - Indian Rupee</option>
            </select>
          </div>

          {/* Balance */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
            <input
              type="number"
              step="0.01"
              {...register('balance', { required: true })}
              className="mt-1 block w-full border rounded-md p-2"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Color</label>
            <input
              type="color"
              {...register('color')}
              className="mt-1 h-10 w-16 border rounded-md p-1 cursor-pointer"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              {...register('description')}
              rows="2"
              placeholder="Optional description..."
              className="mt-1 block w-full border rounded-md p-2"
            ></textarea>
          </div>

          {/* Submit button */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createAccountMutation.isPending || updateAccountMutation.isPending
              }
              className="btn btn-primary px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {createAccountMutation.isPending || updateAccountMutation.isPending
                ? 'Saving...'
                : account
                ? 'Update'
                : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountModal;
