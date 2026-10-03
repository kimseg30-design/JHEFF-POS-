'use client';

import React from 'react';
import { useOnlineStatus } from '@/lib/hooks/use-online-status';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-gray-900/95 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-gray-800 animate-in fade-in slide-in-from-bottom-2">
      <div className="p-1 bg-amber-500 rounded-lg text-white">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div>
        <span className="font-bold text-amber-400">Offline Mode</span>
        <span className="text-gray-300 ml-1.5 hidden sm:inline">• Local cached data active</span>
      </div>
    </div>
  );
};
