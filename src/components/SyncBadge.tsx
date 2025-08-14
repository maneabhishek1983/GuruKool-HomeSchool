"use client";

import React from 'react';
import { useSyncContext } from '@/lib/syncContext';

export function SyncBadge() {
  const { isOnline, syncStatus, lastSyncTime } = useSyncContext();

  const statusColor = isOnline
    ? syncStatus === 'syncing'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statusColor}`}>
      <span className={`size-2 rounded-full ${isOnline ? (syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'}`} />
      <span className="font-medium">
        {isOnline ? (syncStatus === 'syncing' ? 'Syncing…' : 'Synced') : 'Offline'}
      </span>
      {lastSyncTime && (
        <span className="text-gray-600">· {lastSyncTime.toLocaleTimeString()}</span>
      )}
    </div>
  );
}


