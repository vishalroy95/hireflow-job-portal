const currencyLocaleMap = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'en-EU',
  GBP: 'en-GB',
};

const formatMoney = (amount, currency = 'INR') => {
  const normalizedCurrency = !currency || currency === 'USD' ? 'INR' : currency;

  try {
    return new Intl.NumberFormat(currencyLocaleMap[normalizedCurrency] || 'en-IN', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  } catch (error) {
    return `${normalizedCurrency} ${Number(amount || 0).toLocaleString('en-IN')}`;
  }
};

export const formatSalary = (salary) => {
  if (!salary) return '-';
  if (typeof salary === 'number') return formatMoney(salary);

  const currency = salary.currency || 'INR';
  return `${formatMoney(salary.min, currency)} - ${formatMoney(salary.max, currency)}`;
};
