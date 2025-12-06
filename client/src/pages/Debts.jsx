import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Calendar, TrendingDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency } from '../utils/format';
import toast from 'react-hot-toast';

const Debts = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card',
    principal: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    dueDate: 1,
    startDate: new Date().toISOString().split('T')[0],
    lender: '',
    accountNumber: '',
    status: 'active',
    notes: ''
  });

  const { data: debts, isLoading: debtsLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: () => api.get('/debts').then(res => res.data)
  });

  const { data: analytics } = useQuery({
    queryKey: ['debt-analytics'],
    queryFn: () => api.get('/debts/analytics/summary').then(res => res.data)
  });

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (parseFloat(data.currentBalance) === 0) {
        data.status = 'paid_off';
      } else if (data.status === 'paid_off') {
        data.status = 'active';
      }
      if (editingDebt) {
        return api.put(`/debts/${editingDebt._id}`, data);
      }
      return api.post('/debts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['debts']);
      queryClient.invalidateQueries(['debt-analytics']);
      toast.success(editingDebt ? 'Debt updated!' : 'Debt added!');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to save debt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/debts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['debts']);
      queryClient.invalidateQueries(['debt-analytics']);
      toast.success('Debt deleted');
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'credit_card',
      principal: '',
      currentBalance: '',
      interestRate: '',
      minimumPayment: '',
      dueDate: 1,
      startDate: new Date().toISOString().split('T')[0],
      lender: '',
      accountNumber: '',
      status: 'active',
      notes: ''
    });
    setEditingDebt(null);
  };

  const handleEdit = (debt) => {
    setEditingDebt(debt);
    setFormData({
      name: debt.name || '',
      type: debt.type || 'credit_card',
      principal: debt.principal?.toString() || '',
      currentBalance: debt.currentBalance?.toString() || '',
      interestRate: debt.interestRate?.toString() || '',
      minimumPayment: debt.minimumPayment?.toString() || '',
      dueDate: debt.dueDate || 1,
      startDate: debt.startDate ? new Date(debt.startDate).toISOString().split('T')[0] : '',
      lender: debt.lender || '',
      accountNumber: debt.accountNumber || '',
      status: debt.currentBalance === 0 ? 'paid_off' : debt.status,
      notes: debt.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['principal', 'currentBalance', 'minimumPayment', 'interestRate'].includes(name)) {
      if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    if (name === 'dueDate') {
      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 31)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Debt name is required');
    if (!formData.principal || parseFloat(formData.principal) <= 0) return toast.error('Original amount must be > 0');

    const cleanedData = {
      name: formData.name.trim(),
      type: formData.type,
      principal: parseFloat(formData.principal),
      currentBalance: parseFloat(formData.currentBalance || 0),
      interestRate: parseFloat(formData.interestRate || 0),
      minimumPayment: parseFloat(formData.minimumPayment || 0),
      dueDate: parseInt(formData.dueDate) || 1,
      startDate: formData.startDate,
      lender: formData.lender.trim(),
      accountNumber: formData.accountNumber.trim(),
      notes: formData.notes.trim(),
      status: formData.status
    };

    saveMutation.mutate(cleanedData);
  };

  const calculateDaysUntilDue = (dueDate) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    let nextMonth = currentMonth;
    let nextYear = currentYear;

    if (currentDay >= dueDate) {
      nextMonth = currentMonth + 1;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
    }

    const nextPayment = new Date(nextYear, nextMonth, dueDate);
    const diffTime = nextPayment - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDebtTypeLabel = (type) => {
    const labels = {
      student_loan: 'Student Loan', credit_card: 'Credit Card', personal_loan: 'Personal Loan',
      mortgage: 'Mortgage', auto_loan: 'Auto Loan', medical: 'Medical', other: 'Other'
    };
    return labels[type] || type;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-blue-100 text-blue-800',
      paid_off: 'bg-emerald-100 text-emerald-800',
      defaulted: 'bg-red-100 text-red-800',
      deferred: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (debtsLoading) return <LoadingSpinner />;

  const visibleDebts = debts?.filter(d => d.status === 'active' || d.status === 'paid_off') || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Debt Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track and conquer your debts</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="btn btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
          <Plus className="h-5 w-5" /> Add Debt
        </button>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Remaining</p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{formatCurrency(analytics.totalDebt)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{analytics.debtCount} active</p>
          </div>
          <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-l-4 border-emerald-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Paid Off</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(analytics.totalPaid)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">🎉 You're winning!</p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly Payments</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{formatCurrency(analytics.totalMonthlyPayment)}</p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Rate</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{analytics.avgInterestRate}%</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {visibleDebts.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="h-16 w-16 mx-auto text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mt-4">No debts yet</h3>
            <p className="text-gray-600">Add your first debt to get started</p>
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-4">
              Add Your First Debt
            </button>
          </div>
        ) : (
          visibleDebts.map((debt) => {
            const isPaidOff = debt.currentBalance === 0 || debt.status === 'paid_off';
            const daysUntilDue = isPaidOff ? null : calculateDaysUntilDue(debt.dueDate);
            const isUrgent = daysUntilDue !== null && daysUntilDue <= 7;

            return (
              <div key={debt._id} className={`card transition-all duration-300 hover:shadow-xl ${isPaidOff ? 'border-2 border-emerald-300 dark:border-emerald-600 bg-gradient-to-br from-emerald-50/50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/30' : 'hover:-translate-y-1'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{debt.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(debt.status)} dark:opacity-90`}>
                            {debt.status === 'paid_off' ? '✓ PAID OFF' : debt.status.replace('_', ' ')}
                          </span>
                          {isPaidOff && <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400 animate-pulse" />}
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{getDebtTypeLabel(debt.type)}</p>
                        {debt.lender && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>{debt.lender}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(debt)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg">
                          <Edit className="h-4 w-4 text-gray-500 dark:text-gray-200" />
                        </button>
                        <button onClick={() => deleteMutation.mutate(debt._id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg">
                          <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-200" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Payoff Progress</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {debt.percentagePaidOff?.toFixed(1)}% paid
                          {isPaidOff && ' → 🎉 100% DONE!'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-500 shadow-lg ${isPaidOff ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-green-400 to-green-600'}`}
                          style={{ width: `${Math.min(debt.percentagePaidOff || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Current Balance</p>
                        <p className="font-bold text-xl text-gray-900 dark:text-gray-100">{formatCurrency(debt.currentBalance)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Original</p>
                        <p className="font-semibold text-lg text-gray-700 dark:text-gray-300">{formatCurrency(debt.principal)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Rate</p>
                        <p className="font-semibold text-lg text-gray-700 dark:text-gray-300">{debt.interestRate}%</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide mb-1">Min Payment</p>
                        <p className="font-semibold text-lg text-gray-700 dark:text-gray-300">{formatCurrency(debt.minimumPayment)}</p>
                      </div>
                    </div>
                  </div>

                  {!isPaidOff && debt.status === 'active' && (
                    <div className="lg:w-64">
                      <div className={`p-6 rounded-xl text-center shadow-lg border-2 ${isUrgent ? 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-300 dark:border-red-700 animate-pulse' : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600'}`}>
                        <Calendar className={`h-8 w-8 mx-auto mb-3 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Next Payment</p>
                        <p className={`text-5xl font-black mt-2 ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                          {daysUntilDue}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">days</p>
                        {isUrgent && (
                          <div className="flex items-center justify-center gap-1 mt-3 text-sm text-red-600 dark:text-red-400 font-bold">
                            <AlertCircle className="h-4 w-4" />
                            ⚠️ Pay soon
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingDebt ? 'Edit Debt' : 'Add Debt'}</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select name="type" value={formData.type} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2">
                    <option value="credit_card">Credit Card</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="personal_loan">Personal Loan</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="auto_loan">Auto Loan</option>
                    <option value="medical">Medical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Original Amount</label>
                  <input type="text" name="principal" value={formData.principal} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Current Balance</label>
                  <input type="text" name="currentBalance" value={formData.currentBalance} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                  <input type="text" name="interestRate" value={formData.interestRate} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Payment</label>
                  <input type="text" name="minimumPayment" value={formData.minimumPayment} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <input type="number" name="dueDate" value={formData.dueDate} onChange={handleChange} min="1" max="31"
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lender</label>
                  <input type="text" name="lender" value={formData.lender} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Account Number</label>
                  <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange}
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3"
                    className="input bg-gray-50 dark:bg-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-700 focus:ring-blue-500 focus:border-blue-500 rounded-md w-full p-2" />
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <button type="button" onClick={closeModal}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all rounded-md p-2">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending}
                  className="flex-1 bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 transition-all rounded-md p-2">
                  {saveMutation.isPending ? 'Saving...' : (editingDebt ? 'Update' : 'Add Debt')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Debts;
