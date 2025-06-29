import React from 'react';
import { Transaction, Bill } from '../types';
import { formatDate, getDaysUntilDue, isDateOverdue } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { useCurrency } from '../hooks/useCurrency';
import { formatCurrency } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface DashboardProps {
  transactions: Transaction[];
  bills: Bill[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions, bills }) => {
  const { currency } = useCurrency();
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const currentMonthTransactions = transactions.filter(t => 
    t.date.startsWith(currentMonth)
  );

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netIncome / totalIncome) * 100) : 0;

  // Calculate real growth data from last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date.toISOString().slice(0, 7);
  });

  const chartData = last6Months.map(month => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(month));
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      name: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      income,
      expenses
    };
  });

  // Calculate real expense breakdown
  const expenseCategories = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, transaction) => {
      const category = getCategoryById(transaction.category);
      const categoryName = category?.name || 'Other';
      acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.entries(expenseCategories)
    .map(([name, value], index) => ({
      name,
      value,
      color: [
        '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', 
        '#10b981', '#f97316', '#84cc16', '#ec4899'
      ][index % 8]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Calculate growth percentages
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const prevMonthStr = previousMonth.toISOString().slice(0, 7);
  
  const prevMonthTransactions = transactions.filter(t => t.date.startsWith(prevMonthStr));
  const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const prevExpenses = prevMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const prevNet = prevIncome - prevExpenses;

  const incomeGrowth = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome * 100) : 0;
  const expenseGrowth = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses * 100) : 0;
  const netGrowth = prevNet !== 0 ? ((netIncome - prevNet) / Math.abs(prevNet) * 100) : 0;

  const unpaidBills = bills.filter(bill => !bill.isPaid);
  const overdueBills = unpaidBills.filter(bill => isDateOverdue(bill.dueDate));
  const upcomingBills = unpaidBills
    .filter(bill => !isDateOverdue(bill.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: 'Total Income',
      value: formatCurrency(totalIncome, currency),
      change: `${Math.abs(incomeGrowth).toFixed(1)}%`,
      changeType: incomeGrowth >= 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      color: 'from-emerald-400 to-emerald-600',
      bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-500/20 dark:border-emerald-500/20'
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(totalExpenses, currency),
      change: `${Math.abs(expenseGrowth).toFixed(1)}%`,
      changeType: expenseGrowth <= 0 ? 'positive' : 'negative',
      icon: TrendingDown,
      color: 'from-red-400 to-red-600',
      bgColor: 'bg-red-500/10 dark:bg-red-500/10',
      borderColor: 'border-red-500/20 dark:border-red-500/20'
    },
    {
      title: 'Net Income',
      value: formatCurrency(netIncome, currency),
      change: `${Math.abs(netGrowth).toFixed(1)}%`,
      changeType: netGrowth >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: netIncome >= 0 ? 'from-blue-400 to-blue-600' : 'from-red-400 to-red-600',
      bgColor: netIncome >= 0 ? 'bg-blue-500/10 dark:bg-blue-500/10' : 'bg-red-500/10 dark:bg-red-500/10',
      borderColor: netIncome >= 0 ? 'border-blue-500/20 dark:border-blue-500/20' : 'border-red-500/20 dark:border-red-500/20'
    },
    {
      title: 'Savings Rate',
      value: `${savingsRate.toFixed(1)}%`,
      change: `${Math.abs(netGrowth).toFixed(1)}%`,
      changeType: netGrowth >= 0 ? 'positive' : 'negative',
      icon: Target,
      color: 'from-purple-400 to-purple-600',
      bgColor: 'bg-purple-500/10 dark:bg-purple-500/10',
      borderColor: 'border-purple-500/20 dark:border-purple-500/20'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Currency Display */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-gray-700 dark:text-gray-300">Currency: </span>
            <span className="text-gray-900 dark:text-white font-medium">{currency.name} ({currency.symbol})</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">Auto-detected from location</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={index}
              className={`${stat.bgColor} ${stat.borderColor} border rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/10 dark:hover:shadow-gray-900/20 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  {stat.changeType === 'positive' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500 dark:text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">vs last month</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expenses Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Financial Overview</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Last 6 months income vs expenses</p>
            </div>
            <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <div className="h-64">
            {chartData.some(d => d.income > 0 || d.expenses > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: any) => [formatCurrency(value, currency), '']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    name="Income"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No transaction data yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Add some transactions to see your financial overview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Expense Breakdown</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Current month category distribution</p>
            </div>
          </div>
          <div className="h-64">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(value, currency), '']}
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {pieData.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <TrendingDown className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No expense data yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Add some expenses to see the breakdown</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Start by adding your first transaction</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => {
                const category = getCategoryById(transaction.category);
                return (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors border border-gray-200/30 dark:border-gray-600/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${category?.color || 'bg-gray-500'} flex items-center justify-center`}>
                        <span className="text-white text-sm font-medium">
                          {category?.name.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <span className={`font-semibold ${
                      transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Bills</h2>
          
          {overdueBills.length > 0 && (
            <div className="mb-4 p-3 bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 dark:border-red-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {overdueBills.length} overdue bill{overdueBills.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {upcomingBills.length === 0 && overdueBills.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No upcoming bills</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Add some bills to track due dates</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...overdueBills, ...upcomingBills].slice(0, 5).map((bill) => {
                const category = getCategoryById(bill.category);
                const daysUntil = getDaysUntilDue(bill.dueDate);
                const isOverdue = isDateOverdue(bill.dueDate);
                
                return (
                  <div 
                    key={bill.id}
                    className={`flex items-center justify-between p-4 rounded-xl transition-colors border ${
                      isOverdue 
                        ? 'bg-red-500/10 dark:bg-red-500/10 border-red-500/20 dark:border-red-500/20' 
                        : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 border-gray-200/30 dark:border-gray-600/30'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg ${category?.color || 'bg-gray-500'} flex items-center justify-center`}>
                        <Receipt className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{bill.name}</p>
                        <p className={`text-sm flex items-center space-x-1 ${
                          isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>
                            {isOverdue 
                              ? `${Math.abs(daysUntil)} days overdue` 
                              : daysUntil === 0 
                                ? 'Due today' 
                                : `Due in ${daysUntil} days`
                            }
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(bill.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;