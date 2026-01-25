/**
 * WebLLM Context
 * ==============
 * React context for managing the WebLLM offline model state.
 * 
 * Provides:
 * - Model loading state and progress
 * - Automatic offline detection
 * - Easy access to offline chat generation
 * 
 * DigiMasterJi - Multilingual AI Tutor for Rural Education
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import webLLMService from '../services/webLLMService';
import { useNetworkStatus } from './NetworkStatusContext';

const WebLLMContext = createContext(null);

// LocalStorage key to track if model was downloaded
const MODEL_DOWNLOADED_KEY = 'webllm_model_downloaded';

/**
 * Check if WebLLM model is cached by checking Cache Storage directly
 * This is more reliable than localStorage since the cache could exist
 * from a previous session where localStorage wasn't set
 */
async function checkWebLLMCache() {
    try {
        if (!('caches' in window)) {
            return false;
        }

        // WebLLM uses cache names like "webllm/model", "webllm/config", "webllm/wasm"
        const cacheNames = await caches.keys();
        const hasWebLLMCache = cacheNames.some(name => name.startsWith('webllm'));

        if (hasWebLLMCache) {
            console.log('[WebLLM] Found cached model in Cache Storage:',
                cacheNames.filter(n => n.startsWith('webllm')));
        }

        return hasWebLLMCache;
    } catch (error) {
        console.warn('[WebLLM] Error checking cache:', error);
        return false;
    }
}

export function WebLLMProvider({ children }) {
    // WebLLM state
    const [isSupported, setIsSupported] = useState(false);
    const [isModelReady, setIsModelReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [loadingText, setLoadingText] = useState('');
    const [error, setError] = useState(null);
    const [isModelCached, setIsModelCached] = useState(false);

    // Network status
    const { isOnline } = useNetworkStatus();

    // Track if we should use offline mode
    const [useOfflineChat, setUseOfflineChat] = useState(false);

    // Initialization ref to prevent double-init
    const initRef = useRef(false);
    const autoLoadAttempted = useRef(false);

    // Check WebGPU support and auto-load cached model on mount
    useEffect(() => {
        const checkSupportAndAutoLoad = async () => {
            const supported = webLLMService.isWebGPUSupported();
            setIsSupported(supported);

            if (supported) {
                // First check Cache Storage directly (more reliable)
                const hasCacheStorage = await checkWebLLMCache();

                // Also check localStorage (fallback/secondary check)
                const hasLocalStorage = localStorage.getItem(MODEL_DOWNLOADED_KEY) === 'true';

                // Model is cached if either check passes
                const modelIsCached = hasCacheStorage || hasLocalStorage;

                if (modelIsCached) {
                    // Sync localStorage with cache state
                    if (hasCacheStorage && !hasLocalStorage) {
                        localStorage.setItem(MODEL_DOWNLOADED_KEY, 'true');
                        console.log('[WebLLM] Synced localStorage with detected cache');
                    }

                    setIsModelCached(true);

                    // Automatically initialize the model from cache 
                    // (only if we haven't already tried)
                    if (!autoLoadAttempted.current && !initRef.current) {
                        autoLoadAttempted.current = true;
                        console.log('[WebLLM] Model cache detected, auto-loading...');

                        // Auto-initialize in background
                        webLLMService.initialize((progress) => {
                            setLoadProgress(progress.progress);
                            setLoadingText(progress.text || 'Loading cached model...');
                        }).then((success) => {
                            if (success) {
                                console.log('[WebLLM] Auto-loaded model from cache');
                                setLoadingText('');
                                localStorage.setItem(MODEL_DOWNLOADED_KEY, 'true');
                            } else {
                                // Model might have been cleared, update localStorage
                                console.warn('[WebLLM] Failed to auto-load, cache might be cleared');
                                localStorage.removeItem(MODEL_DOWNLOADED_KEY);
                                setIsModelCached(false);
                            }
                        }).catch((err) => {
                            console.error('[WebLLM] Auto-load error:', err);
                            localStorage.removeItem(MODEL_DOWNLOADED_KEY);
                            setIsModelCached(false);
                        });
                    }
                } else {
                    console.log('[WebLLM] No cached model found');
                }
            }
        };

        checkSupportAndAutoLoad();

        // Subscribe to service state changes
        const unsubscribe = webLLMService.subscribe((state) => {
            setIsModelReady(state.isInitialized);
            setIsLoading(state.isLoading);
            setLoadProgress(state.loadProgress);
            setError(state.error);
        });

        return () => unsubscribe();
    }, []);

    // Auto-switch to offline mode when device goes offline and model is ready
    useEffect(() => {
        if (!isOnline && isModelReady) {
            setUseOfflineChat(true);
            console.log('[WebLLM] Device offline - switching to offline chat mode');
        } else if (isOnline) {
            setUseOfflineChat(false);
        }
    }, [isOnline, isModelReady]);

    /**
     * Download and initialize the offline model
     * Should be called when user explicitly wants to enable offline mode
     */
    const downloadModel = useCallback(async () => {
        if (initRef.current || isLoading || isModelReady) {
            return isModelReady;
        }

        initRef.current = true;

        try {
            setLoadingText('Starting download...');

            const success = await webLLMService.initialize((progress) => {
                setLoadProgress(progress.progress);
                setLoadingText(progress.text || 'Loading...');
            });

            if (success) {
                setIsModelCached(true);
                setLoadingText('');
                // Persist download state to localStorage
                localStorage.setItem(MODEL_DOWNLOADED_KEY, 'true');
                console.log('[WebLLM] Model downloaded and cached successfully');
            }

            return success;
        } catch (err) {
            console.error('[WebLLM Context] Download error:', err);
            setError(err.message);
            return false;
        } finally {
            initRef.current = false;
        }
    }, [isLoading, isModelReady]);

    /**
     * Initialize from cache (if model was previously downloaded)
     */
    const initializeFromCache = useCallback(async () => {
        if (!isModelCached || isModelReady || isLoading) {
            return false;
        }

        return await downloadModel();
    }, [isModelCached, isModelReady, isLoading, downloadModel]);

    /**
     * Generate a response using the offline model
     * @param {string} message - User's message
     * @returns {Promise<string>}
     */
    const generateResponse = useCallback(async (message) => {
        if (!isModelReady) {
            throw new Error('Offline model not ready');
        }

        return await webLLMService.generate(message);
    }, [isModelReady]);

    /**
     * Generate a streaming response using the offline model
     * @param {string} message - User's message
     * @param {Object} callbacks - { onToken, onComplete, onError }
     */
    const generateStreamingResponse = useCallback(async (message, callbacks) => {
        if (!isModelReady) {
            callbacks?.onError?.(new Error('Offline model not ready'));
            return;
        }

        await webLLMService.generateStream(message, callbacks);
    }, [isModelReady]);

    /**
     * Clear the model cache
     */
    const clearCache = useCallback(async () => {
        await webLLMService.clearCache();
        setIsModelCached(false);
        // Remove download state from localStorage
        localStorage.removeItem(MODEL_DOWNLOADED_KEY);
        console.log('[WebLLM] Cache cleared and localStorage updated');
    }, []);

    /**
     * Unload model to free memory
     */
    const unloadModel = useCallback(async () => {
        await webLLMService.unload();
    }, []);

    const value = {
        // State
        isSupported,
        isModelReady,
        isLoading,
        loadProgress,
        loadingText,
        error,
        isModelCached,
        useOfflineChat,

        // Model info
        modelSize: webLLMService.getModelSize(),

        // Actions
        downloadModel,
        initializeFromCache,
        generateResponse,
        generateStreamingResponse,
        clearCache,
        unloadModel,

        // Manual offline toggle (for testing)
        setUseOfflineChat,
    };

    return (
        <WebLLMContext.Provider value={value}>
            {children}
        </WebLLMContext.Provider>
    );
}

/**
 * Hook to access WebLLM functionality
 */
export function useWebLLM() {
    const context = useContext(WebLLMContext);
    if (!context) {
        throw new Error('useWebLLM must be used within a WebLLMProvider');
    }
    return context;
}

export default WebLLMContext;
