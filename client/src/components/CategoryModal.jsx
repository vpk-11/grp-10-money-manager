import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { X } from 'lucide-react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const CategoryModal = ({ isOpen, onClose, category, type = 'expense' }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Create mutation
  const createMutation = useMutation(
    (data) => api.post(`/${type}-categories`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(`${type}-categories`);
        toast.success('Category created successfully');
        onClose();
        reset();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create category');
      }
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    (data) => api.put(`/${type}-categories/${category?._id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(`${type}-categories`);
        toast.success('Category updated successfully');
        onClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update category');
      }
    }
  );

  // Reset form when category changes or modal opens
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon
      });
    } else {
      reset({
        name: '',
        description: '',
        color: type === 'expense' ? '#EF4444' : '#10B981',
        icon: type === 'expense' ? 'shopping-cart' : 'dollar-sign'
      });
    }
  }, [category, type, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (category) {
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
                  {category ? `Edit ${type} Category` : `Add New ${type} Category`}
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
                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category Name
                  </label>
                  <input
                    {...register('name', {
                      required: 'Category name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' },
                      maxLength: { value: 30, message: 'Name must be less than 30 characters' }
                    })}
                    type="text"
                    className="input mt-1"
                    placeholder={`e.g., ${type === 'expense' ? 'Groceries' : 'Salary'}`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description', {
                      maxLength: { value: 100, message: 'Description must be less than 100 characters' }
                    })}
                    rows="2"
                    className="input mt-1"
                    placeholder="Optional description"
                  ></textarea>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Color picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <div className="mt-1 flex items-center space-x-3">
                      <input
                        {...register('color', { required: 'Color is required' })}
                        type="color"
                        className="h-10 w-20 rounded border border-gray-300"
                      />
                      <span className="text-sm text-gray-500">
                        Choose a color to identify this category
                      </span>
                    </div>
                    {errors.color && (
                      <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
                    )}
                  </div>

                  {/* Icon selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Icon
                    </label>
                    <label className="block text-sm font-medium text-gray-700">Icon</label>
                    <select {...register('icon')} className="input mt-1">
                      <option value="shopping-cart">Shopping Cart</option>
                      <option value="coffee">Coffee</option>
                      <option value="home">Home</option>
                      <option value="car">Car</option>
                      <option value="heart">Health</option>
                      <option value="dollar-sign">Dollar Sign</option>
                      <option value="briefcase">Briefcase</option>
                      <option value="gift">Gift</option>
                    </select>
                  </div>
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
                {isSubmitting ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
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

export default CategoryModal;