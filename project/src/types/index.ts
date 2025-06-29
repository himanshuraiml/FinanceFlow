export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  source?: 'manual' | 'sms';
  merchant?: string;
  account?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  isRecurring: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'bill';
  color: string;
  icon: string;
}

export interface SMSMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  parsed?: boolean;
  transactionId?: string;
}

export interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  monthlyGrowth: number;
  savingsRate: number;
  topCategory: string;
}