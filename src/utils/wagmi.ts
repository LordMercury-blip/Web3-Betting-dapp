import { createConfig, http } from 'wagmi';
import { sepolia, mainnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

// Configure chains for the app
const chains = [sepolia, mainnet] as const;

// Create wagmi config using RainbowKit's getDefaultConfig
export const wagmiConfig = getDefaultConfig({
  appName: 'Web3 Betting DApp',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains,
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY || 'demo'}`),
    [mainnet.id]: http(`https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY || 'demo'}`),
  },
});

export { chains };