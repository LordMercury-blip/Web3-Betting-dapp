import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'ethers';
import { BETTING_CONTRACT_ABI, BETTING_CONTRACT_ADDRESS } from '../utils/contract';

interface BettingContextType {
  userStats: {
    totalBets: number;
    totalWins: number;
    totalWagered: string;
    totalWon: string;
    winRate: number;
  };
  contractInfo: {
    balance: string;
    totalVolume: string;
    totalBets: number;
  };
  refreshData: () => void;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

export function BettingProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // User stats
  const { data: userStatsData } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_CONTRACT_ABI,
    functionName: 'getUserStats',
    args: [address],
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Contract info
  const { data: contractInfoData } = useReadContract({
    address: BETTING_CONTRACT_ADDRESS as `0x${string}`,
    abi: BETTING_CONTRACT_ABI,
    functionName: 'getContractInfo',
  });

  const userStats = userStatsData ? {
    totalBets: Number(userStatsData[0]),
    totalWins: Number(userStatsData[1]),
    totalWagered: formatEther(userStatsData[2]),
    totalWon: formatEther(userStatsData[3]),
    winRate: Number(userStatsData[4]) / 100, // Convert from basis points
  } : {
    totalBets: 0,
    totalWins: 0,
    totalWagered: '0',
    totalWon: '0',
    winRate: 0,
  };

  const contractInfo = contractInfoData ? {
    balance: formatEther(contractInfoData[0]),
    totalVolume: formatEther(contractInfoData[1]),
    totalBets: Number(contractInfoData[2]),
  } : {
    balance: '0',
    totalVolume: '0',
    totalBets: 0,
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <BettingContext.Provider value={{
      userStats,
      contractInfo,
      refreshData,
    }}>
      {children}
    </BettingContext.Provider>
  );
}

export function useBetting() {
  const context = useContext(BettingContext);
  if (context === undefined) {
    throw new Error('useBetting must be used within a BettingProvider');
  }
  return context;
}