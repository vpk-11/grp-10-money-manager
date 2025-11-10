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

const handleDelete = (id, type) => {
  if (window.confirm('Are you sure you want to delete this category?')) {
    if (type === 'expense') {
      deleteExpenseCategoryMutation.mutate(id);
    } else {
      deleteIncomeCategoryMutation.mutate(id);
    }
  }
};
