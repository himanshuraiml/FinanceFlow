import React, { useState } from 'react';
import { Bill } from '../types';
import { formatCurrency, formatDate, formatShortDate, isDateOverdue, getDaysUntilDue } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { useCurrency } from '../hooks/useCurrency';
import BillForm from './BillForm';
import { Plus, Receipt, AlertCircle, CheckCircle2, Edit3, Trash2, Search, Calendar, Clock } from 'lucide-react';

interface BillsProps {
  bills: Bill[];
  onAddBill: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  onEditBill: (id: string, bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  onDeleteBill: (id: string) => void;
  onTogglePaidStatus: (id: string) => void;
}

const Bills: React.FC<BillsProps> = ({
  bills,
  onAddBill,
  onEditBill,
  onDeleteBill,
  onTogglePaidStatus
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { currency } = useCurrency();

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || bill.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'paid' && bill.isPaid) ||
      (statusFilter === 'unpaid' && !bill.isPaid) ||
      (statusFilter === 'overdue' && !bill.isPaid && isDateOverdue(bill.dueDate));
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const unpaidBills = bills.filter(bill => !bill.isPaid);
  const totalUnpaid = unpaidBills.reduce((sum, bill) => sum + bill.amount, 0);
  const overdueBills = unpaidBills.filter(bill => isDateOverdue(bill.dueDate));

  const categories = Array.from(new Set(bills.map(b => b.category)))
    .map(catId => getCategoryById(catId))
    .filter(Boolean);

  const handleFormSubmit = (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    if (editingBill) {
      onEditBill(editingBill.id, billData);
      setEditingBill(null);
    } else {
      onAddBill(billData);
    }
    setShowForm(false);
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      onDeleteBill(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Bills</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your recurring bills and payments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl shadow-lg">
              <Receipt className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Bills</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalBills, currency)}</p>
          </div>
        </div>

        <div className="bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-amber-400 to-amber-600 rounded-xl shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Unpaid Bills</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalUnpaid, currency)}</p>
          </div>
        </div>

        <div className="bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-red-400 to-red-600 rounded-xl shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Overdue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueBills.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category!.id} value={category!.id}>
                {category!.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Bills List */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl backdrop-blur-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bills Overview</h2>
        </div>
        
        {filteredBills.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No bills found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {searchTerm || selectedCategory || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start by adding your first bill'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredBills
              .sort((a, b) => {
                // Sort by due date, with overdue bills first
                if (isDateOverdue(a.dueDate) && !isDateOverdue(b.dueDate)) return -1;
                if (!isDateOverdue(a.dueDate) && isDateOverdue(b.dueDate)) return 1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
              })
              .map((bill) => {
                const category = getCategoryById(bill.category);
                const daysUntilDue = getDaysUntilDue(bill.dueDate);
                const isOverdue = isDateOverdue(bill.dueDate);
                
                return (
                  <div 
                    key={bill.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors border-l-4 ${
                      bill.isPaid ? 'border-l-emerald-500' : 
                      isOverdue ? 'border-l-red-500' : 'border-l-amber-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl ${category?.color || 'bg-gray-500'} flex items-center justify-center shadow-lg`}>
                          <Receipt className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{bill.name}</h3>
                            {bill.isRecurring && (
                              <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full border border-blue-500/30">
                                {bill.frequency}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">{category?.name}</span>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-500" />
                              <span className={`text-sm ${
                                bill.isPaid ? 'text-emerald-600 dark:text-emerald-400' :
                                isOverdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                              }`}>
                                {bill.isPaid ? 'Paid' : 
                                 isOverdue ? `${Math.abs(daysUntilDue)} days overdue` :
                                 daysUntilDue === 0 ? 'Due today' :
                                 `Due in ${daysUntilDue} days`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {formatCurrency(bill.amount, currency)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => onTogglePaidStatus(bill.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              bill.isPaid 
                                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={bill.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(bill)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(bill.id)}
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

      {/* Bill Form Modal */}
      {showForm && (
        <BillForm
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingBill(null);
          }}
          initialData={editingBill || undefined}
        />
      )}
    </div>
  );
};

export default Bills;