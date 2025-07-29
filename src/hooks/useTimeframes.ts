import { TimeframeOption } from '../types';

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  // Quick options (1-15 minutes)
  { label: '1 minute', value: 60, category: 'quick' },
  { label: '2 minutes', value: 120, category: 'quick' },
  { label: '5 minutes', value: 300, category: 'quick' },
  { label: '10 minutes', value: 600, category: 'quick' },
  { label: '15 minutes', value: 900, category: 'quick' },
  
  // Standard options (30 minutes - 4 hours)
  { label: '30 minutes', value: 1800, category: 'standard' },
  { label: '1 hour', value: 3600, category: 'standard' },
  { label: '2 hours', value: 7200, category: 'standard' },
  { label: '4 hours', value: 14400, category: 'standard' },
  
  // Extended options (8 hours - 7 days)
  { label: '8 hours', value: 28800, category: 'extended' },
  { label: '12 hours', value: 43200, category: 'extended' },
  { label: '1 day', value: 86400, category: 'extended' },
  { label: '2 days', value: 172800, category: 'extended' },
  { label: '3 days', value: 259200, category: 'extended' },
  { label: '7 days', value: 604800, category: 'extended' }
];

export function useTimeframes() {
  const getTimeframesByCategory = (category: TimeframeOption['category']) => {
    return TIMEFRAME_OPTIONS.filter(option => option.category === category);
  };

  const getTimeframeByValue = (value: number) => {
    return TIMEFRAME_OPTIONS.find(option => option.value === value);
  };

  const formatTimeframe = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getTimeRemaining = (endTime: number): string => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) return 'Expired';
    
    const seconds = Math.floor(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return {
    timeframes: TIMEFRAME_OPTIONS,
    getTimeframesByCategory,
    getTimeframeByValue,
    formatTimeframe,
    getTimeRemaining
  };
}