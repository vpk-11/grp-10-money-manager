// client/src/pages/Budgets.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';

const Budgets = () => {
  const queryClient = useQueryClient();           // ← ONLY ONE declaration!
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    amount: '',
    period: 'monthly',
    notes: '',
    startDate: ''
  });

  // Fetch budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get('/budgets').then(res => res.data),
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => api.get('/expense-categories').then(res => res.data),
  });

  // ──────────────────────────────────────────────────────────────
  // SAVE (Create / Update)
  // ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        amount: parseFloat(data.amount) || 0,   // ← CRITICAL: send number, not string
      };
      if (!payload.startDate) delete payload.startDate;
      if (editingBudget) {
        return api.put(`/budgets/${editingBudget._id}`, payload);
      }
      return api.post('/budgets', payload);
    },
    onSuccess: () => {
      // Invalidate everything that can affect spent amounts
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err) => {
    },
  });

  // ──────────────────────────────────────────────────────────────
  // DELETE
  // ──────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const resetForm = () => {
    setFormData({ categoryId: '', amount: '', period: 'monthly', notes: '', startDate: '' });
    setEditingBudget(null);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId?._id || budget.categoryId,
      amount: budget.amount.toString(),
      period: budget.period,
      notes: budget.notes || '',
      startDate: budget.startDate ? budget.startDate.slice(0, 10) : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.categoryId) return;
    if (!formData.amount || parseFloat(formData.amount) <= 0)
      return;

    saveMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (pct) => {
    if (pct >= 100) return 'text-red-600 bg-red-50';
    if (pct >= 80) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getBarColor = (pct) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-orange-500';
    return 'bg-green-500';
  };

  if (budgetsLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-sm text-gray-600 mt-1">Set limits and stay on track</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Create Budget
        </button>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {budgets?.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-medium mb-2">No budgets yet</h3>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              Create Your First Budget
            </button>
          </div>
        ) : (
          budgets.map((budget) => {
            const pct = Math.min(budget.percentageUsed || 0, 150);
            const over = pct >= 100;

            return (
              <div
                key={budget._id}
                className={`card p-6 ${over ? 'ring-2 ring-red-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: (budget.categoryId?.color || '#3B82F6') + '20' }}
                    >
                      <Target className="h-7 w-7" style={{ color: budget.categoryId?.color || '#3B82F6' }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">
                        {budget.categoryId?.name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(budget)} className="p-2 hover:bg-gray-100 rounded">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => deleteMutation.mutate(budget._id)} className="p-2 hover:bg-red-50 rounded">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className={`text-3xl font-bold ${over ? 'text-red-600' : ''}`}>
                        {formatCurrency(budget.spent || 0)}
                      </span>
                      <span className="text-sm text-gray-500">
                        of {formatCurrency(budget.amount)}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getBarColor(pct)}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    {over && (
                      <p className="text-right mt-1 text-sm font-semibold text-red-600">
                        Over by {formatCurrency(budget.spent - budget.amount)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Used</p>
                      <p className={`font-bold text-lg ${over ? 'text-red-600' : ''}`}>
                        {pct.toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Remaining</p>
                      <p className="font-bold text-lg">
                        {formatCurrency(Math.max(0, budget.remaining || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(pct)}`}>
                        {pct >= 100 ? 'Over' : pct >= 80 ? 'Warning' : 'Good'}
                      </span>
                    </div>
                  </div>

                  {budget.notes && (
                    <p className="text-sm text-gray-600 italic border-t pt-3">{budget.notes}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-6">
              {editingBudget ? 'Edit Budget' : 'Create New Budget'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="input" required>
                  <option value="">Select category</option>
                  {categories?.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="500.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Period</label>
                <select name="period" value={formData.period} onChange={handleChange} className="input">
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Start Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1 btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 btn btn-primary">
                  {saveMutation.isPending ? 'Saving...' : (editingBudget ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;