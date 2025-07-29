import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { ChartBarIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../context/ThemeContext';
import Button from './ui/Button';
import clsx from 'clsx';

export default function Header() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ChartBarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                PriceBet
              </h1>
              <p className="text-xs text-gray-400">Decentralized Betting</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#betting" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Betting
            </a>
            <a href="#history" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              History
            </a>
            <a href="#leaderboard" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
              Leaderboard
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <MoonIcon className="w-5 h-5 text-blue-400" />
              )}
            </Button>

            {/* Wallet Connect */}
            <div className="connect-button-wrapper">
              <ConnectButton 
                chainStatus="icon"
                showBalance={false}
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}