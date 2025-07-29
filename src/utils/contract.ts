import { ethers } from 'ethers';

// Contract ABI (simplified for key functions)
export const BETTING_CONTRACT_ABI = [
  // Read functions
  "function getCurrentPrice(string memory token) public view returns (uint256 price, uint256 timestamp)",
  "function bets(uint256) public view returns (address bettor, string token, uint256 amount, bool isUpBet, uint256 startPrice, uint256 endPrice, uint256 startTime, uint256 duration, bool isSettled, bool isWinner, bytes32 commitHash, bool isRevealed)",
  "function getUserStats(address user) external view returns (uint256 totalBets, uint256 totalWins, uint256 totalWagered, uint256 totalWon, uint256 winRate)",
  "function getUserBets(address user) external view returns (uint256[] memory)",
  "function getContractInfo() external view returns (uint256 balance, uint256 totalVol, uint256 totalBets)",
  
  // Write functions
  "function placeBet(string memory token, uint256 duration, bytes32 commitHash) external payable",
  "function revealBet(uint256 betId, bool isUpBet, uint256 nonce) external",
  "function settleBet(uint256 betId) external",
  
  // Events
  "event BetPlaced(uint256 indexed betId, address indexed bettor, string token, uint256 amount, uint256 duration, bytes32 commitHash)",
  "event BetRevealed(uint256 indexed betId, bool isUpBet, uint256 startPrice)",
  "event BetSettled(uint256 indexed betId, address indexed bettor, bool isWinner, uint256 payout)"
];

// Contract address (replace with your deployed contract)
export const BETTING_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

// Supported tokens with their symbols
export const SUPPORTED_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', decimals: 8 },
  { symbol: 'BTC', name: 'Bitcoin', decimals: 8 },
  { symbol: 'LINK', name: 'Chainlink', decimals: 8 },
];

// Betting durations
export const BETTING_DURATIONS = [
  { label: '5 minutes', value: 300, seconds: 300 },
  { label: '15 minutes', value: 900, seconds: 900 },
  { label: '1 hour', value: 3600, seconds: 3600 },
];

// Helper function to create commit hash
export function createCommitHash(isUpBet: boolean, nonce: string, address: string): string {
  return ethers.keccak256(
    ethers.solidityPacked(
      ['bool', 'uint256', 'address'],
      [isUpBet, nonce, address]
    )
  );
}

// Helper function to format price
export function formatPrice(price: bigint, decimals: number = 8): string {
  const divisor = BigInt(10 ** decimals);
  const dollars = price / divisor;
  const cents = ((price % divisor) * BigInt(100)) / divisor;
  return `$${dollars.toString()}.${cents.toString().padStart(2, '0')}`;
}

// Helper function to calculate potential payout
export function calculatePayout(betAmount: string, houseEdge: number = 2): string {
  const amount = parseFloat(betAmount);
  const multiplier = (100 - houseEdge) / 100;
  const payout = amount + (amount * multiplier);
  return payout.toFixed(4);
}