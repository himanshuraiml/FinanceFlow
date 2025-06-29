import { useState, useEffect } from 'react';
import { Transaction, Bill } from '../types';
import { isDateOverdue, getDaysUntilDue } from '../utils/formatters';

export interface NotificationInfo {
  type: 'bill' | 'expense' | 'none';
  message: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
}

export const useNotifications = (transactions: Transaction[], bills: Bill[]) => {
  const [notification, setNotification] = useState<NotificationInfo>({
    type: 'none',
    message: '',
    count: 0,
    priority: 'low'
  });

  useEffect(() => {
    const calculateNotifications = () => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7);
      
      // Check for overdue bills (highest priority)
      const overdueBills = bills.filter(bill => !bill.isPaid && isDateOverdue(bill.dueDate));
      if (overdueBills.length > 0) {
        setNotification({
          type: 'bill',
          message: `${overdueBills.length} overdue bill${overdueBills.length > 1 ? 's' : ''}`,
          count: overdueBills.length,
          priority: 'high'
        });
        return;
      }

      // Check for bills due soon (within 3 days)
      const upcomingBills = bills.filter(bill => {
        if (bill.isPaid) return false;
        const daysUntil = getDaysUntilDue(bill.dueDate);
        return daysUntil >= 0 && daysUntil <= 3;
      });
      
      if (upcomingBills.length > 0) {
        setNotification({
          type: 'bill',
          message: `${upcomingBills.length} bill${upcomingBills.length > 1 ? 's' : ''} due soon`,
          count: upcomingBills.length,
          priority: 'medium'
        });
        return;
      }

      // Check for recent high expenses (this month)
      const currentMonthExpenses = transactions.filter(t => 
        t.type === 'expense' && t.date.startsWith(currentMonth)
      );
      
      if (currentMonthExpenses.length > 0) {
        const totalExpenses = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
        const avgExpense = totalExpenses / currentMonthExpenses.length;
        const highExpenses = currentMonthExpenses.filter(t => t.amount > avgExpense * 2);
        
        if (highExpenses.length > 0) {
          setNotification({
            type: 'expense',
            message: `${highExpenses.length} high expense${highExpenses.length > 1 ? 's' : ''} this month`,
            count: highExpenses.length,
            priority: 'low'
          });
          return;
        }
      }

      // No critical notifications
      setNotification({
        type: 'none',
        message: '',
        count: 0,
        priority: 'low'
      });
    };

    calculateNotifications();
  }, [transactions, bills]);

  return notification;
};