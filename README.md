# Web3 Betting DApp

A comprehensive full-stack Web3 betting application where users can bet on cryptocurrency price movements using Chainlink price feeds.

## Features

### 🎯 Core Functionality
- **Price Betting**: Bet on whether crypto token prices will go up or down
- **Multiple Timeframes**: 5 minutes, 15 minutes, 1 hour durations
- **Real-time Prices**: Chainlink oracle integration for ETH, BTC, and popular tokens
- **Wallet Integration**: MetaMask and WalletConnect support

### 🛡️ Security Features
- **Smart Contract Security**: Reentrancy protection, front-running prevention
- **Rate Limiting**: Anti-bot protection and betting caps
- **Decentralized Oracles**: Chainlink price feeds prevent manipulation
- **Non-custodial**: No funds or private keys stored

### 🎨 User Experience
- **Dark Mode**: Default dark theme with light mode toggle
- **Mobile Responsive**: Optimized for all devices
- **Animations**: Smooth transitions, confetti for wins
- **Gas Estimation**: Real-time transaction cost display
- **Practice Mode**: Testnet support for learning

### 📊 Analytics & Social
- **Bet History**: Complete transaction and outcome tracking
- **Leaderboard**: Top performer rankings
- **Statistics**: Win/loss ratios and performance metrics
- **Anonymous Social**: Public win streaks without revealing identities

## Project Structure

```
/
├── smart_contract/          # Solidity contracts and deployment
├── frontend/               # React frontend application
├── backend/               # Node.js backend for analytics
└── README.md             # This file
```

## Quick Start

### Prerequisites
- Node.js 18+
- MetaMask or WalletConnect compatible wallet
- Some ETH for gas fees (testnet recommended for development)

### 1. Smart Contract Setup
```bash
cd smart_contract
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
npm install
npm run dev
```

## Environment Variables

Create `.env` files in each directory:

### Smart Contract (.env)
```
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=your_etherscan_key
```

### Frontend (.env)
```
VITE_CONTRACT_ADDRESS=deployed_contract_address
VITE_CHAIN_ID=11155111
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (.env)
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/betting-dapp
REDIS_URL=redis://localhost:6379
```

## Deployment

### Testnet Deployment (Recommended)
1. Deploy contract to Sepolia testnet
2. Get testnet ETH from faucets
3. Configure frontend with testnet settings

### Mainnet Deployment (Production)
1. Audit smart contracts thoroughly
2. Deploy with proper security measures
3. Set up monitoring and alerting

## Security Considerations

- **Smart Contract**: Audited for common vulnerabilities
- **Oracle Security**: Chainlink feeds prevent price manipulation
- **Rate Limiting**: Prevents spam and bot attacks
- **Gas Optimization**: Minimized transaction costs
- **Access Control**: Proper permission management

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Support

For support and questions:
- Open an issue on GitHub
- Check the documentation in each directory
- Review the smart contract comments for technical details