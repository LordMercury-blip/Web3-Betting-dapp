import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface PricePoint {
  time: string;
  price: number;
  timestamp: number;
}

interface PriceChartProps {
  token: string;
}

export default function PriceChart({ token }: PriceChartProps) {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [timeframe, setTimeframe] = useState('1H');

  // Simulate price data (in a real app, this would come from your backend or price API)
  useEffect(() => {
    const generateMockData = () => {
      const basePrice = token === 'ETH' ? 2000 : token === 'BTC' ? 35000 : 15;
      const data: PricePoint[] = [];
      const now = Date.now();
      
      for (let i = 60; i >= 0; i--) {
        const timestamp = now - (i * 60 * 1000); // 1 minute intervals
        const volatility = 0.02; // 2% volatility
        const randomChange = (Math.random() - 0.5) * volatility;
        const price = basePrice * (1 + randomChange * (i / 60)); // Add some trend
        
        data.push({
          time: new Date(timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          price: Math.round(price * 100) / 100,
          timestamp,
        });
      }
      
      setPriceData(data);
    };

    generateMockData();
    const interval = setInterval(generateMockData, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [token]);

  const currentPrice = priceData[priceData.length - 1]?.price || 0;
  const previousPrice = priceData[priceData.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = previousPrice ? (priceChange / previousPrice) * 100 : 0;

  return (
    <motion.div 
      className="bg-gray-800/50 backdrop-blur-md rounded-2xl p-6 border border-gray-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{token} Price Chart</h3>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-2xl font-bold text-white">
              ${currentPrice.toLocaleString()}
            </span>
            <span className={`text-sm font-semibold ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {['5M', '15M', '1H'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#8B5CF6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}