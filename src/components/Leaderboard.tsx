import React, { useState, useMemo } from 'react';
import { TrophyIcon, UserIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolid } from '@heroicons/react/24/solid';
import { useBetting } from '../context/BettingContext';
import Button from './ui/Button';
import clsx from 'clsx';

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState('all');
  const [sortBy, setSortBy] = useState<'winRate' | 'totalWon' | 'totalBets'>('winRate');
  const { userStats } = useBetting();

  // Mock leaderboard data
  const allPlayers = [
    {
      rank: 1,
      address: '0x1234...5678',
      totalWins: 45,
      totalBets: 52,
      winRate: 86.5,
      totalWon: 15.2,
      totalWagered: 12.5,
      avatar: '🦄',
    },
    {
      rank: 2,
      address: '0xabcd...efgh',
      totalWins: 38,
      totalBets: 48,
      winRate: 79.2,
      totalWon: 11.3,
      totalWagered: 8.7,
      avatar: '🚀',
    },
    {
      rank: 3,
      address: '0x9876...5432',
      totalWins: 42,
      totalBets: 55,
      winRate: 76.4,
      totalWon: 9.8,
      totalWagered: 7.2,
      avatar: '⚡',
    },
    {
      rank: 4,
      address: '0xfedc...ba98',
      totalWins: 35,
      totalBets: 47,
      winRate: 74.5,
      totalWon: 8.1,
      totalWagered: 6.1,
      avatar: '🔥',
    },
    {
      rank: 5,
      address: '0x5555...aaaa',
      totalWins: 28,
      totalBets: 40,
      winRate: 70.0,
      totalWon: 6.8,
      totalWagered: 4.8,
      avatar: '💎',
    },
    {
      rank: 6,
      address: '0x7777...bbbb',
      totalWins: 22,
      totalBets: 35,
      winRate: 62.9,
      totalWon: 4.2,
      totalWagered: 3.8,
      avatar: '🎯',
    },
    {
      rank: 7,
      address: '0x8888...cccc',
      totalWins: 18,
      totalBets: 30,
      winRate: 60.0,
      totalWon: 3.5,
      totalWagered: 3.2,
      avatar: '🌟',
    },
  ];

  const sortedLeaderboard = useMemo(() => {
    const sorted = [...allPlayers].sort((a, b) => {
      switch (sortBy) {
        case 'totalWon':
          return b.totalWon - a.totalWon;
        case 'totalBets':
          return b.totalBets - a.totalBets;
        default: // winRate
          return b.winRate - a.winRate;
      }
    });
    
    // Update ranks based on sort
    return sorted.map((player, index) => ({
      ...player,
      rank: index + 1
    }));
  }, [sortBy]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <TrophySolid className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <TrophySolid className="w-6 h-6 text-gray-300" />;
      case 3:
        return <TrophySolid className="w-6 h-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 flex items-center justify-center text-gray-400 font-bold text-sm">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-yellow-400/30 bg-yellow-400/5';
      case 2:
        return 'border-gray-300/30 bg-gray-300/5';
      case 3:
        return 'border-amber-600/30 bg-amber-600/5';
      default:
        return 'border-gray-700 bg-gray-800';
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="flex flex-col space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
            <TrophyIcon className="w-6 h-6 text-yellow-400" />
            <span>Leaderboard</span>
          </h3>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Timeframe Filter */}
          <div className="flex space-x-2">
            {['today', 'week', 'all'].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className="capitalize"
              >
                {tf}
              </Button>
            ))}
          </div>
          
          {/* Sort Options */}
          <div className="flex space-x-2">
            <Button
              variant={sortBy === 'winRate' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('winRate')}
            >
              Win Rate
            </Button>
            <Button
              variant={sortBy === 'totalWon' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('totalWon')}
            >
              Total Won
            </Button>
            <Button
              variant={sortBy === 'totalBets' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('totalBets')}
            >
              Total Bets
            </Button>
          </div>
        </div>
      </div>

      {/* Your Stats */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-4 mb-6 border border-blue-500/30">
        <div className="flex items-center space-x-3 mb-3">
          <UserIcon className="w-5 h-5 text-blue-400" />
          <span>Leaderboard</span>
          <span className="text-blue-400 font-semibold">Your Stats</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Win Rate</div>
            <div className="text-white font-semibold">{userStats.winRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-gray-400">Total Bets</div>
            <div className="text-white font-semibold">{userStats.totalBets}</div>
          </div>
          <div>
            <div className="text-gray-400">Total Won</div>
            <div className="text-white font-semibold">{parseFloat(userStats.totalWon).toFixed(2)} ETH</div>
          </div>
          <div>
            <div className="text-gray-400">Profit</div>
            <div className={clsx(
              'font-semibold',
              (parseFloat(userStats.totalWon) - parseFloat(userStats.totalWagered)) >= 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {(parseFloat(userStats.totalWon) - parseFloat(userStats.totalWagered)).toFixed(2)} ETH
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {sortedLeaderboard.slice(0, 10).map((player) => (
          <div
            key={player.address}
            className={clsx(
              'rounded-xl p-4 border transition-all',
              getRankColor(player.rank)
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10">
                  {getRankIcon(player.rank)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{player.avatar}</span>
                  <div>
                    <div className="text-white font-semibold">
                      {player.address}
                    </div>
                    <div className="text-gray-400 text-xs">
                      {player.totalWins}/{player.totalBets} wins
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="flex items-center justify-end space-x-1">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-semibold">{player.winRate.toFixed(1)}%</span>
                </div>
                <div className="text-gray-300 text-sm">
                  {sortBy === 'totalWon' && `${player.totalWon.toFixed(1)} ETH won`}
                  {sortBy === 'totalBets' && `${player.totalBets} bets`}
                  {sortBy === 'winRate' && `+${(player.totalWon - player.totalWagered).toFixed(1)} ETH`}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-800">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">156</div>
          <div className="text-xs text-gray-400">Total Players</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">2.3k</div>
          <div className="text-xs text-gray-400">Total Bets</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">847</div>
          <div className="text-xs text-gray-400">ETH Volume</div>
        </div>
      </div>
    </div>
  );
}