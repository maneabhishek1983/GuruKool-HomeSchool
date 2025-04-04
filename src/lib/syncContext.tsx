"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SyncContextType {
  isOnline: boolean;
  syncStatus: 'synced' | 'syncing' | 'pending';
  lastSyncTime: Date | null;
}

const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  syncStatus: 'synced',
  lastSyncTime: null
});

export const useSyncContext = () => useContext(SyncContext);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider = ({ children }: SyncProviderProps) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'pending'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Set up event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      // When coming back online, trigger sync
      setSyncStatus('syncing');
      setTimeout(() => {
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('pending');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Simulate initial sync
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <SyncContext.Provider value={{ isOnline, syncStatus, lastSyncTime }}>
      {children}
    </SyncContext.Provider>
  );
};
