import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const CRYPTO_CONFIG = {
  ETH: { id: 'ethereum', symbol: 'Ξ', name: 'Ethereum' },
  BTC: { id: 'bitcoin', symbol: '₿', name: 'Bitcoin' },
  SOL: { id: 'solana', symbol: 'S', name: 'Solana' },
  MATIC: { id: 'matic-network', symbol: 'M', name: 'Polygon' },
  USDC: { id: 'usd-coin', symbol: '$', name: 'USD Coin' }
};

export const CurrencyProvider = ({ children }) => {
  const [selectedCrypto, setSelectedCrypto] = useState(localStorage.getItem('displayCrypto') || 'ETH');
  const [rates, setRates] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRates = async () => {
    try {
      setIsLoading(true);
      const ids = Object.values(CRYPTO_CONFIG).map(c => c.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr`
      );
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error('Error fetching crypto rates:', error);
      // Fallback rates in case API fails
      setRates({
        ethereum: { inr: 300000 },
        bitcoin: { inr: 6000000 },
        solana: { inr: 12000 },
        'matic-network': { inr: 60 },
        'usd-coin': { inr: 83 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Refresh rates every 5 minutes
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('displayCrypto', selectedCrypto);
  }, [selectedCrypto]);

  const convertInrToCrypto = (inrAmount, cryptoKey) => {
    if (!rates) return '...';
    const cryptoId = CRYPTO_CONFIG[cryptoKey].id;
    const rate = rates[cryptoId]?.inr;
    if (!rate) return '...';
    
    const amount = inrAmount / rate;
    // Format based on value
    if (amount < 0.0001) return amount.toFixed(8);
    if (amount < 0.01) return amount.toFixed(6);
    return amount.toFixed(4);
  };

  return (
    <CurrencyContext.Provider value={{ 
      selectedCrypto, 
      setSelectedCrypto, 
      convertInrToCrypto, 
      rates, 
      isLoading,
      cryptoList: Object.keys(CRYPTO_CONFIG)
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
