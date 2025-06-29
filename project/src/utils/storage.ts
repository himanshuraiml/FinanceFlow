import { Transaction, Bill } from '../types';

const TRANSACTIONS_KEY = 'finance_transactions';
const BILLS_KEY = 'finance_bills';
const SETTINGS_KEY = 'finance_settings';

// Enhanced storage with error handling and data validation
export const storage = {
  // Check if storage is available
  isStorageAvailable: (): boolean => {
    try {
      const test = 'storage_test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  // Transactions
  getTransactions: (): Transaction[] => {
    try {
      if (!storage.isStorageAvailable()) {
        console.warn('Local storage not available');
        return [];
      }
      
      const data = localStorage.getItem(TRANSACTIONS_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      
      // Validate data structure
      if (!Array.isArray(parsed)) {
        console.warn('Invalid transactions data format');
        return [];
      }
      
      return parsed.filter(t => 
        t && typeof t === 'object' && 
        t.id && t.type && t.amount !== undefined
      );
    } catch (error) {
      console.error('Failed to load transactions:', error);
      return [];
    }
  },

  saveTransactions: (transactions: Transaction[]): boolean => {
    try {
      if (!storage.isStorageAvailable()) {
        console.warn('Local storage not available');
        return false;
      }
      
      // Validate data before saving
      if (!Array.isArray(transactions)) {
        console.error('Invalid transactions data');
        return false;
      }
      
      const dataToSave = JSON.stringify(transactions);
      localStorage.setItem(TRANSACTIONS_KEY, dataToSave);
      
      // Verify the save was successful
      const saved = localStorage.getItem(TRANSACTIONS_KEY);
      return saved === dataToSave;
    } catch (error) {
      console.error('Failed to save transactions:', error);
      return false;
    }
  },

  // Bills
  getBills: (): Bill[] => {
    try {
      if (!storage.isStorageAvailable()) {
        console.warn('Local storage not available');
        return [];
      }
      
      const data = localStorage.getItem(BILLS_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      
      // Validate data structure
      if (!Array.isArray(parsed)) {
        console.warn('Invalid bills data format');
        return [];
      }
      
      return parsed.filter(b => 
        b && typeof b === 'object' && 
        b.id && b.name && b.amount !== undefined
      );
    } catch (error) {
      console.error('Failed to load bills:', error);
      return [];
    }
  },

  saveBills: (bills: Bill[]): boolean => {
    try {
      if (!storage.isStorageAvailable()) {
        console.warn('Local storage not available');
        return false;
      }
      
      // Validate data before saving
      if (!Array.isArray(bills)) {
        console.error('Invalid bills data');
        return false;
      }
      
      const dataToSave = JSON.stringify(bills);
      localStorage.setItem(BILLS_KEY, dataToSave);
      
      // Verify the save was successful
      const saved = localStorage.getItem(BILLS_KEY);
      return saved === dataToSave;
    } catch (error) {
      console.error('Failed to save bills:', error);
      return false;
    }
  },

  // Settings
  getSettings: (): Record<string, any> => {
    try {
      if (!storage.isStorageAvailable()) {
        return {};
      }
      
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {};
    }
  },

  saveSettings: (settings: Record<string, any>): boolean => {
    try {
      if (!storage.isStorageAvailable()) {
        return false;
      }
      
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  },

  // Data export/import for backup
  exportData: (): string => {
    try {
      const data = {
        transactions: storage.getTransactions(),
        bills: storage.getBills(),
        settings: storage.getSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      return '';
    }
  },

  importData: (jsonData: string): boolean => {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.transactions && Array.isArray(data.transactions)) {
        storage.saveTransactions(data.transactions);
      }
      
      if (data.bills && Array.isArray(data.bills)) {
        storage.saveBills(data.bills);
      }
      
      if (data.settings && typeof data.settings === 'object') {
        storage.saveSettings(data.settings);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  },

  // Clear all data
  clearAllData: (): boolean => {
    try {
      localStorage.removeItem(TRANSACTIONS_KEY);
      localStorage.removeItem(BILLS_KEY);
      localStorage.removeItem(SETTINGS_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }
};

// Privacy notice for users
export const PRIVACY_NOTICE = `
🔒 Your Privacy is Protected

FinanceFlow stores all your financial data locally on your device:
• No data is sent to external servers
• No cloud storage or syncing
• No tracking or analytics
• Complete offline functionality

Your financial information stays private and secure on your device only.
`;