import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * NetworkStatusContext
 * Manages online/offline status and sync state for the PWA
 * 
 * Sprint 4 - Offline Capability
 * FE-A: UI badges for "Offline Mode" and "Syncing..."
 * FE-B: Will use setSyncing() when performing sync operations
 */

const NetworkStatusContext = createContext(null);

export function NetworkStatusProvider({ children }) {
  // Online/Offline status - uses browser's navigator.onLine
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  // Syncing status - FE-B will update this during sync operations
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Sync progress (optional) - for showing progress indication
  const [syncProgress, setSyncProgress] = useState(null);
  
  // Last sync timestamp
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Pending changes count (for badge indicator)
  const [pendingChanges, setPendingChanges] = useState(0);

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    console.log('[Network] Back online');
  }, []);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    console.log('[Network] Gone offline');
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  /**
   * Start syncing operation
   * Called by FE-B when sync begins
   * @param {number} total - Total items to sync (optional)
   */
  const startSync = useCallback((total = null) => {
    setIsSyncing(true);
    if (total !== null) {
      setSyncProgress({ current: 0, total });
    }
  }, []);

  /**
   * Update sync progress
   * @param {number} current - Current progress
   */
  const updateSyncProgress = useCallback((current) => {
    setSyncProgress((prev) => prev ? { ...prev, current } : null);
  }, []);

  /**
   * Complete syncing operation
   * Called by FE-B when sync completes
   */
  const completeSync = useCallback(() => {
    setIsSyncing(false);
    setSyncProgress(null);
    setLastSyncTime(new Date());
    setPendingChanges(0);
  }, []);

  /**
   * Set pending changes count
   * For showing badge with number of unsynced items
   */
  const updatePendingChanges = useCallback((count) => {
    setPendingChanges(count);
  }, []);

  const value = {
    // Status
    isOnline,
    isSyncing,
    syncProgress,
    lastSyncTime,
    pendingChanges,
    
    // Actions (for FE-B integration)
    startSync,
    updateSyncProgress,
    completeSync,
    updatePendingChanges,
    
    // Convenience
    isOffline: !isOnline,
    showOfflineBadge: !isOnline,
    showSyncingBadge: isOnline && isSyncing,
  };

  return (
    <NetworkStatusContext.Provider value={value}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

/**
 * Hook to access network status
 * @returns {Object} Network status and sync controls
 */
export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
}

export default NetworkStatusContext;
