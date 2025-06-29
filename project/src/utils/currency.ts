export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  'US': { code: 'USD', symbol: '$', name: 'US Dollar' },
  'IN': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  'GB': { code: 'GBP', symbol: '£', name: 'British Pound' },
  'EU': { code: 'EUR', symbol: '€', name: 'Euro' },
  'JP': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  'CA': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  'AU': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  'CN': { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  'KR': { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  'SG': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  'HK': { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  'CH': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  'SE': { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  'NO': { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  'DK': { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  'BR': { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  'MX': { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
  'RU': { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  'ZA': { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  'AE': { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  'SA': { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  'TH': { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  'MY': { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  'ID': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  'PH': { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
  'VN': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  'BD': { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka' },
  'PK': { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  'LK': { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee' },
  'NP': { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
  'EG': { code: 'EGP', symbol: '£', name: 'Egyptian Pound' },
  'NG': { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  'KE': { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  'GH': { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  'TZ': { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  'UG': { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  'ZM': { code: 'ZMW', symbol: 'ZK', name: 'Zambian Kwacha' },
  'ZW': { code: 'ZWL', symbol: 'Z$', name: 'Zimbabwean Dollar' },
  'DEFAULT': { code: 'USD', symbol: '$', name: 'US Dollar' }
};

export const detectUserCurrency = async (): Promise<CurrencyInfo> => {
  try {
    // Try to get user's location
    if ('geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Use reverse geocoding to get country
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
              );
              const data = await response.json();
              const countryCode = data.countryCode;
              
              const currency = CURRENCIES[countryCode] || CURRENCIES.DEFAULT;
              resolve(currency);
            } catch (error) {
              console.error('Error getting location data:', error);
              resolve(getCurrencyFromLocale());
            }
          },
          () => {
            // Fallback to locale-based detection
            resolve(getCurrencyFromLocale());
          },
          { timeout: 5000 }
        );
      });
    } else {
      return getCurrencyFromLocale();
    }
  } catch (error) {
    console.error('Error detecting currency:', error);
    return getCurrencyFromLocale();
  }
};

const getCurrencyFromLocale = (): CurrencyInfo => {
  try {
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1];
    
    if (region && CURRENCIES[region]) {
      return CURRENCIES[region];
    }
    
    // Fallback based on common locale patterns
    if (locale.startsWith('en-IN') || locale.startsWith('hi')) return CURRENCIES.IN;
    if (locale.startsWith('en-GB')) return CURRENCIES.GB;
    if (locale.startsWith('ja')) return CURRENCIES.JP;
    if (locale.startsWith('zh')) return CURRENCIES.CN;
    if (locale.startsWith('ko')) return CURRENCIES.KR;
    if (locale.startsWith('de') || locale.startsWith('fr') || locale.startsWith('es') || locale.startsWith('it')) return CURRENCIES.EU;
    
    return CURRENCIES.DEFAULT;
  } catch (error) {
    console.error('Error getting currency from locale:', error);
    return CURRENCIES.DEFAULT;
  }
};

export const formatCurrencyWithSymbol = (amount: number, currency: CurrencyInfo): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to manual formatting if Intl.NumberFormat fails
    return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
};