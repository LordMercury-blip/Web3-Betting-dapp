import React from 'react';
import { Github, Twitter, MessageCircle, Shield, Book, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer 
      className="border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-md mt-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CB</span>
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                CryptoBet
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              Decentralized betting on cryptocurrency price movements. 
              Powered by Chainlink oracles for transparent and fair outcomes.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Supported Tokens</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Betting Rules</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fees</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                  <Book className="w-4 h-4" />
                  <span>Documentation</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Security Audit</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center space-x-1">
                  <ExternalLink className="w-4 h-4" />
                  <span>Smart Contract</span>
                </a>
              </li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Risk Disclosure</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700/50 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-gray-400 text-sm">
            © 2024 CryptoBet. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Sepolia Testnet</span>
            </div>
            <div className="text-sm text-gray-400">
              Powered by <span className="text-blue-400">Chainlink</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
          <p className="text-yellow-400 text-xs">
            ⚠️ <strong>Disclaimer:</strong> This is a demo application running on Sepolia testnet. 
            Betting involves risk and you should only bet what you can afford to lose. 
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}