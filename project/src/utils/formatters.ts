import { CurrencyInfo, formatCurrencyWithSymbol, CURRENCIES } from './currency';

export const formatCurrency = (amount: number, currency?: CurrencyInfo): string => {
  const currencyToUse = currency || CURRENCIES.DEFAULT;
  return formatCurrencyWithSymbol(amount, currencyToUse);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatShortDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

export const isDateOverdue = (date: string): boolean => {
  const today = new Date();
  const dueDate = new Date(date);
  return dueDate < today;
};

export const getDaysUntilDue = (date: string): number => {
  const today = new Date();
  const dueDate = new Date(date);
  const diffTime = dueDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};