/**
 * OfflineModelManager Component
 * =============================
 * UI for managing the WebLLM offline model.
 * Shows download progress, model status, and controls.
 * 
 * DigiMasterJi - Multilingual AI Tutor for Rural Education
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Download,
    Check,
    AlertTriangle,
    Wifi,
    WifiOff,
    HardDrive,
    Trash2,
    Loader2,
    Sparkles,
    Info,
} from 'lucide-react';
import { useWebLLM } from '../../contexts/WebLLMContext';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';

/**
 * Compact offline model indicator for chat header
 */
export function OfflineModelBadge() {
    const { isSupported, isModelReady, isLoading, useOfflineChat } = useWebLLM();
    const { isOnline } = useNetworkStatus();

    if (!isSupported) return null;

    if (useOfflineChat && isModelReady) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-orange-500/20 border border-orange-500/30">
                <WifiOff className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-xs font-medium text-orange-400">Offline Mode</span>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/20 border border-violet-500/30">
                <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                <span className="text-xs font-medium text-violet-400">Loading Model...</span>
            </div>
        );
    }

    if (isModelReady && isOnline) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-medium text-green-400">Offline Ready</span>
            </div>
        );
    }

    return null;
}

/**
 * Full offline model manager panel
 */
export default function OfflineModelManager({ className = '' }) {
    const {
        isSupported,
        isModelReady,
        isLoading,
        loadProgress,
        loadingText,
        error,
        isModelCached,
        modelSize,
        downloadModel,
        clearCache,
        useOfflineChat,
    } = useWebLLM();

    const { isOnline } = useNetworkStatus();
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    // Not supported message
    if (!isSupported) {
        return (
            <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Offline Mode Not Available</h3>
                        <p className="text-white/60 text-sm mt-1">
                            Your device doesn't support WebGPU, which is required for offline AI.
                            Try using Chrome 113+ or Edge 113+ for offline capabilities.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Currently using offline mode
    if (useOfflineChat && isModelReady) {
        return (
            <div className={`bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-xl p-4 border border-orange-500/20 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                        <WifiOff className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-orange-400 font-medium flex items-center gap-2">
                            Offline Mode Active
                            <Sparkles className="w-4 h-4" />
                        </h3>
                        <p className="text-white/60 text-sm mt-1">
                            You're currently offline. DigiMasterJi is running on your device using a local AI model.
                            Some features like web search and voice are unavailable.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        const progressPercent = Math.round(loadProgress * 100);

        return (
            <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-violet-500/20">
                        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-medium">Downloading Offline Model</h3>
                        <p className="text-white/60 text-sm mt-1 mb-3">
                            {loadingText || 'Preparing...'}
                        </p>

                        {/* Progress bar */}
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                        <p className="text-violet-400 text-sm mt-2 text-center">
                            {progressPercent}% complete
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Model ready state
    if (isModelReady) {
        return (
            <div className={`bg-white/5 rounded-xl p-4 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                        <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-white font-medium flex items-center gap-2">
                            Offline Mode Ready
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                                Enabled
                            </span>
                        </h3>
                        <p className="text-white/60 text-sm mt-1">
                            The AI model is loaded and ready. If you lose internet connection,
                            DigiMasterJi will automatically switch to offline mode.
                        </p>

                        {/* Clear cache option */}
                        <AnimatePresence>
                            {!showConfirmClear ? (
                                <button
                                    onClick={() => setShowConfirmClear(true)}
                                    className="mt-3 text-sm text-white/50 hover:text-red-400 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove offline model
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20"
                                >
                                    <p className="text-red-300 text-sm mb-2">
                                        This will delete the offline model ({modelSize}). You'll need to download it again.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={async () => {
                                                await clearCache();
                                                setShowConfirmClear(false);
                                            }}
                                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={() => setShowConfirmClear(false)}
                                            className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`bg-red-500/10 rounded-xl p-4 border border-red-500/20 ${className}`}>
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-red-400 font-medium">Download Failed</h3>
                        <p className="text-white/60 text-sm mt-1">{error}</p>
                        <button
                            onClick={downloadModel}
                            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Initial state - offer to download
    return (
        <div className={`bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl p-4 border border-violet-500/20 ${className}`}>
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                    <Download className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-medium">Enable Offline Mode</h3>
                    <p className="text-white/60 text-sm mt-1">
                        Download a small AI model to chat with DigiMasterJi even without internet.
                        Great for areas with poor connectivity!
                    </p>

                    {/* Info box */}
                    <div className="mt-3 p-3 bg-white/5 rounded-lg flex items-start gap-2">
                        <Info className="w-4 h-4 text-violet-400 mt-0.5" />
                        <div className="text-sm">
                            <p className="text-white/70">
                                <span className="text-violet-400 font-medium">Download size:</span> {modelSize}
                            </p>
                            <p className="text-white/50 mt-1">
                                Once downloaded, the model stays on your device for offline use.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={downloadModel}
                        disabled={!isOnline}
                        className="mt-4 w-full px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-medium hover:from-violet-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isOnline ? (
                            <>
                                <Download className="w-4 h-4" />
                                Download Offline Model
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4" />
                                Connect to Internet to Download
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
