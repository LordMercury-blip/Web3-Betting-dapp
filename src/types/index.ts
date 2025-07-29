export interface Asset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon?: string;
  chainlinkFeed?: string;
}

export interface TimeframeOption {
  label: string;
  value: number; // in seconds
  category: 'quick' | 'standard' | 'extended';
}

export interface Bet {
  id: string;
  asset: Asset;
  direction: 'up' | 'down';
  amountUSD: number;
  amountCrypto: number;
  timeframe: number;
  startPrice: number;
  endPrice?: number;
  startTime: number;
  endTime: number;
  status: 'active' | 'won' | 'lost' | 'expired';
  payout?: number;
  txHash?: string;
}

export interface UserStats {
  totalBets: number;
  totalWins: number;
  totalWagered: number;
  totalWon: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
}