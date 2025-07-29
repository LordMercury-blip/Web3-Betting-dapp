import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ClockIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { BETTING_CONTRACT_ABI, BETTING_CONTRACT_ADDRESS, createCommitHash, formatPrice, calculatePayout } from '../utils/contract';
import { Asset, TimeframeOption } from '../types';
import { useAssets } from '../hooks/useAssets';
import { useTimeframes, TIMEFRAME_OPTIONS } from '../hooks/useTimeframes';
import AssetSelect from './ui/AssetSelect';
import Select from './ui/Select';
import Input from './ui/Input';
import Button from './ui/Button';
import clsx from 'clsx';

export default function BettingInterface() {
  const { address, isConnected } = useAccount();
  const { assets, getAssetBySymbol } = useAssets();
  const { formatTimeframe } = useTimeframes();
  
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<number>(300); // 5 minutes
  const [betAmountUSD, setBetAmountUSD] = useState('10');
  const [betDirection, setBetDirection] = useState<'up' | 'down' | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Initialize with ETH as default
  useEffect(() => {
    if (assets.length > 0 && !selectedAsset) {
      const ethAsset = getAssetBySymbol('ETH');
      if (ethAsset) setSelectedAsset(ethAsset);
    }
  }, [assets, selectedAsset, getAssetBySymbol]);

  // Calculate crypto amount from USD
  const betAmountCrypto = useMemo(() => {
    if (!selectedAsset || !betAmountUSD) return '0';
    const usdAmount = parseFloat(betAmountUSD);
    if (isNaN(usdAmount) || usdAmount <= 0) return '0';
    return (usdAmount / selectedAsset.price).toFixed(6);
  }, [selectedAsset, betAmountUSD]);

  // Get current price from contract
  const { data: priceData, isLoading: isPriceLoading } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_CONTRACT_ABI,
    functionName: 'getCurrentPrice',
    args: [selectedAsset?.symbol || 'ETH'],
    query: {
      refetchInterval: 5000,
      enabled: !!selectedAsset,
    },
  });

  const currentPrice = priceData ? formatPrice(priceData[0]) : selectedAsset ? `$${selectedAsset.price.toLocaleString()}` : '$0.00';

  // Contract write setup
  const nonce = Math.random().toString();
  const commitHash = betDirection && address ? 
    createCommitHash(betDirection === 'up', nonce, address) : 
    '0x0000000000000000000000000000000000000000000000000000000000000000';

  const { writeContract: placeBet, isPending: isWriteLoading } = useWriteContract({
    onSuccess: (data) => {
      toast.success('Bet placed! Revealing direction...');
      // Reset form
      setBetDirection(null);
      setBetAmountUSD('10');
    },
    onError: (error) => {
      toast.error('Failed to place bet: ' + error.message);
      setIsPlacingBet(false);
    },
  });

  const handlePlaceBet = async () => {
    if (!betDirection || !isConnected || !selectedAsset) return;
    
    setIsPlacingBet(true);
    try {
      placeBet({
        address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
        abi: BETTING_CONTRACT_ABI,
        functionName: 'placeBet',
        args: [selectedAsset.symbol, selectedTimeframe, commitHash],
        value: betAmountCrypto ? ethers.parseEther(betAmountCrypto) : undefined,
      });
    } catch (error) {
      console.error('Betting error:', error);
      setIsPlacingBet(false);
    }
  };

  const potentialPayout = calculatePayout(betAmountCrypto);

  return (
    <div className="space-y-8">
      {/* Current Price Display */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Live Prices</h2>
          <div className="flex items-center space-x-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Live</span>
          </div>
        </div>
        
        {selectedAsset && (
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {selectedAsset.symbol.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedAsset.symbol}</h3>
                  <p className="text-sm text-gray-400">{selectedAsset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {isPriceLoading ? (
                    <div className="animate-pulse bg-gray-600 h-8 w-24 rounded"></div>
                  ) : (
                    currentPrice
                  )}
                </div>
                <div className={clsx(
                  'text-sm font-medium',
                  selectedAsset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Betting Form */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-2xl font-bold text-white mb-6">Place Your Bet</h3>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Form Inputs */}
          <div className="space-y-6">
            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Asset
              </label>
              <AssetSelect
                value={selectedAsset}
                onChange={setSelectedAsset}
              />
            </div>

            {/* Bet Amount in USD */}
            <div>
              <Input
                label="Bet Amount (USD)"
                type="number"
                value={betAmountUSD}
                onChange={(e) => setBetAmountUSD(e.target.value)}
                min="1"
                max="10000"
                step="1"
                placeholder="10"
                leftIcon={<CurrencyDollarIcon className="w-5 h-5" />}
                helperText={selectedAsset ? `≈ ${betAmountCrypto} ${selectedAsset.symbol}` : ''}
              />
            </div>

            {/* Timeframe Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timeframe
              </label>
              <Select
                value={selectedTimeframe}
                onChange={setSelectedTimeframe}
                options={TIMEFRAME_OPTIONS.map(option => ({
                  label: option.label,
                  value: option.value,
                  category: option.category
                }))}
                groupByCategory={true}
                placeholder="Select timeframe..."
              />
            </div>
          </div>

          {/* Right Column - Direction & Summary */}
          <div className="space-y-6">
            {/* Direction Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Price Direction
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={betDirection === 'up' ? 'primary' : 'outline'}
                  onClick={() => setBetDirection('up')}
                  className="h-16 flex-col space-y-1"
                >
                  <ArrowTrendingUpIcon className="w-6 h-6 text-green-400" />
                  <span className="font-semibold">UP</span>
                </Button>

                <Button
                  variant={betDirection === 'down' ? 'primary' : 'outline'}
                  onClick={() => setBetDirection('down')}
                  className="h-16 flex-col space-y-1"
                >
                  <ArrowTrendingDownIcon className="w-6 h-6 text-red-400" />
                  <span className="font-semibold">DOWN</span>
                </Button>
              </div>
            </div>

            {/* Bet Summary */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h4 className="font-semibold text-white mb-4">Bet Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Asset:</span>
                  <span className="text-white">{selectedAsset?.symbol || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount (USD):</span>
                  <span className="text-white">${betAmountUSD}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount (Crypto):</span>
                  <span className="text-white">{betAmountCrypto} {selectedAsset?.symbol || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Timeframe:</span>
                  <span className="text-white">{formatTimeframe(selectedTimeframe)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Direction:</span>
                  <span className={`font-semibold ${
                    betDirection === 'up' ? 'text-green-400' : 
                    betDirection === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {betDirection ? betDirection.toUpperCase() : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Potential Payout:</span>
                  <span className="text-green-400 font-semibold">{potentialPayout} {selectedAsset?.symbol || 'ETH'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Place Bet Button */}
        <div className="mt-8">
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlaceBet}
            disabled={!isConnected || !betDirection || !selectedAsset || isPlacingBet || isWriteLoading || parseFloat(betAmountUSD) <= 0}
            loading={isPlacingBet || isWriteLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {!isConnected ? (
              'Connect Wallet to Bet'
            ) : isPlacingBet || isWriteLoading ? (
              'Placing Bet...'
            ) : (
              <>
                <BoltIcon className="w-5 h-5" />
                <span>Place Bet</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}