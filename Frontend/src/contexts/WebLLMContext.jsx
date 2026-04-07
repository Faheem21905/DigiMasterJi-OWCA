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

// LocalStorage key to track if user has OPTED-IN to offline mode
// This is the source of truth - we only auto-load if user explicitly enabled offline mode
const OFFLINE_MODE_ENABLED_KEY = 'webllm_offline_enabled';

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
    // ONLY if user has previously opted-in (clicked download)
    useEffect(() => {
        const checkSupportAndAutoLoad = async () => {
            const supported = webLLMService.isWebGPUSupported();
            setIsSupported(supported);

            if (supported) {
                // Check if user has opted-in to offline mode
                const userOptedIn = localStorage.getItem(OFFLINE_MODE_ENABLED_KEY) === 'true';

                // Also check if model is actually cached
                const modelActuallyCached = await webLLMService.isModelCached();

                if (userOptedIn && modelActuallyCached) {
                    setIsModelCached(true);

                    // Automatically initialize the model from cache 
                    // (only if user opted-in AND we haven't already tried)
                    if (!autoLoadAttempted.current && !initRef.current) {
                        autoLoadAttempted.current = true;
                        console.log('[WebLLM] User opted-in and model cached, auto-loading...');

                        // Auto-initialize in background
                        webLLMService.initialize((progress) => {
                            setLoadProgress(progress.progress);
                            setLoadingText(progress.text || 'Loading cached model...');
                        }).then((success) => {
                            if (success) {
                                console.log('[WebLLM] Auto-loaded model from cache');
                                setLoadingText('');
                            } else {
                                // Model might have been cleared externally
                                console.warn('[WebLLM] Failed to auto-load, cache might be cleared');
                                localStorage.removeItem(OFFLINE_MODE_ENABLED_KEY);
                                setIsModelCached(false);
                            }
                        }).catch((err) => {
                            console.error('[WebLLM] Auto-load error:', err);
                            localStorage.removeItem(OFFLINE_MODE_ENABLED_KEY);
                            setIsModelCached(false);
                        });
                    }
                } else if (userOptedIn && !modelActuallyCached) {
                    // User opted in but cache was cleared externally (browser cleared storage)
                    console.log('[WebLLM] User opted-in but no cache found, resetting opt-in');
                    localStorage.removeItem(OFFLINE_MODE_ENABLED_KEY);
                    setIsModelCached(false);
                } else {
                    console.log('[WebLLM] User has not opted-in to offline mode');
                    setIsModelCached(false);
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
                // Mark that user has opted-in to offline mode
                localStorage.setItem(OFFLINE_MODE_ENABLED_KEY, 'true');
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
     * Clear the model cache and remove opt-in flag
     * After this, the model will NOT auto-download on page refresh
     */
    const clearCache = useCallback(async () => {
        const success = await webLLMService.clearCache();
        setIsModelCached(false);
        // Remove opt-in flag - user must click download again to re-enable
        localStorage.removeItem(OFFLINE_MODE_ENABLED_KEY);
        // Reset the init refs so download can work again
        initRef.current = false;
        autoLoadAttempted.current = false;
        console.log('[WebLLM] Cache cleared and opt-in disabled');
        return success;
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
