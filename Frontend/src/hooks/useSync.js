/**
 * useSync Hook
 * =============
 * React hook for data synchronization.
 * Provides sync status, actions, and local data access.
 * 
 * DigiMasterJi - Multilingual AI Tutor for Rural Education
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService } from '../services/syncService';

/**
 * useSync Hook
 * 
 * @returns {Object} Sync state and actions
 */
export function useSync() {
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(syncService.isOnline);
  const [lastSyncInfo, setLastSyncInfo] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [stats, setStats] = useState(null);

  // Subscribe to sync service status changes
  useEffect(() => {
    const unsubscribe = syncService.subscribe((status) => {
      switch (status.type) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'sync_start':
          setIsSyncing(true);
          setSyncError(null);
          break;
        case 'sync_complete':
          setIsSyncing(false);
          loadLastSyncInfo();
          loadStats();
          break;
        case 'sync_error':
          setIsSyncing(false);
          setSyncError(status.error);
          break;
      }
    });

    // Load initial state
    loadLastSyncInfo();
    loadStats();

    return unsubscribe;
  }, []);

  /**
   * Load last sync info from local DB
   */
  const loadLastSyncInfo = useCallback(async () => {
    const info = await syncService.getLastSyncInfo();
    setLastSyncInfo(info);
  }, []);

  /**
   * Load sync stats
   */
  const loadStats = useCallback(async () => {
    const syncStats = await syncService.getStats();
    setStats(syncStats);
  }, []);

  /**
   * Pull data from server
   * @param {number} days - Number of days to fetch
   */
  const pullFromServer = useCallback(async (days = 15) => {
    setSyncError(null);
    const result = await syncService.pullFromServer(days);
    
    if (!result.success) {
      setSyncError(result.error || result.reason);
    }
    
    return result;
  }, []);

  /**
   * Sync data (pull from server)
   * Alias for pullFromServer for cleaner API
   */
  const sync = useCallback(async () => {
    return await pullFromServer(15);
  }, [pullFromServer]);

  /**
   * Clear all local data
   */
  const clearLocalData = useCallback(async () => {
    await syncService.clearLocalData();
    setLastSyncInfo(null);
    setStats(null);
  }, []);

  /**
   * Get local profiles
   */
  const getLocalProfiles = useCallback(async () => {
    return await syncService.getLocalProfiles();
  }, []);

  /**
   * Get local conversations for a profile
   */
  const getLocalConversations = useCallback(async (profileId) => {
    return await syncService.getLocalConversations(profileId);
  }, []);

  /**
   * Get local messages for a conversation
   */
  const getLocalMessages = useCallback(async (conversationId) => {
    return await syncService.getLocalMessages(conversationId);
  }, []);

  /**
   * Format last sync time for display (handles UTC timestamps)
   */
  const formatLastSync = useCallback(() => {
    if (!lastSyncInfo?.timestamp) return 'Never';
    
    // Handle UTC timestamps without Z suffix
    let timestamp = lastSyncInfo.timestamp;
    if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.match(/[+-]\d{2}:\d{2}$/)) {
      timestamp = timestamp + 'Z';
    }
    
    const syncTime = new Date(timestamp);
    if (isNaN(syncTime.getTime())) return 'Never';
    
    const now = new Date();
    const diffMs = now - syncTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }, [lastSyncInfo]);

  return {
    // Status
    isSyncing,
    isOnline,
    lastSyncInfo,
    syncError,
    stats,

    // Actions
    sync,
    pullFromServer,
    clearLocalData,

    // Local data access
    getLocalProfiles,
    getLocalConversations,
    getLocalMessages,

    // Helpers
    formatLastSync,
  };
}

export default useSync;
