import apiClient from './axios';
import { getProfileToken } from '../utils/token';

/**
 * Chat & RAG Interaction API
 * All chat endpoints require profile_token (set automatically by axios interceptor)
 */

// Get the base URL for direct fetch calls (SSE streaming)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const chatApi = {
  /**
   * Start a new conversation thread.
   * Backend: POST /chat/sessions
   * Expects profile token in Authorization header
   * @param {Object} data - { profile_id: string, topic?: string } - profile ID and optional topic
   * @returns {Promise} - ConversationResponse { _id, profile_id, title, subject_tag, created_at, updated_at, message_count }
   */
  startSession: (data = {}) => {
    return apiClient.post('/chat/sessions', data, {
      timeout: 30000,
    });
  },

  /**
   * Get chat history list for the current profile.
   * Backend: GET /chat/sessions
   * @param {Object} params - { limit: number, offset: number }
   * @returns {Promise} - Array of ConversationResponse
   */
  getSessions: (params = { limit: 20, offset: 0 }) => {
    // Add cache-busting timestamp to prevent browser from caching responses
    // across different profiles (URL is same, only Auth header differs)
    const cacheBuster = Date.now();
    return apiClient.get('/chat/sessions', { 
      params: { ...params, _t: cacheBuster },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  },

  /**
   * Fetch full message history for a specific conversation.
   * Backend: GET /chat/{conversation_id}/history
   * @param {string} conversationId
   * @returns {Promise} - Array of MessageResponse { _id, conversation_id, profile_id, role, content, content_translated, audio_url, timestamp, rag_references }
   */
  getSessionHistory: (conversationId) => {
    // Add cache-busting to prevent stale message history
    const cacheBuster = Date.now();
    return apiClient.get(`/chat/${conversationId}/history`, {
      params: { _t: cacheBuster },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      }
    });
  },

  /**
   * Get details of a specific conversation.
   * Backend: GET /chat/{conversation_id}
   * @param {string} conversationId
   * @returns {Promise} - ConversationResponse
   */
  getSession: (conversationId) => {
    return apiClient.get(`/chat/${conversationId}`);
  },

  /**
   * Update conversation metadata (title, subject_tag).
   * Backend: PUT /chat/{conversation_id}
   * @param {string} conversationId
   * @param {Object} data - { title?: string, subject_tag?: string }
   * @returns {Promise} - Updated ConversationResponse
   */
  updateSession: (conversationId, data) => {
    return apiClient.put(`/chat/${conversationId}`, data);
  },

  /**
   * Delete a conversation and all its messages.
   * Backend: DELETE /chat/{conversation_id}
   * @param {string} conversationId
   * @returns {Promise} - { status, message, messages_deleted }
   */
  deleteSession: (conversationId) => {
    return apiClient.delete(`/chat/${conversationId}`);
  },

  /**
   * Send a message to AI. Triggers RAG & Ollama.
   * Backend: POST /chat/{conversation_id}/message
   * 
   * This endpoint:
   * 1. Saves the user's message to the conversation
   * 2. Retrieves relevant knowledge from the RAG knowledge base
   * 3. Includes recent conversation history for context
   * 4. Generates a response using the Ollama LLM
   * 5. Optionally generates TTS audio for the response
   * 6. Saves and returns the AI's response
   * 
   * @param {string} conversationId
   * @param {Object} data - { content: string, include_audio?: boolean, slow_audio?: boolean }
   * @returns {Promise} - ChatMessageResponse { _id, conversation_id, role, content, timestamp, audio_base64?, audio_format?, audio_language?, audio_language_name? }
   */
  sendMessage: (conversationId, data) => {
    // Extended timeout for AI responses (LLM + optional TTS can take 2+ minutes)
    return apiClient.post(`/chat/${conversationId}/message`, data, {
      timeout: 180000, // 3 minutes timeout for AI responses with TTS
    });
  },

  /**
   * Send a message to AI with streaming response.
   * Uses Server-Sent Events (SSE) to stream tokens as they are generated.
   * 
   * @param {string} conversationId
   * @param {Object} data - { content: string, include_audio?: boolean, slow_audio?: boolean }
   * @param {Object} callbacks - { onToken: (token) => void, onComplete: (message) => void, onError: (error) => void }
   * @returns {Promise<void>}
   */
  sendMessageStream: async (conversationId, data, callbacks = {}) => {
    const { onToken, onComplete, onError } = callbacks;
    const profileToken = getProfileToken();
    
    if (!profileToken) {
      onError?.(new Error('No profile token available'));
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/chat/${conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${profileToken}`,
        },
        body: JSON.stringify({
          ...data,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const eventData = JSON.parse(jsonStr);

              if (eventData.token) {
                // Individual token received
                onToken?.(eventData.token);
              } else if (eventData.type === 'message_complete') {
                // Complete message with metadata
                onComplete?.(eventData.message);
              } else if (eventData.type === 'error') {
                // Error during streaming
                onError?.(new Error(eventData.error || 'Streaming error'));
              } else if (eventData.type === 'done') {
                // Stream finished
                // Nothing to do, reader.read() will return done: true
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE event:', jsonStr, parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      onError?.(error);
    }
  },

  /**
   * Upload voice query (Speech to Text processing)
   * Uses form-data
   * Backend: POST /chat/{conversation_id}/audio
   * 
   * Supported formats: WAV, MP3, WebM, OGG, FLAC, M4A
   * Max file size: 10 MB
   * 
   * @param {string} conversationId
   * @param {File|Blob} audioFile - The recorded audio file
   * @param {string} language - Optional language code (e.g., 'hi' for Hindi). Leave empty for auto-detect.
   * @returns {Promise} - AudioTranscriptionResponse { success, transcribed_text, language, language_name, duration_seconds }
   */
  uploadAudio: (conversationId, audioFile, language = null) => {
    const formData = new FormData();
    
    // Ensure the file has a proper name and extension
    const fileName = audioFile.name || `recording_${Date.now()}.webm`;
    formData.append('file', audioFile, fileName);
    
    // Add language if specified
    if (language) {
      formData.append('language', language);
    }

    return apiClient.post(`/chat/${conversationId}/audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000, // 180 seconds for STT processing
    });
  },
};

