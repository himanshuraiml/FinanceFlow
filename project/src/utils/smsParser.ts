import { Transaction } from '../types';

// Enhanced SMS patterns for better detection
const SMS_PATTERNS = [
  // Debit/Purchase patterns
  {
    pattern: /(?:debited|spent|purchase|paid|debit)\s+(?:of\s+)?(?:rs\.?\s*|₹\s*|\$\s*)?([\d,]+\.?\d*)/i,
    type: 'expense' as const,
    amountGroup: 1
  },
  // Credit/Deposit patterns
  {
    pattern: /(?:credited|received|deposit|salary|credit)\s+(?:of\s+)?(?:rs\.?\s*|₹\s*|\$\s*)?([\d,]+\.?\d*)/i,
    type: 'income' as const,
    amountGroup: 1
  },
  // ATM withdrawal
  {
    pattern: /(?:atm|cash)\s+(?:withdrawal|wd|withdraw)\s+(?:of\s+)?(?:rs\.?\s*|₹\s*|\$\s*)?([\d,]+\.?\d*)/i,
    type: 'expense' as const,
    amountGroup: 1
  },
  // Transfer patterns
  {
    pattern: /(?:transferred|transfer|sent)\s+(?:rs\.?\s*|₹\s*|\$\s*)?([\d,]+\.?\d*)/i,
    type: 'expense' as const,
    amountGroup: 1
  },
  // UPI patterns
  {
    pattern: /(?:upi|paid via upi)\s+(?:rs\.?\s*|₹\s*|\$\s*)?([\d,]+\.?\d*)/i,
    type: 'expense' as const,
    amountGroup: 1
  },
  // Card payment patterns
  {
    pattern: /(?:card|pos)\s+(?:payment|transaction)\s+(?:of\s+)?(?:rs\.?\s*|₹\s*|\$\s*)?([\d,]+\.?\d*)/i,
    type: 'expense' as const,
    amountGroup: 1
  }
];

// Enhanced merchant extraction patterns
const MERCHANT_PATTERNS = [
  /(?:at|from|to)\s+([A-Z][A-Z0-9\s&.-]{2,30})/i,
  /(?:merchant|store):\s*([A-Z][A-Z0-9\s&.-]{2,30})/i,
  /(?:pos|card)\s+([A-Z][A-Z0-9\s&.-]{2,30})/i,
  /(?:upi)\s+([A-Z][A-Z0-9\s&.-]{2,30})/i,
  /(?:paid to|sent to)\s+([A-Z][A-Z0-9\s&.-]{2,30})/i
];

// Account extraction patterns
const ACCOUNT_PATTERNS = [
  /(?:a\/c|account|acc)\s*(?:no\.?\s*)?(\*+\d{4}|\d{4})/i,
  /(?:card|ending)\s*(\*+\d{4}|\d{4})/i
];

export const parseSMSTransaction = (smsContent: string, sender: string): Partial<Transaction> | null => {
  const content = smsContent.toLowerCase();
  
  // Enhanced filtering for financial SMS
  const financialKeywords = [
    'rs', '₹', '$', 'debit', 'credit', 'paid', 'received', 'bank', 'account',
    'transaction', 'payment', 'upi', 'atm', 'card', 'wallet', 'transfer'
  ];
  
  const hasFinancialKeyword = financialKeywords.some(keyword => 
    content.includes(keyword) || sender.toLowerCase().includes(keyword)
  );
  
  if (!hasFinancialKeyword) {
    return null;
  }

  let transactionType: 'income' | 'expense' | null = null;
  let amount: number | null = null;
  let merchant: string | null = null;
  let account: string | null = null;

  // Try to match transaction patterns
  for (const pattern of SMS_PATTERNS) {
    const match = smsContent.match(pattern.pattern);
    if (match) {
      transactionType = pattern.type;
      const amountStr = match[pattern.amountGroup].replace(/,/g, '');
      amount = parseFloat(amountStr);
      break;
    }
  }

  if (!transactionType || !amount || amount <= 0) {
    return null;
  }

  // Extract merchant
  for (const pattern of MERCHANT_PATTERNS) {
    const match = smsContent.match(pattern);
    if (match) {
      merchant = match[1].trim();
      // Clean up merchant name
      merchant = merchant.replace(/[^a-zA-Z0-9\s&.-]/g, '').trim();
      if (merchant.length > 30) {
        merchant = merchant.substring(0, 30).trim();
      }
      break;
    }
  }

  // Extract account info
  for (const pattern of ACCOUNT_PATTERNS) {
    const match = smsContent.match(pattern);
    if (match) {
      account = match[1];
      break;
    }
  }

  // Generate description
  let description = merchant || 'Transaction';
  if (transactionType === 'expense') {
    if (content.includes('atm') || content.includes('cash')) {
      description = 'ATM Withdrawal';
    } else if (content.includes('upi')) {
      description = merchant ? `UPI Payment to ${merchant}` : 'UPI Payment';
    } else if (content.includes('card')) {
      description = merchant ? `Card Payment at ${merchant}` : 'Card Payment';
    } else {
      description = merchant ? `Payment to ${merchant}` : 'Payment';
    }
  } else {
    if (content.includes('salary')) {
      description = 'Salary Credit';
    } else if (content.includes('transfer')) {
      description = merchant ? `Transfer from ${merchant}` : 'Transfer Received';
    } else {
      description = merchant ? `Payment from ${merchant}` : 'Credit';
    }
  }

  // Auto-categorize based on merchant or content
  let category = getAutoCategory(smsContent, merchant, transactionType);

  return {
    type: transactionType,
    amount,
    description,
    category,
    merchant: merchant || undefined,
    account: account || undefined,
    source: 'sms'
  };
};

const getAutoCategory = (content: string, merchant: string | null, type: 'income' | 'expense'): string => {
  const lowerContent = content.toLowerCase();
  const lowerMerchant = merchant?.toLowerCase() || '';

  if (type === 'income') {
    if (lowerContent.includes('salary') || lowerContent.includes('payroll')) return 'salary';
    if (lowerContent.includes('freelance') || lowerContent.includes('contract')) return 'freelance';
    if (lowerContent.includes('investment') || lowerContent.includes('dividend')) return 'investments';
    return 'other-income';
  }

  // Expense categorization with enhanced patterns
  if (lowerContent.includes('atm') || lowerContent.includes('cash')) return 'other-expense';
  
  // Transportation
  if (lowerMerchant.includes('uber') || lowerMerchant.includes('ola') || 
      lowerMerchant.includes('taxi') || lowerMerchant.includes('cab') ||
      lowerContent.includes('fuel') || lowerContent.includes('petrol') ||
      lowerContent.includes('diesel') || lowerMerchant.includes('metro')) return 'transportation';
  
  // Food & Dining
  if (lowerMerchant.includes('restaurant') || lowerMerchant.includes('cafe') || 
      lowerMerchant.includes('food') || lowerMerchant.includes('zomato') || 
      lowerMerchant.includes('swiggy') || lowerMerchant.includes('dominos') ||
      lowerMerchant.includes('mcdonald') || lowerMerchant.includes('kfc') ||
      lowerMerchant.includes('pizza') || lowerContent.includes('dining')) return 'food';
  
  // Shopping
  if (lowerMerchant.includes('amazon') || lowerMerchant.includes('flipkart') || 
      lowerMerchant.includes('myntra') || lowerMerchant.includes('ajio') ||
      lowerContent.includes('shopping') || lowerMerchant.includes('mall') ||
      lowerMerchant.includes('store')) return 'shopping';
  
  // Entertainment
  if (lowerMerchant.includes('netflix') || lowerMerchant.includes('spotify') || 
      lowerMerchant.includes('prime') || lowerMerchant.includes('hotstar') ||
      lowerContent.includes('subscription') || lowerContent.includes('movie') ||
      lowerMerchant.includes('cinema') || lowerMerchant.includes('theatre')) return 'entertainment';
  
  // Healthcare
  if (lowerContent.includes('medical') || lowerContent.includes('pharmacy') || 
      lowerContent.includes('hospital') || lowerContent.includes('doctor') ||
      lowerMerchant.includes('apollo') || lowerMerchant.includes('medplus')) return 'healthcare';
  
  // Utilities
  if (lowerContent.includes('electricity') || lowerContent.includes('water') ||
      lowerContent.includes('gas') || lowerContent.includes('internet') ||
      lowerContent.includes('mobile') || lowerContent.includes('recharge')) return 'utilities';

  return 'other-expense';
};