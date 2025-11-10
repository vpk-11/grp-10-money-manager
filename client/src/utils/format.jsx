export const formatCurrency = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

