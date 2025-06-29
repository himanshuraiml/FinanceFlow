import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  MessageSquare,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Transaction, Bill } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  transactions: Transaction[];
  bills: Bill[];
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange, transactions, bills }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const notification = useNotifications(transactions, bills);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', name: 'Income', icon: TrendingUp },
    { id: 'expenses', name: 'Expenses', icon: TrendingDown },
    { id: 'bills', name: 'Bills', icon: Receipt },
    { id: 'sms', name: 'SMS Parser', icon: MessageSquare },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getNotificationIcon = () => {
    if (notification.type === 'none') {
      return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />;
    }

    const iconColor = notification.priority === 'high' ? 'text-red-400' : 
                     notification.priority === 'medium' ? 'text-amber-400' : 'text-blue-400';
    
    return notification.type === 'bill' ? 
      <Clock className={`w-5 h-5 ${iconColor}`} /> : 
      <AlertCircle className={`w-5 h-5 ${iconColor}`} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="FinanceFlow" className="w-8 h-8" />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">FinanceFlow</h1>
          </div>
          <div className="flex items-center space-x-2">
            {/* Mobile Notification */}
            <div className="relative">
              <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative">
                {getNotificationIcon()}
                {notification.count > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center ${
                    notification.priority === 'high' ? 'bg-red-500' : 
                    notification.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                  }`}>
                    {notification.count > 9 ? '9+' : notification.count}
                  </span>
                )}
              </button>
              {notification.message && (
                <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-xl z-50 min-w-48">
                  <p className="text-sm text-gray-900 dark:text-white">{notification.message}</p>
                </div>
              )}
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 w-64 h-full shadow-xl border-r border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <img src="/logo.png" alt="FinanceFlow" className="w-8 h-8" />
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">FinanceFlow</h1>
              </div>
            </div>
            <nav className="p-4">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onPageChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors mb-1 ${
                      currentPage === item.id
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  onPageChange('settings');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors mb-1 ${
                  currentPage === 'settings'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="FinanceFlow" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">FinanceFlow</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Smart Finance</p>
              </div>
            </div>
          </div>

          <nav className="p-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      currentPage === item.id
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => onPageChange('settings')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  currentPage === 'settings'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Header */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">{currentPage}</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Your financial insights for {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all w-64"
                  />
                </div>
                
                {/* Desktop Notification */}
                <div className="relative group">
                  <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative">
                    {getNotificationIcon()}
                    {notification.count > 0 && (
                      <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center ${
                        notification.priority === 'high' ? 'bg-red-500' : 
                        notification.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}>
                        {notification.count > 9 ? '9+' : notification.count}
                      </span>
                    )}
                  </button>
                  
                  {/* Notification Tooltip */}
                  {notification.message && (
                    <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl z-50 min-w-64 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center space-x-2">
                        {notification.type === 'bill' ? (
                          <Clock className={`w-4 h-4 ${
                            notification.priority === 'high' ? 'text-red-400' : 
                            notification.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'
                          }`} />
                        ) : (
                          <AlertCircle className={`w-4 h-4 ${
                            notification.priority === 'high' ? 'text-red-400' : 
                            notification.priority === 'medium' ? 'text-amber-400' : 'text-blue-400'
                          }`} />
                        )}
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{notification.message}</p>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notification.type === 'bill' ? 'Check your bills page' : 'Review your expenses'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;