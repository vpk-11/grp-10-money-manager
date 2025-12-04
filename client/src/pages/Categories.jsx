import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2 } from 'lucide-react'; // Removed 'Tag' as we'll use FA
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import Font Awesome
import {
    faShoppingCart, faCoffee, faHome, faCar,
    faHeart, faDollarSign, faBriefcase, faGift
} from '@fortawesome/free-solid-svg-icons'; // Import FA icons
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import CategoryModal from '../components/CategoryModal';
import toast from 'react-hot-toast';

// 1. Define the icons map (copied from CategoryModal)
const iconsMap = {
    "shopping-cart": faShoppingCart,
    "coffee": faCoffee,
    "home": faHome,
    "car": faCar,
    "heart": faHeart,
    "dollar-sign": faDollarSign,
    "briefcase": faBriefcase,
    "gift": faGift
};

const Categories = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('expense');
    const queryClient = useQueryClient();

    const { data: expenseCategories = [], isLoading: expenseLoading } = useQuery({
        queryKey: ['expense-categories'],
        queryFn: () => api.get('/expense-categories').then(res => res.data),
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to load expense categories');
        },
    });

    const { data: incomeCategories = [], isLoading: incomeLoading } = useQuery({
        queryKey: ['income-categories'],
        queryFn: () => api.get('/income-categories').then(res => res.data),
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to load income categories');
        },
    });

    const deleteExpenseCategoryMutation = useMutation({
        mutationFn: (id) => api.delete(`/expense-categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });

    const deleteIncomeCategoryMutation = useMutation({
        mutationFn: (id) => api.delete(`/income-categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['income-categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });

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

    const isLoading = expenseLoading || incomeLoading;

    if (isLoading) return <LoadingSpinner />;

    const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
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

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentCategories?.map((category) => (
                    <div key={category._id} className="card hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div 
                                    className="p-3 rounded-lg flex items-center justify-center" // Added flex classes for centering
                                    style={{ backgroundColor: category.color + '20' }}
                                >
                                    {/* 2. Replace <Tag> with dynamic FontAwesomeIcon */}
                                    <FontAwesomeIcon 
                                        icon={iconsMap[category.icon]} 
                                        className="h-6 w-6" 
                                        style={{ color: category.color }} 
                                    />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-500">{category.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEdit(category, activeTab)}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(category._id, activeTab)}
                                    className="p-2 text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {currentCategories?.length === 0 && (
                <div className="text-center py-12">
                    {/* Use a default FontAwesomeIcon here, since the Tag icon was removed */}
                    <FontAwesomeIcon icon={faShoppingCart} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No {activeTab} categories yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Get started by creating your first {activeTab} category.
                    </p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary"
                    >
                        Add Category
                    </button>
                </div>
            )}

            <CategoryModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                category={editingCategory}
                type={activeTab}
            />
        </div>
    );
};

export default Categories;