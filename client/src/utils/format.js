export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '$0.00';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(Number(amount));
  } catch {
    return `$${Number(amount).toFixed(2)}`;
  }
};

export const formatDate = (date, locale = 'en-US') => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date, locale = 'en-US') => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (number, decimals = 2, locale = 'en-US') => {
  if (number === null || number === undefined || Number.isNaN(Number(number))) return '0';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number(number));
};
