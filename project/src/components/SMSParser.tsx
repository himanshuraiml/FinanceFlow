import React, { useState, useEffect } from 'react';
import { Transaction, SMSMessage } from '../types';
import { parseSMSTransaction } from '../utils/smsParser';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getCategoryById } from '../utils/categories';
import { useNativeFeatures } from '../hooks/useNativeFeatures';
import { useCurrency } from '../hooks/useCurrency';
import { 
  MessageSquare, 
  Upload, 
  Check, 
  X, 
  AlertCircle, 
  Smartphone,
  FileText,
  TrendingUp,
  TrendingDown,
  Zap,
  RefreshCw,
  Shield,
  CheckCircle
} from 'lucide-react';

interface SMSParserProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  currency?: any;
}

const SMSParser: React.FC<SMSParserProps> = ({ onAddTransaction }) => {
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>([]);
  const [parsedTransactions, setParsedTransactions] = useState<(Partial<Transaction> & { smsId: string })[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSMS, setIsLoadingSMS] = useState(false);

  const { isNative, hasSMSPermission, readSMSMessages } = useNativeFeatures();
  const { currency } = useCurrency();

  useEffect(() => {
    // Auto-load SMS if we have permission
    if (hasSMSPermission) {
      loadSMSMessages();
    }
  }, [hasSMSPermission]);

  const loadSMSMessages = async () => {
    if (!hasSMSPermission) return;

    setIsLoadingSMS(true);
    try {
      const messages = await readSMSMessages();
      setSmsMessages(messages);
      
      // Auto-parse messages
      const parsed = messages.map(msg => {
        const transaction = parseSMSTransaction(msg.content, msg.sender);
        return transaction ? { ...transaction, smsId: msg.id } : null;
      }).filter(Boolean) as (Partial<Transaction> & { smsId: string })[];
      
      setParsedTransactions(parsed);
    } catch (error) {
      console.error('Error loading SMS messages:', error);
    } finally {
      setIsLoadingSMS(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      try {
        // Try to parse different SMS backup formats
        let messages: SMSMessage[] = [];
        
        if (file.name.endsWith('.json')) {
          // JSON format
          const data = JSON.parse(content);
          messages = Array.isArray(data) ? data : data.messages || [];
        } else if (file.name.endsWith('.xml')) {
          // XML format (basic parsing)
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');
          const smsElements = xmlDoc.getElementsByTagName('sms');
          
          messages = Array.from(smsElements).map((sms, index) => ({
            id: `imported_${index}`,
            content: sms.getAttribute('body') || '',
            sender: sms.getAttribute('address') || 'Unknown',
            timestamp: new Date(parseInt(sms.getAttribute('date') || '0')).toISOString()
          }));
        } else {
          // Plain text format
          const lines = content.split('\n').filter(line => line.trim());
          messages = lines.map((line, index) => ({
            id: `text_${index}`,
            content: line.trim(),
            sender: 'Imported',
            timestamp: new Date().toISOString()
          }));
        }

        // Filter for potential bank SMS
        const bankMessages = messages.filter(msg => 
          msg.content.toLowerCase().includes('rs') ||
          msg.content.toLowerCase().includes('₹') ||
          msg.content.toLowerCase().includes('debit') ||
          msg.content.toLowerCase().includes('credit') ||
          msg.content.toLowerCase().includes('bank') ||
          msg.sender.toLowerCase().includes('bank')
        );

        setSmsMessages(bankMessages);
        
        // Auto-parse imported messages
        const parsed = bankMessages.map(msg => {
          const transaction = parseSMSTransaction(msg.content, msg.sender);
          return transaction ? { ...transaction, smsId: msg.id } : null;
        }).filter(Boolean) as (Partial<Transaction> & { smsId: string })[];
        
        setParsedTransactions(parsed);
        
      } catch (error) {
        console.error('Error parsing file:', error);
        alert('Error parsing the uploaded file. Please check the format.');
      }
      
      setIsProcessing(false);
    };
    
    reader.readAsText(file);
  };

  const handleSelectMessage = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleImportSelected = () => {
    parsedTransactions
      .filter(t => selectedMessages.has(t.smsId))
      .forEach(transaction => {
        const { smsId, ...transactionData } = transaction;
        onAddTransaction({
          ...transactionData,
          date: transactionData.date || new Date().toISOString().split('T')[0]
        } as Omit<Transaction, 'id' | 'createdAt'>);
      });
    
    // Mark messages as parsed
    setSmsMessages(prev => 
      prev.map(msg => 
        selectedMessages.has(msg.id) 
          ? { ...msg, parsed: true }
          : msg
      )
    );
    
    setSelectedMessages(new Set());
  };

  const stats = {
    total: smsMessages.length,
    parsed: smsMessages.filter(m => m.parsed).length,
    pending: parsedTransactions.length,
    income: parsedTransactions.filter(t => t.type === 'income').length,
    expenses: parsedTransactions.filter(t => t.type === 'expense').length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">SMS Transaction Parser</h1>
          <p className="text-gray-600 dark:text-gray-400">Automatically extract transactions from bank SMS messages</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload SMS Backup</span>
            <input
              type="file"
              accept=".txt,.xml,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          {hasSMSPermission && (
            <button
              onClick={loadSMSMessages}
              disabled={isLoadingSMS}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingSMS ? 'animate-spin' : ''}`} />
              <span>Refresh SMS</span>
            </button>
          )}
          {selectedMessages.size > 0 && (
            <button
              onClick={handleImportSelected}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Check className="w-4 h-4" />
              <span>Import Selected ({selectedMessages.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Status */}
      {isNative && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${hasSMSPermission ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
              {hasSMSPermission ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-gray-900 dark:text-white font-medium">
                SMS Permission: {hasSMSPermission ? 'Granted' : 'Required'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasSMSPermission 
                  ? 'You can now read SMS messages automatically'
                  : 'SMS permission is needed to read messages automatically'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total SMS</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Parsed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.parsed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Income</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.income}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.expenses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Smartphone className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">How to Import SMS Messages</h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              {isNative ? (
                <>
                  <p>1. {hasSMSPermission ? 'SMS permission granted - use "Refresh SMS" to load messages' : 'SMS permission will be requested automatically on app start'}</p>
                  <p>2. Or export your SMS messages from your phone (XML, JSON, or TXT format)</p>
                  <p>3. Upload the file using the "Upload SMS Backup" button</p>
                  <p>4. Review the automatically parsed transactions below</p>
                  <p>5. Select the transactions you want to import and click "Import Selected"</p>
                </>
              ) : (
                <>
                  <p>1. Export your SMS messages from your phone (usually in XML, JSON, or TXT format)</p>
                  <p>2. Upload the file using the "Upload SMS Backup" button above</p>
                  <p>3. Review the automatically parsed transactions below</p>
                  <p>4. Select the transactions you want to import and click "Import Selected"</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parsed Transactions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl backdrop-blur-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detected Transactions</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Review and import transactions found in SMS messages</p>
        </div>
        
        {isProcessing || isLoadingSMS ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {isProcessing ? 'Processing SMS messages...' : 'Loading SMS messages...'}
            </p>
          </div>
        ) : parsedTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No transactions detected</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {!hasSMSPermission && isNative 
                ? 'SMS permission is required to read messages automatically, or upload an SMS backup file'
                : 'Upload an SMS backup file or use "Refresh SMS" to get started'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {parsedTransactions.map((transaction, index) => {
              const smsMessage = smsMessages.find(m => m.id === transaction.smsId);
              const category = getCategoryById(transaction.category || '');
              const isSelected = selectedMessages.has(transaction.smsId);
              
              return (
                <div 
                  key={index}
                  className={`p-6 transition-colors ${
                    isSelected ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectMessage(transaction.smsId)}
                      className="mt-1 rounded border-gray-400 dark:border-gray-600 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-gray-700"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${
                            transaction.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'
                          } flex items-center justify-center`}>
                            {transaction.type === 'income' ? (
                              <TrendingUp className="w-5 h-5 text-white" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{transaction.description}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{category?.name || 'Uncategorized'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xl font-bold ${
                            transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount || 0, currency)}
                          </span>
                          {transaction.merchant && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.merchant}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{smsMessage?.sender}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {smsMessage && formatDate(smsMessage.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {smsMessage?.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSParser;