/**
 * useNetworkStatus Hook
 * ======================
 * React hook for monitoring network connectivity.
 * 
 * DigiMasterJi - Multilingual AI Tutor for Rural Education
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * useNetworkStatus Hook
 * 
 * Monitors online/offline status and provides network info.
 * 
 * @returns {Object} Network status and info
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Online');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('[Network] Offline');
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Clear the "was offline" flag
   * Call after handling reconnection
   */
  const clearWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  /**
   * Get connection info if available
   */
  const getConnectionInfo = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = navigator.connection;
      return {
        effectiveType: conn.effectiveType, // 'slow-2g', '2g', '3g', '4g'
        downlink: conn.downlink, // Mbps
        rtt: conn.rtt, // Round-trip time in ms
        saveData: conn.saveData, // Data saver mode
      };
    }
    return null;
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    clearWasOffline,
    getConnectionInfo,
  };
}

export default useNetworkStatus;
