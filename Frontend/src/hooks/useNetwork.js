import { useNetworkStatus } from '../contexts/NetworkStatusContext';

/**
 * useNetwork Hook
 * Convenient hook for accessing network status
 * 
 * Sprint 4 - Offline Capability
 * 
 * @returns {Object} Network status utilities
 */
export function useNetwork() {
  const context = useNetworkStatus();
  
  return {
    // Status
    isOnline: context.isOnline,
    isOffline: context.isOffline,
    isSyncing: context.isSyncing,
    
    // Convenience booleans
    canMakeRequests: context.isOnline && !context.isSyncing,
    showOfflineUI: context.isOffline,
    showSyncingUI: context.isSyncing,
    
    // Sync controls (for FE-B)
    startSync: context.startSync,
    completeSync: context.completeSync,
    updateSyncProgress: context.updateSyncProgress,
    updatePendingChanges: context.updatePendingChanges,
    
    // Additional info
    pendingChanges: context.pendingChanges,
    syncProgress: context.syncProgress,
    lastSyncTime: context.lastSyncTime,
  };
}

export default useNetwork;
