/**
 * Settings Page
 * =============
 * Settings accessible from the profiles page.
 * Includes offline model management and app preferences.
 * 
 * DigiMasterJi - Multilingual AI Tutor for Rural Education
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Settings,
    Wifi,
    WifiOff,
    HardDrive,
    Volume2,
    Moon,
    Info,
    Check,
} from 'lucide-react';
import OfflineModelManager from '../../components/chat/OfflineModelManager';
import { useWebLLM } from '../../contexts/WebLLMContext';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { isSupported, isModelReady, modelSize } = useWebLLM();
    const { isOnline } = useNetworkStatus();

    // Settings state (would be persisted in a real app)
    const [autoOffline, setAutoOffline] = useState(true);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl"
                />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Settings</h1>
                            <p className="text-white/50 text-sm">Manage app preferences</p>
                        </div>
                    </div>
                </div>

                {/* Settings Sections */}
                <div className="space-y-6">
                    {/* Offline Mode Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <WifiOff className="w-5 h-5 text-violet-400" />
                            Offline Mode
                        </h2>

                        <OfflineModelManager className="mb-4" />

                        {/* Auto-switch setting */}
                        {isModelReady && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 rounded-xl p-4 border border-white/10"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-violet-500/20">
                                            <Wifi className="w-4 h-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">Auto-switch to offline</p>
                                            <p className="text-white/50 text-sm">
                                                Automatically use local AI when internet is unavailable
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAutoOffline(!autoOffline)}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${autoOffline ? 'bg-violet-500' : 'bg-white/20'
                                            }`}
                                    >
                                        <motion.div
                                            className="absolute top-1 w-4 h-4 bg-white rounded-full"
                                            animate={{ left: autoOffline ? '1.75rem' : '0.25rem' }}
                                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </section>

                    {/* About Section */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-400" />
                            About Offline Mode
                        </h2>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                            <div className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-400 mt-0.5" />
                                <div>
                                    <p className="text-white font-medium">Works without internet</p>
                                    <p className="text-white/50 text-sm">
                                        Chat with DigiMasterJi even in areas with no connectivity
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <HardDrive className="w-5 h-5 text-amber-400 mt-0.5" />
                                <div>
                                    <p className="text-white font-medium">One-time download</p>
                                    <p className="text-white/50 text-sm">
                                        Download the AI model once ({modelSize}), use it anytime offline
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Volume2 className="w-5 h-5 text-violet-400 mt-0.5" />
                                <div>
                                    <p className="text-white font-medium">Text-only in offline mode</p>
                                    <p className="text-white/50 text-sm">
                                        Voice features require internet connection
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Device Info */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <HardDrive className="w-5 h-5 text-emerald-400" />
                            Device Status
                        </h2>

                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-white/50 text-sm">Network</p>
                                    <p className={`font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/50 text-sm">WebGPU Support</p>
                                    <p className={`font-medium ${isSupported ? 'text-green-400' : 'text-red-400'}`}>
                                        {isSupported ? 'Supported' : 'Not Supported'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/50 text-sm">Offline Model</p>
                                    <p className={`font-medium ${isModelReady ? 'text-green-400' : 'text-white/70'}`}>
                                        {isModelReady ? 'Ready' : 'Not Downloaded'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-white/50 text-sm">Model Size</p>
                                    <p className="font-medium text-white">{modelSize}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
