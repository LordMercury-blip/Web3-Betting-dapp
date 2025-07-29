import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { Toaster } from 'react-hot-toast';
import { wagmiConfig, chains } from './utils/wagmi';
import { ThemeProvider } from './context/ThemeContext';
import { BettingProvider } from './context/BettingContext';
import Header from './components/Header';
import BettingInterface from './components/BettingInterface';
import BetHistory from './components/BetHistory';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

function App() {
  // Apply dark theme by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          chains={chains} 
          theme={darkTheme({
            accentColor: '#3b82f6',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
          })}
        >
          <ThemeProvider>
            <BettingProvider>
              <div className="min-h-screen bg-gray-950 text-white">
                {/* Background Effects */}
                <div className="fixed inset-0 bg-gradient-to-br from-gray-900/50 via-blue-900/20 to-purple-900/30"></div>
                <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-900/20 to-gray-950"></div>
                
                <div className="relative z-10">
                  <Header />
                  
                  <main className="container mx-auto px-4 py-12 space-y-12">
                    {/* Hero Section */}
                    <div className="text-center space-y-6 py-12">
                      <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                        PriceBet
                      </h1>
                      <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        The most advanced decentralized betting platform for cryptocurrency price movements. 
                        Powered by Chainlink oracles for transparent and fair outcomes.
                      </p>
                      <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Live Prices</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span>Instant Settlement</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Non-Custodial</span>
                        </div>
                      </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid xl:grid-cols-4 gap-8">
                      {/* Betting Interface */}
                      <div className="xl:col-span-3">
                        <BettingInterface />
                      </div>
                      
                      {/* Leaderboard */}
                      <div className="xl:col-span-1">
                        <Leaderboard />
                      </div>
                    </div>

                    {/* Bet History */}
                    <BetHistory />
                  </main>
                  
                  <Footer />
                </div>

                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#111827',
                      color: '#fff',
                      border: '1px solid #1f2937',
                      borderRadius: '12px',
                      fontSize: '14px',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </BettingProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;