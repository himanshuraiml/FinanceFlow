import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../hooks/useCurrency';
import { storage } from '../utils/storage';
import { CURRENCIES } from '../utils/currency';
import { 
  Settings as SettingsIcon,
  User,
  Shield,
  Moon,
  Sun,
  Bell,
  BellOff,
  Globe,
  Database,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';

const Settings: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { currency, updateCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    enabled: true,
    billReminders: true,
    expenseAlerts: true,
    weeklyReports: true
  });

  const handleExportData = () => {
    const data = storage.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        const success = storage.importData(data);
        if (success) {
          alert('Data imported successfully! Please refresh the page.');
        } else {
          alert('Failed to import data. Please check the file format.');
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to permanently delete all your data? This action cannot be undone.')) {
      storage.clearAllData();
      alert('All data has been cleared. Please refresh the page.');
    }
  };

  const handleNotificationToggle = (type: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const currencyOptions = Object.values(CURRENCIES).filter(c => c.code !== 'DEFAULT');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your app preferences and data</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isDarkMode ? 'Active' : 'Inactive'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                {notifications.enabled ? (
                  <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <BellOff className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about bills and expenses</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Enable Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Notifications are {notifications.enabled ? 'enabled' : 'disabled'}
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationToggle('enabled')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.enabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notifications.enabled && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Bill Reminders</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about upcoming and overdue bills</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('billReminders')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.billReminders ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.billReminders ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Expense Alerts</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get notified about high expenses</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('expenseAlerts')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.expenseAlerts ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.expenseAlerts ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Weekly Reports</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get weekly spending summaries</p>
                    </div>
                    <button
                      onClick={() => handleNotificationToggle('weeklyReports')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.weeklyReports ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Currency</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Select your preferred currency</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-white">Current Currency</span>
                <span className="text-gray-600 dark:text-gray-400">{currency.name} ({currency.symbol})</span>
              </div>
              
              <select
                value={currency.code}
                onChange={(e) => {
                  const selectedCurrency = currencyOptions.find(c => c.code === e.target.value);
                  if (selectedCurrency) {
                    updateCurrency(selectedCurrency);
                  }
                }}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              >
                {currencyOptions.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.name} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Export, import, or clear your data</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Export Data</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Download your data as JSON backup</p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Import Data</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Restore data from JSON backup</p>
                </div>
                <label className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clear All Data</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete all your data</p>
                </div>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy & Security Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Privacy Protection */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Protection</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Your data privacy and security status</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                'All data stored locally on your device',
                'No data sent to external servers',
                'No tracking or analytics',
                'Complete offline functionality',
                'Local push notifications only (no external services)'
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-gray-900 dark:text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Security */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Security</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">How your financial data is protected</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Local Storage</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All your financial data is stored securely in your browser's local storage
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <EyeOff className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">No External Access</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your data never leaves your device and is not accessible to third parties
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Encryption</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Data is stored using browser's built-in security mechanisms
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Local Notifications</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Push notifications are processed locally on your device without external servers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Privacy Policy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Our commitment to your privacy</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                FinanceFlow is designed with privacy as a core principle. We do not collect, store, or transmit any of your personal or financial data to external servers. All data remains on your device, ensuring complete privacy and security of your financial information.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;