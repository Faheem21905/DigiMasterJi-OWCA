/**
 * WebLLM Offline Service
 * =======================
 * Provides true offline LLM capability using WebLLM (runs model in browser via WebGPU).
 * 
 * This service:
 * 1. Downloads and caches a small LLM model for offline use
 * 2. Detects when device loses ALL internet connectivity
 * 3. Generates responses entirely in the browser
 * 
 * DigiMasterJi - Multilingual AI Tutor for Rural Education
 */

import * as webllm from '@mlc-ai/web-llm';
import { hasModelInCache, deleteModelAllInfoInCache } from '@mlc-ai/web-llm';

// Configuration for the offline model
// Using Llama 3.2 1B - small, fast, and good quality for educational tasks
const OFFLINE_MODEL = 'Llama-3.2-1B-Instruct-q4f32_1-MLC';

// Alternative models if the main one doesn't work:
// - 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC' (~0.5GB)
// - 'gemma-2b-it-q4f32_1-MLC' (~1.2GB)

class WebLLMService {
    constructor() {
        this.engine = null;
        this.isInitialized = false;
        this.isLoading = false;
        this.loadProgress = 0;
        this.error = null;
        this.modelId = OFFLINE_MODEL;
        this.listeners = new Set();
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners of state change
     */
    _notifyListeners() {
        const state = this.getState();
        this.listeners.forEach(listener => listener(state));
    }

    /**
     * Get current service state
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            isLoading: this.isLoading,
            loadProgress: this.loadProgress,
            error: this.error,
            modelId: this.modelId,
            isSupported: this.isWebGPUSupported(),
        };
    }

    /**
     * Check if WebGPU is supported on this device
     * @returns {boolean}
     */
    isWebGPUSupported() {
        if (typeof navigator === 'undefined') return false;
        return 'gpu' in navigator;
    }

    /**
     * Check if the model is already cached in IndexedDB
     * @returns {Promise<boolean>}
     */
    async isModelCached() {
        try {
            const cached = await hasModelInCache(this.modelId);
            return cached;
        } catch (error) {
            console.warn('[WebLLM] Error checking cache:', error);
            return false;
        }
    }

    /**
     * Initialize the WebLLM engine (downloads model if not cached)
     * @param {Function} onProgress - Optional progress callback
     * @returns {Promise<boolean>}
     */
    async initialize(onProgress = null) {
        if (this.isInitialized) {
            console.log('[WebLLM] Already initialized');
            return true;
        }

        if (this.isLoading) {
            console.log('[WebLLM] Already loading');
            return false;
        }

        if (!this.isWebGPUSupported()) {
            this.error = 'WebGPU is not supported on this device. Offline mode is unavailable.';
            this._notifyListeners();
            return false;
        }

        this.isLoading = true;
        this.error = null;
        this.loadProgress = 0;
        this._notifyListeners();

        try {
            console.log('[WebLLM] Initializing engine with model:', this.modelId);

            // Create engine with progress callback
            this.engine = await webllm.CreateMLCEngine(this.modelId, {
                initProgressCallback: (progress) => {
                    this.loadProgress = progress.progress || 0;
                    this._notifyListeners();

                    // Call custom progress callback if provided
                    if (onProgress) {
                        onProgress({
                            progress: this.loadProgress,
                            text: progress.text || '',
                            timeElapsed: progress.timeElapsed || 0,
                        });
                    }

                    console.log(`[WebLLM] Loading: ${(this.loadProgress * 100).toFixed(1)}% - ${progress.text || ''}`);
                },
            });

            this.isInitialized = true;
            this.isLoading = false;
            this.loadProgress = 1;
            this._notifyListeners();

            console.log('[WebLLM] Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('[WebLLM] Initialization error:', error);
            this.error = error.message || 'Failed to initialize offline model';
            this.isLoading = false;
            this.isInitialized = false;
            this._notifyListeners();
            return false;
        }
    }

    /**
     * Generate a response for the given message
     * @param {string} userMessage - The user's message
     * @param {Object} options - Generation options
     * @returns {Promise<string>}
     */
    async generate(userMessage, options = {}) {
        if (!this.isInitialized || !this.engine) {
            throw new Error('WebLLM engine not initialized');
        }

        const {
            systemPrompt = this._getDefaultSystemPrompt(),
            maxTokens = 512,
            temperature = 0.7,
        } = options;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ];

            const response = await this.engine.chat.completions.create({
                messages,
                max_tokens: maxTokens,
                temperature,
            });

            return response.choices[0]?.message?.content || '';
        } catch (error) {
            console.error('[WebLLM] Generation error:', error);
            throw error;
        }
    }

    /**
     * Generate a streaming response
     * @param {string} userMessage - The user's message
     * @param {Object} callbacks - { onToken, onComplete, onError }
     * @param {Object} options - Generation options
     */
    async generateStream(userMessage, callbacks = {}, options = {}) {
        const { onToken, onComplete, onError } = callbacks;

        if (!this.isInitialized || !this.engine) {
            onError?.(new Error('Offline model not ready. Please wait for it to load.'));
            return;
        }

        const {
            systemPrompt = this._getDefaultSystemPrompt(),
            maxTokens = 512,
            temperature = 0.7,
        } = options;

        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ];

            // Create streaming completion
            const chunks = await this.engine.chat.completions.create({
                messages,
                max_tokens: maxTokens,
                temperature,
                stream: true,
            });

            let fullResponse = '';

            for await (const chunk of chunks) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullResponse += content;
                    onToken?.(content);
                }
            }

            onComplete?.({
                content: fullResponse,
                role: 'assistant',
                offline_mode: true,
                model: this.modelId,
            });
        } catch (error) {
            console.error('[WebLLM] Streaming error:', error);
            onError?.(error);
        }
    }

    /**
     * Get the default system prompt for DigiMasterJi
     */
    _getDefaultSystemPrompt() {
        return `You are DigiMasterJi, a friendly AI tutor helping students learn.
You are currently running in OFFLINE MODE with limited capabilities.

=== CRITICAL RESTRICTION ===
You are STRICTLY an educational AI tutor. You can ONLY help with:
- Science (Physics, Chemistry, Biology, Environmental Science)
- Technology (Computers, Programming, Digital Literacy)
- Engineering concepts and problem-solving
- Mathematics (Arithmetic, Algebra, Geometry, Calculus, Statistics)
- General educational topics (Study skills, Exam preparation, Learning strategies)

If a student asks about ANYTHING that is NOT related to education, academics, STEM, or learning, you MUST respond with:
"I'm sorry, but I'm an educational AI tutor designed to help you with your studies. I can only assist with Science, Technology, Engineering, Mathematics, and educational topics. Please feel free to ask me any question about your academics, and I'll be happy to help!"

Topics you MUST DECLINE: Entertainment, movies, personal advice, relationships, politics, jokes, games, cooking, health advice, legal/financial advice, or any inappropriate content.
=== END RESTRICTION ===

Important guidelines:
- Give brief, helpful answers
- Use simple language suitable for students
- Be encouraging and supportive
- If you're not sure about something, say so
- Keep responses concise (2-3 paragraphs max)
- Be SHORT and DIRECT - no filler phrases or verbose introductions, just answer the question

Note: You cannot access the internet or learning materials in offline mode.
Focus on helping with educational questions only.`;
    }

    /**
     * Clear the model cache to free up storage
     * Uses the proper WebLLM API to delete all model info from IndexedDB
     * @returns {Promise<boolean>} - Returns true if cache was cleared successfully
     */
    async clearCache() {
        try {
            console.log('[WebLLM] Clearing cache for model:', this.modelId);
            
            // First unload the engine if it's running
            if (this.engine) {
                try {
                    await this.engine.unload();
                    console.log('[WebLLM] Engine unloaded');
                } catch (unloadError) {
                    console.warn('[WebLLM] Error unloading engine:', unloadError);
                }
                this.engine = null;
            }
            
            // Delete all model info from cache (weights, config, wasm)
            await deleteModelAllInfoInCache(this.modelId);
            console.log('[WebLLM] Model cache deleted successfully');
            
            // Reset local state
            this.isInitialized = false;
            this.loadProgress = 0;
            this.error = null;
            this._notifyListeners();
            
            return true;
        } catch (error) {
            console.error('[WebLLM] Error clearing cache:', error);
            // Still reset local state even if cache clear fails
            this.isInitialized = false;
            this.engine = null;
            this.loadProgress = 0;
            this._notifyListeners();
            return false;
        }
    }

    /**
     * Get estimated model size for download
     * @returns {string}
     */
    getModelSize() {
        // Approximate sizes for common models
        const sizes = {
            'Llama-3.2-1B-Instruct-q4f32_1-MLC': '~750 MB',
            'gemma-2b-it-q4f32_1-MLC': '~1.2 GB',
            'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC': '~650 MB',
        };
        return sizes[this.modelId] || '~1 GB';
    }

    /**
     * Unload the model to free memory
     */
    async unload() {
        if (this.engine) {
            try {
                await this.engine.unload();
            } catch (error) {
                console.warn('[WebLLM] Error unloading:', error);
            }
            this.engine = null;
            this.isInitialized = false;
            this._notifyListeners();
        }
    }
}

// Singleton instance
export const webLLMService = new WebLLMService();
export default webLLMService;
