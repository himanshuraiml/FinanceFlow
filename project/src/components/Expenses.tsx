import React, { useState } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { useCurrency } from '../hooks/useCurrency';
import TransactionForm from './TransactionForm';
import { Plus, TrendingDown, Edit3, Trash2, Search, MessageSquare } from 'lucide-react';

interface ExpensesProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onEditTransaction: (id: string, transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { currency } = useCurrency();

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const filteredTransactions = expenseTransactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || transaction.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const currentMonthExpenses = expenseTransactions
    .filter(t => t.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, t) => sum + t.amount, 0);

  const smsExpenses = expenseTransactions.filter(t => t.source === 'sms').length;

  const categories = Array.from(new Set(expenseTransactions.map(t => t.category)))
    .map(catId => getCategoryById(catId))
    .filter(Boolean);

  // Calculate category breakdown
  const categoryBreakdown = categories.map(category => {
    const categoryExpenses = expenseTransactions.filter(t => t.category === category!.id);
    const total = categoryExpenses.reduce((sum, t) => sum + t.amount, 0);
    return {
      category: category!,
      total,
      percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
    };
  }).sort((a, b) => b.total - a.total);

  const handleFormSubmit = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      onEditTransaction(editingTransaction.id, transactionData);
      setEditingTransaction(null);
    } else {
      onAddTransaction(transactionData);
    }
    setShowForm(false);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      onDeleteTransaction(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Expenses</h1>
          <p className="text-gray-600 dark:text-gray-400">Track and manage your spending</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-red-400 to-red-600 rounded-xl shadow-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalExpenses, currency)}</p>
          </div>
        </div>

        <div className="bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 dark:border-orange-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl shadow-lg">
              <TrendingDown className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">This Month</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(currentMonthExpenses, currency)}</p>
          </div>
        </div>

        <div className="bg-cyan-500/10 dark:bg-cyan-500/10 border border-cyan-500/20 dark:border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-xl shadow-lg">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-1">From SMS</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{smsExpenses}</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h2>
          <div className="space-y-4">
            {categoryBreakdown.slice(0, 5).map(({ category, total, percentage }) => (
              <div key={category.id} className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(total, currency)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category!.id} value={category!.id}>
                  {category!.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl backdrop-blur-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expense Records</h2>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <TrendingDown className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No expenses found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm || selectedCategory 
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first expense'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction) => {
                const category = getCategoryById(transaction.category);
                return (
                  <div 
                    key={transaction.id}
                    className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl ${category?.color || 'bg-gray-500'} flex items-center justify-center shadow-lg`}>
                          <TrendingDown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{transaction.description}</h3>
                            {transaction.source === 'sms' && (
                              <span className="text-xs bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 px-2 py-1 rounded-full border border-cyan-500/30">
                                SMS
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{category?.name}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{formatDate(transaction.date)}</span>
                            {transaction.merchant && (
                              <span className="text-sm text-gray-500 dark:text-gray-500">• {transaction.merchant}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                          -{formatCurrency(transaction.amount, currency)}
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          type="expense"
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          initialData={editingTransaction || undefined}
          currency={currency}
        />
      )}
    </div>
  );
};

export default Expenses;