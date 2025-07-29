import { useState, useEffect } from 'react';
import { Asset } from '../types';

// Mock asset data - in production, this would come from CoinGecko API or similar
const MOCK_ASSETS: Asset[] = [
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2150.45,
    change24h: 2.34,
    chainlinkFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306'
  },
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.12,
    change24h: -1.23,
    chainlinkFeed: '0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43'
  },
  {
    id: 'chainlink',
    symbol: 'LINK',
    name: 'Chainlink',
    price: 14.67,
    change24h: 5.67,
    chainlinkFeed: '0xc59E3633BAAC79493d908e63626716e204A45EdF'
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    price: 98.34,
    change24h: 3.45
  },
  {
    id: 'cardano',
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.52,
    change24h: -2.1
  },
  {
    id: 'polygon',
    symbol: 'MATIC',
    name: 'Polygon',
    price: 0.89,
    change24h: 1.87
  },
  {
    id: 'avalanche',
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 36.78,
    change24h: 4.23
  },
  {
    id: 'uniswap',
    symbol: 'UNI',
    name: 'Uniswap',
    price: 6.45,
    change24h: -0.87
  }
];

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API call
    const fetchAssets = async () => {
      try {
        setLoading(true);
        // In production, replace with actual API call:
        // const response = await fetch('/api/assets');
        // const data = await response.json();
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAssets(MOCK_ASSETS);
        setError(null);
      } catch (err) {
        setError('Failed to fetch assets');
        console.error('Error fetching assets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
    
    // Refresh prices every 30 seconds
    const interval = setInterval(() => {
      setAssets(prev => prev.map(asset => ({
        ...asset,
        price: asset.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% random change
        change24h: asset.change24h + (Math.random() - 0.5) * 0.5
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getAssetBySymbol = (symbol: string) => {
    return assets.find(asset => asset.symbol === symbol);
  };

  const searchAssets = (query: string) => {
    if (!query) return assets;
    const lowercaseQuery = query.toLowerCase();
    return assets.filter(asset => 
      asset.symbol.toLowerCase().includes(lowercaseQuery) ||
      asset.name.toLowerCase().includes(lowercaseQuery)
    );
  };

  return {
    assets,
    loading,
    error,
    getAssetBySymbol,
    searchAssets
  };
}