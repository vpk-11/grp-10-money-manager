import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryModal from '../components/CategoryModal';
import toast from 'react-hot-toast';

const Categories = () => {
  const [activeTab, setActiveTab] = useState('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const queryClient = useQueryClient();

  const { data: expenseCategories, isLoading: expenseLoading } = useQuery(
    'expense-categories',
    () => api.get('/expense-categories').then(res => res.data),
    { retry: false }
  );

  const { data: incomeCategories, isLoading: incomeLoading } = useQuery(
    'income-categories',
    () => api.get('/income-categories').then(res => res.data),
    { retry: false }
  );

  // Delete mutations
  const deleteExpenseCategoryMutation = useMutation(
    (id) => api.delete(`/expense-categories/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('expense-categories');
        toast.success('Category deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      }
    }
  );

  const deleteIncomeCategoryMutation = useMutation(
    (id) => api.delete(`/income-categories/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('income-categories');
        toast.success('Category deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete category');
      }
    }
  );

  const handleEdit = (category, type) => {
    setEditingCategory({ ...category, type });
    setIsModalOpen(true);
  };

  const handleDelete = (id, type) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      if (type === 'expense') {
        deleteExpenseCategoryMutation.mutate(id);
      } else {
        deleteIncomeCategoryMutation.mutate(id);
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const isLoading = expenseLoading || incomeLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={handleAddCategory}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('expense')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'expense'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Expense Categories
          </button>
          <button
            onClick={() => setActiveTab('income')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'income'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Income Categories
          </button>
        </nav>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {currentCategories && currentCategories.length > 0 ? (
          currentCategories.map((category) => (
            <div
              key={category._id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    <Tag
                      className="h-5 w-5"
                      style={{ color: category.color }}
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit/Delete buttons */}
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(category, activeTab)}
                    className="p-1.5 text-gray-400 hover:text-gray-600"
                    title="Edit category"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id, activeTab)}
                    className="p-1.5 text-gray-400 hover:text-red-600"
                    title="Delete category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="text-center py-12 card">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab} categories
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new {activeTab} category.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleAddCategory}
                  className="btn btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CategoryModal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        category={editingCategory}
        type={editingCategory?.type || activeTab}
      />
    </div>
  );
};

export default Categories;