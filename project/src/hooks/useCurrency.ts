import { useState, useEffect } from 'react';
import { detectUserCurrency, CurrencyInfo, CURRENCIES } from '../utils/currency';

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyInfo>(CURRENCIES.DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        // Check if user has manually set a currency
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          const parsed = JSON.parse(savedCurrency);
          setCurrency(parsed);
          setIsLoading(false);
          return;
        }

        // Auto-detect currency based on location
        const detectedCurrency = await detectUserCurrency();
        setCurrency(detectedCurrency);
        
        // Save the detected currency
        localStorage.setItem('user_currency', JSON.stringify(detectedCurrency));
      } catch (error) {
        console.error('Error initializing currency:', error);
        setCurrency(CURRENCIES.DEFAULT);
      } finally {
        setIsLoading(false);
      }
    };

    initializeCurrency();
  }, []);

  const updateCurrency = (newCurrency: CurrencyInfo) => {
    setCurrency(newCurrency);
    localStorage.setItem('user_currency', JSON.stringify(newCurrency));
  };

  return {
    currency,
    isLoading,
    updateCurrency
  };
};