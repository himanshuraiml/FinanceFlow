import { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: 'salary', name: 'Salary', type: 'income', color: 'bg-emerald-500', icon: 'Briefcase' },
  { id: 'freelance', name: 'Freelance', type: 'income', color: 'bg-blue-500', icon: 'Laptop' },
  { id: 'investments', name: 'Investments', type: 'income', color: 'bg-purple-500', icon: 'TrendingUp' },
  { id: 'other-income', name: 'Other', type: 'income', color: 'bg-gray-500', icon: 'Plus' },

  // Expense categories
  { id: 'food', name: 'Food & Dining', type: 'expense', color: 'bg-orange-500', icon: 'UtensilsCrossed' },
  { id: 'transportation', name: 'Transportation', type: 'expense', color: 'bg-red-500', icon: 'Car' },
  { id: 'shopping', name: 'Shopping', type: 'expense', color: 'bg-pink-500', icon: 'ShoppingBag' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', color: 'bg-indigo-500', icon: 'Film' },
  { id: 'healthcare', name: 'Healthcare', type: 'expense', color: 'bg-green-500', icon: 'Heart' },
  { id: 'education', name: 'Education', type: 'expense', color: 'bg-amber-500', icon: 'GraduationCap' },
  { id: 'other-expense', name: 'Other', type: 'expense', color: 'bg-gray-500', icon: 'Minus' },

  // Bill categories
  { id: 'utilities', name: 'Utilities', type: 'bill', color: 'bg-yellow-500', icon: 'Zap' },
  { id: 'rent', name: 'Rent/Mortgage', type: 'bill', color: 'bg-teal-500', icon: 'Home' },
  { id: 'insurance', name: 'Insurance', type: 'bill', color: 'bg-cyan-500', icon: 'Shield' },
  { id: 'subscriptions', name: 'Subscriptions', type: 'bill', color: 'bg-violet-500', icon: 'Repeat' },
];

export const getCategoryById = (id: string): Category | undefined => {
  return DEFAULT_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoriesByType = (type: 'income' | 'expense' | 'bill'): Category[] => {
  return DEFAULT_CATEGORIES.filter(cat => cat.type === type);
};