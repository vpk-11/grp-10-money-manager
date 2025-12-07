import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, X } from 'lucide-react'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; 
import {
    faShoppingCart, faCoffee, faHome, faCar,
    faHeart, faDollarSign, faBriefcase, faGift
} from '@fortawesome/free-solid-svg-icons'; 
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

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
    const [formData, setFormData] = useState({ name: '', icon: '', description: '', color: '#34d399' });

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

    const deleteCategoryMutation = useMutation({
        mutationFn: (id) =>
            activeTab === 'expense'
                ? api.delete(`/expense-categories/${id}`)
                : api.delete(`/income-categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [activeTab === 'expense' ? 'expense-categories' : 'income-categories'] });
            toast.success('Category deleted successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        },
    });

    const saveCategoryMutation = useMutation({
        mutationFn: (data) =>
            editingCategory
                ? api.put(`/${activeTab}-categories/${editingCategory._id}`, data)
                : api.post(`/${activeTab}-categories`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [activeTab === 'expense' ? 'expense-categories' : 'income-categories'] });
            toast.success(editingCategory ? 'Category updated!' : 'Category created!');
            handleCloseModal();
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to save category');
        },
    });

    const handleEdit = (category, type) => {
        setEditingCategory({ ...category, type });
        setFormData({
            name: category.name,
            icon: category.icon,
            description: category.description || '',
            color: category.color || '#34d399'
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            deleteCategoryMutation.mutate(id);
        }
    };

    const handleOpenModal = () => {
        setEditingCategory(null);
        setFormData({ name: '', icon: '', description: '', color: '#34d399' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setFormData({ name: '', icon: '', description: '', color: '#34d399' });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveCategoryMutation.mutate(formData);
    };

    const isLoading = expenseLoading || incomeLoading;
    const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Categories</h1>
                <button
                    onClick={handleOpenModal}
                    className="btn btn-primary flex items-center"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('expense')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'expense'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                        }`}
                    >
                        Expense Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'income'
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                        }`}
                    >
                        Income Categories
                    </button>
                </nav>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentCategories?.map((category) => (
                    <div key={category._id} className="card hover:shadow-lg transition-shadow dark:bg-gray-700">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center">
                                <div 
                                    className="p-3 rounded-lg flex items-center justify-center" 
                                    style={{ backgroundColor: category.color + '20' }}
                                >
                                    <FontAwesomeIcon 
                                        icon={iconsMap[category.icon]} 
                                        className="h-6 w-6" 
                                        style={{ color: category.color }} 
                                    />
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                                    {category.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-300">{category.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleEdit(category, activeTab)}
                                    className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                                >
                                    <Edit className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(category._id)}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {currentCategories?.length === 0 && (
                <div className="text-center py-12 dark:text-gray-100">
                    <FontAwesomeIcon icon={faShoppingCart} className="h-12 w-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
                    <h3 className="text-lg font-medium mb-2">No {activeTab} categories yet</h3>
                    <p className="text-gray-500 mb-4 dark:text-gray-400">
                        Get started by creating your first {activeTab} category.
                    </p>
                    <button
                        onClick={handleOpenModal}
                        className="btn btn-primary"
                    >
                        Add Category
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
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                                    <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">Icon</label>
                                    <select
                                        required
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="input dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700"
                                    >
                                        <option value="">Select Icon</option>
                                        {Object.keys(iconsMap).map(key => (
                                            <option key={key} value={key}>{key}</option>
                                        ))}
                                    </select>
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
                                    <button type="submit" disabled={saveCategoryMutation.isPending} className="btn btn-primary">
                                        {saveCategoryMutation.isPending ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
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

export default Categories;
