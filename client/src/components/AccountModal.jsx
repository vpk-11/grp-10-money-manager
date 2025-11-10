import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { X } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const AccountModal = ({ isOpen, onClose, account }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Create mutation
  const createMutation = useMutation(
    (data) => api.post('/accounts', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
        toast.success('Account created successfully');
        onClose();
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create account');
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (data) => api.put(`/accounts/${account?._id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('accounts');
        toast.success('Account updated successfully');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update account');
      }
    }
  );

  // Reset form when account changes or modal opens
  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        balance: account.balance,
        currency: account.currency,
        description: account.description,
        color: account.color,
        icon: account.icon
      });
    } else {
      reset({
        name: '',
        type: 'checking',
        balance: 0,
        currency: 'USD',
        description: '',
        color: '#3B82F6',
        icon: 'wallet'
      });
    }
  }, [account, reset, isOpen]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (account) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              {/* Modal header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {account ? 'Edit Account' : 'Add New Account'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {/* Account Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Name *
                  </label>
                  <input
                    {...register('name', { 
                      required: 'Account name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 50, message: 'Name must be less than 50 characters' }
                    })}
                    type="text"
                    className="input mt-1"
                    placeholder="e.g., Main Checking Account"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Type *
                  </label>
                  <select
                    {...register('type', { required: 'Account type is required' })}
                    className="input mt-1"
                  >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit Card</option>
                    <option value="cash">Cash</option>
                    <option value="investment">Investment</option>
                  </select>
                  {errors.type && (
                    <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                {/* Balance and Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Initial Balance *
                    </label>
                    <input
                      {...register('balance', { 
                        required: 'Balance is required',
                        valueAsNumber: true,
                        validate: value => !isNaN(value) || 'Must be a number'
                      })}
                      type="number"
                      step="0.01"
                      className="input mt-1"
                      placeholder="0.00"
                    />
                    {errors.balance && (
                      <p className="mt-1 text-sm text-red-600">{errors.balance.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <select
                      {...register('currency')}
                      className="input mt-1"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                      <option value="JPY">JPY</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description', {
                      maxLength: { value: 200, message: 'Description must be less than 200 characters' }
                    })}
                    rows="3"
                    className="input mt-1"
                    placeholder="Optional description for this account"
                  ></textarea>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <div className="mt-1 flex items-center space-x-3">
                    <input
                      {...register('color')}
                      type="color"
                      className="h-10 w-20 rounded border border-gray-300"
                    />
                    <span className="text-sm text-gray-500">
                      Choose a color to identify this account
                    </span>
                  </div>
                </div>

                {/* Icon selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Icon
                  </label>
                  <select
                    {...register('icon')}
                    className="input mt-1"
                  >
                    <option value="wallet">Wallet</option>
                    <option value="credit-card">Credit Card</option>
                    <option value="piggy-bank">Piggy Bank</option>
                    <option value="bank">Bank</option>
                    <option value="dollar-sign">Dollar Sign</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full sm:w-auto sm:ml-3"
              >
                {isSubmitting ? 'Saving...' : (account ? 'Update Account' : 'Create Account')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;