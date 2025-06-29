import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Income from './components/Income';
import Expenses from './components/Expenses';
import Bills from './components/Bills';
import SMSParser from './components/SMSParser';
import Settings from './components/Settings';
import { Transaction, Bill } from './types';
import { storage } from './utils/storage';
import { useNativeFeatures } from './hooks/useNativeFeatures';
import { useCurrency } from './hooks/useCurrency';
import { Shield, CheckCircle } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  
  const { isNative, hasStoragePermission, permissionsRequested, triggerHaptic } = useNativeFeatures();
  const { currency, isLoading: currencyLoading } = useCurrency();

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      // Only proceed if we have storage permission (or not on native)
      if (!isNative || hasStoragePermission) {
        try {
          const loadedTransactions = storage.getTransactions();
          const loadedBills = storage.getBills();
          
          setTransactions(loadedTransactions);
          setBills(loadedBills);
          
          // Show privacy notice on first load
          const settings = storage.getSettings();
          if (!settings.privacyNoticeShown) {
            setShowPrivacyNotice(true);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };

    // Wait for permissions to be requested before loading data
    if (permissionsRequested) {
      loadData();
    }
  }, [hasStoragePermission, permissionsRequested, isNative]);

  // Transaction handlers
  const handleAddTransaction = (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    
    // Only save if we have storage permission
    if (!isNative || hasStoragePermission) {
      storage.saveTransactions(updatedTransactions);
    }
    
    triggerHaptic();
  };

  const handleEditTransaction = (id: string, transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const updatedTransactions = transactions.map(t => 
      t.id === id 
        ? { ...transactionData, id, createdAt: t.createdAt }
        : t
    );
    setTransactions(updatedTransactions);
    
    if (!isNative || hasStoragePermission) {
      storage.saveTransactions(updatedTransactions);
    }
    
    triggerHaptic();
  };

  const handleDeleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    
    if (!isNative || hasStoragePermission) {
      storage.saveTransactions(updatedTransactions);
    }
    
    triggerHaptic();
  };

  // Bill handlers
  const handleAddBill = (billData: Omit<Bill, 'id' | 'createdAt'>) => {
    const newBill: Bill = {
      ...billData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    const updatedBills = [...bills, newBill];
    setBills(updatedBills);
    
    if (!isNative || hasStoragePermission) {
      storage.saveBills(updatedBills);
    }
    
    triggerHaptic();
  };

  const handleEditBill = (id: string, billData: Omit<Bill, 'id' | 'createdAt'>) => {
    const updatedBills = bills.map(b => 
      b.id === id 
        ? { ...billData, id, createdAt: b.createdAt }
        : b
    );
    setBills(updatedBills);
    
    if (!isNative || hasStoragePermission) {
      storage.saveBills(updatedBills);
    }
    
    triggerHaptic();
  };

  const handleDeleteBill = (id: string) => {
    const updatedBills = bills.filter(b => b.id !== id);
    setBills(updatedBills);
    
    if (!isNative || hasStoragePermission) {
      storage.saveBills(updatedBills);
    }
    
    triggerHaptic();
  };

  const handleTogglePaidStatus = (id: string) => {
    const updatedBills = bills.map(b => 
      b.id === id ? { ...b, isPaid: !b.isPaid } : b
    );
    setBills(updatedBills);
    
    if (!isNative || hasStoragePermission) {
      storage.saveBills(updatedBills);
    }
    
    triggerHaptic();
  };

  const handlePrivacyNoticeAccept = () => {
    setShowPrivacyNotice(false);
    const settings = storage.getSettings();
    storage.saveSettings({ ...settings, privacyNoticeShown: true });
  };

  const renderCurrentPage = () => {
    const pageProps = {
      transactions,
      bills,
      currency: currencyLoading ? undefined : currency
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />;
      case 'income':
        return (
          <Income
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            currency={currency}
          />
        );
      case 'expenses':
        return (
          <Expenses
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            currency={currency}
          />
        );
      case 'bills':
        return (
          <Bills
            bills={bills}
            onAddBill={handleAddBill}
            onEditBill={handleEditBill}
            onDeleteBill={handleDeleteBill}
            onTogglePaidStatus={handleTogglePaidStatus}
            currency={currency}
          />
        );
      case 'sms':
        return (
          <SMSParser
            onAddTransaction={handleAddTransaction}
            currency={currency}
          />
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard {...pageProps} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isNative ? 'native-app' : ''} bg-gray-50 dark:bg-gray-900`}>
      {/* Privacy Notice Modal */}
      {showPrivacyNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Privacy & Security</h2>
            </div>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <p>FinanceFlow prioritizes your privacy and security:</p>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>All data stored locally on your device</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>No data sent to external servers</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>No tracking or analytics</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Complete offline functionality</span>
                </li>
              </ul>
              <p className="text-green-600 dark:text-green-400 font-medium">Your financial data remains private and secure.</p>
            </div>
            
            <button
              onClick={handlePrivacyNoticeAccept}
              className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        transactions={transactions}
        bills={bills}
      >
        {renderCurrentPage()}
      </Layout>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;