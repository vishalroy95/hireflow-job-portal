const currencyLocaleMap = {
  INR: 'en-IN',
  USD: 'en-US',
};

const formatMoney = (amount, currency = 'INR') => {
  const normalizedCurrency = currency === 'USD' ? 'USD' : 'INR';

  try {
    return new Intl.NumberFormat(currencyLocaleMap[normalizedCurrency] || 'en-IN', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  } catch {
    return `${normalizedCurrency} ${Number(amount || 0).toLocaleString('en-IN')}`;
  }
};

const normalizeAmountToInr = (amount, sourceCurrency = 'INR', usdRate = 0.012) => {
  const numericAmount = Number(amount || 0);
  if (sourceCurrency === 'USD' && usdRate > 0) return numericAmount / usdRate;
  return numericAmount;
};

const getDisplayCurrency = ({ countryCode = 'IN' } = {}) => (
  countryCode === 'IN' ? 'INR' : 'USD'
);

const convertFromInr = (amount, displayCurrency, usdRate = 0.012) => (
  displayCurrency === 'USD' ? Number(amount || 0) * Number(usdRate || 0.012) : Number(amount || 0)
);

export const formatSalary = (salary, options = {}) => {
  if (!salary) return '';
  const displayCurrency = getDisplayCurrency(options);
  const usdRate = Number(options.usdRate || 0.012);

  if (typeof salary === 'number') {
    return formatMoney(convertFromInr(salary, displayCurrency, usdRate), displayCurrency);
  }

  const sourceCurrency = salary.currency || 'INR';
  const minInr = normalizeAmountToInr(salary.min, sourceCurrency, usdRate);
  const maxInr = normalizeAmountToInr(salary.max, sourceCurrency, usdRate);
  return `${formatMoney(convertFromInr(minInr, displayCurrency, usdRate), displayCurrency)} - ${formatMoney(convertFromInr(maxInr, displayCurrency, usdRate), displayCurrency)}`;
};

export const getSalaryDisplayOptions = (settings, selectedCountry) => ({
  countryCode: selectedCountry?.code || 'IN',
  usdRate: Number(settings?.currency?.usdRate || 0.012),
});
