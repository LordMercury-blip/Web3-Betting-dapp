import React, { useState, useMemo } from 'react';
import { ClockIcon, CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useBetting } from '../context/BettingContext';
import { useTimeframes } from '../hooks/useTimeframes';
import { Bet } from '../types';
import Button from './ui/Button';
import Select from './ui/Select';
import clsx from 'clsx';

// Mock bet data - replace with real data from your backend
const mockBets: Bet[] = [
  {
    id: '1',
    asset: {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2150.45,
      change24h: 2.34
    },
    direction: 'up',
    amountUSD: 50,
    amountCrypto: 0.0232,
    timeframe: 300,
    startPrice: 2145.30,
    endPrice: 2167.80,
    startTime: Date.now() - 600000,
    endTime: Date.now() - 300000,
    status: 'won',
    payout: 0.0455,
    txHash: '0x1234567890abcdef1234567890abcdef12345678'
  },
  {
    id: '2',
    asset: {
      id: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.12,
      change24h: -1.23
    },
    direction: 'down',
    amountUSD: 25,
    amountCrypto: 0.000578,
    timeframe: 900,
    startPrice: 43180.50,
    endPrice: 43095.20,
    startTime: Date.now() - 1200000,
    endTime: Date.now() - 300000,
    status: 'won',
    payout: 0.001134,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef12'
  },
  {
    id: '3',
    asset: {
      id: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2150.45,
      change24h: 2.34
    },
    direction: 'up',
    amountUSD: 100,
    amountCrypto: 0.0465,
    timeframe: 1800,
    startPrice: 2140.00,
    endPrice: 2125.50,
    startTime: Date.now() - 2400000,
    endTime: Date.now() - 600000,
    status: 'lost',
    txHash: '0xfedcba0987654321fedcba0987654321fedcba09'
  },
  {
    id: '4',
    asset: {
      id: 'chainlink',
      symbol: 'LINK',
      name: 'Chainlink',
      price: 14.67,
      change24h: 5.67
    },
    direction: 'up',
    amountUSD: 75,
    amountCrypto: 5.12,
    timeframe: 600,
    startPrice: 14.45,
    startTime: Date.now() - 300000,
    endTime: Date.now() + 300000,
    status: 'active',
    txHash: '0x567890abcdef1234567890abcdef1234567890ab'
  }
];

export default function BetHistory() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'won' | 'lost'>('all');
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const { getTimeRemaining, formatTimeframe } = useTimeframes();

  const statusOptions = [
    { label: 'All Bets', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Won', value: 'won' },
    { label: 'Lost', value: 'lost' }
  ];

  const filteredBets = useMemo(() => {
    if (statusFilter === 'all') return mockBets;
    return mockBets.filter(bet => bet.status === statusFilter);
  }, [statusFilter]);

  const getStatusIcon = (status: Bet['status']) => {
    switch (status) {
      case 'active':
        return <ClockIcon className="w-5 h-5 text-blue-400" />;
      case 'won':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
      case 'lost':
        return <XCircleIcon className="w-5 h-5 text-red-400" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Bet['status']) => {
    switch (status) {
      case 'active':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'won':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'lost':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const calculateProfit = (bet: Bet) => {
    if (bet.status === 'won' && bet.payout) {
      return bet.payout - bet.amountCrypto;
    } else if (bet.status === 'lost') {
      return -bet.amountCrypto;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Bet History</h2>
          <p className="text-gray-400 mt-1">Track your betting performance and outcomes</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-40"
          />
        </div>
      </div>

      {/* Bet List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredBets.map((bet) => (
            <motion.div
              key={bet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Asset Info */}
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {bet.asset.symbol.slice(0, 2)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-white">{bet.asset.symbol}</h3>
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        bet.direction === 'up' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                      )}>
                        {bet.direction.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                      <span>${bet.amountUSD}</span>
                      <span>•</span>
                      <span>{formatTimeframe(bet.timeframe)}</span>
                      <span>•</span>
                      <span>{new Date(bet.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Status */}
                  <div className={clsx(
                    'flex items-center space-x-2 px-3 py-1 rounded-full border text-sm font-medium',
                    getStatusColor(bet.status)
                  )}>
                    {getStatusIcon(bet.status)}
                    <span className="capitalize">{bet.status}</span>
                  </div>

                  {/* Time Remaining (for active bets) */}
                  {bet.status === 'active' && (
                    <div className="text-sm text-blue-400 font-medium">
                      {getTimeRemaining(bet.endTime)}
                    </div>
                  )}

                  {/* Profit/Loss */}
                  {bet.status !== 'active' && (
                    <div className={clsx(
                      'text-sm font-semibold',
                      bet.status === 'won' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {bet.status === 'won' ? '+' : ''}{calculateProfit(bet).toFixed(4)} {bet.asset.symbol}
                    </div>
                  )}

                  {/* View Details Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedBet(bet)}
                    className="p-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Price Info */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Start Price</div>
                    <div className="text-white font-medium">${bet.startPrice.toLocaleString()}</div>
                  </div>
                  {bet.endPrice && (
                    <div>
                      <div className="text-gray-400">End Price</div>
                      <div className="text-white font-medium">${bet.endPrice.toLocaleString()}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-gray-400">Amount</div>
                    <div className="text-white font-medium">{bet.amountCrypto.toFixed(4)} {bet.asset.symbol}</div>
                  </div>
                  {bet.payout && (
                    <div>
                      <div className="text-gray-400">Payout</div>
                      <div className="text-green-400 font-medium">{bet.payout.toFixed(4)} {bet.asset.symbol}</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredBets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No bets found</h3>
            <p className="text-gray-400">
              {statusFilter === 'all' 
                ? "You haven't placed any bets yet. Start betting to see your history here."
                : `No ${statusFilter} bets found. Try changing the filter.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Bet Details Modal */}
      <AnimatePresence>
        {selectedBet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedBet(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Bet Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBet(null)}
                  className="p-2"
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {selectedBet.asset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{selectedBet.asset.name}</div>
                    <div className="text-gray-400 text-sm">{selectedBet.asset.symbol}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Direction</div>
                    <div className={clsx(
                      'font-semibold',
                      selectedBet.direction === 'up' ? 'text-green-400' : 'text-red-400'
                    )}>
                      {selectedBet.direction.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">Status</div>
                    <div className="text-white font-semibold capitalize">{selectedBet.status}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Amount (USD)</div>
                    <div className="text-white font-semibold">${selectedBet.amountUSD}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Amount (Crypto)</div>
                    <div className="text-white font-semibold">{selectedBet.amountCrypto.toFixed(4)} {selectedBet.asset.symbol}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Timeframe</div>
                    <div className="text-white font-semibold">{formatTimeframe(selectedBet.timeframe)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Start Price</div>
                    <div className="text-white font-semibold">${selectedBet.startPrice.toLocaleString()}</div>
                  </div>
                  {selectedBet.endPrice && (
                    <>
                      <div>
                        <div className="text-gray-400">End Price</div>
                        <div className="text-white font-semibold">${selectedBet.endPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Price Change</div>
                        <div className={clsx(
                          'font-semibold',
                          selectedBet.endPrice > selectedBet.startPrice ? 'text-green-400' : 'text-red-400'
                        )}>
                          {selectedBet.endPrice > selectedBet.startPrice ? '+' : ''}
                          {((selectedBet.endPrice - selectedBet.startPrice) / selectedBet.startPrice * 100).toFixed(2)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {selectedBet.payout && (
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Payout</span>
                      <span className="text-green-400 font-semibold text-lg">
                        {selectedBet.payout.toFixed(4)} {selectedBet.asset.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400">Profit</span>
                      <span className={clsx(
                        'font-semibold',
                        calculateProfit(selectedBet) >= 0 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {calculateProfit(selectedBet) >= 0 ? '+' : ''}{calculateProfit(selectedBet).toFixed(4)} {selectedBet.asset.symbol}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-800">
                  <div className="text-gray-400 text-xs">Transaction Hash</div>
                  <div className="text-white font-mono text-sm break-all">{selectedBet.txHash}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}