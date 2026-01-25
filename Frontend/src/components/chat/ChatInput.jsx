import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Paperclip, Smile, Loader2, Globe } from 'lucide-react';

/**
 * ChatInput Component
 * Text input area with send button and optional voice/attachment/web search buttons
 */
export default function ChatInput({
  onSendMessage,
  onStartRecording,
  disabled = false,
  placeholder = "Type your message...",
  showVoiceButton = true,
  showAttachButton = false,
  enableWebSearch = false,
  onWebSearchToggle,
}) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage?.(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Gradient Border Effect */}
      <div className={`
        absolute -inset-0.5 rounded-2xl
        bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600
        opacity-0 blur transition-opacity duration-300
        ${isFocused ? 'opacity-50' : ''}
      `} />

      {/* Feature Toggle Buttons Row */}
      <div className="flex items-center gap-2 mb-2 px-2">
        {/* Web Search Toggle */}
        {onWebSearchToggle && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onWebSearchToggle}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200
              ${enableWebSearch
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }
            `}
            title={enableWebSearch ? "Web search enabled" : "Enable web search"}
          >
            {enableWebSearch ? (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>Web Search</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                <span>Web Search</span>
              </>
            )}
          </motion.button>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className={`
          relative flex items-end gap-2 p-3
          bg-white/5 backdrop-blur-xl
          border border-white/10 rounded-2xl
          transition-all duration-300
          ${isFocused ? 'border-violet-500/50 bg-white/10' : ''}
        `}
      >
        {/* Attachment Button (Optional) */}
        {showAttachButton && (
          <button
            type="button"
            className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition-all"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        )}

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              w-full bg-transparent text-white placeholder-white/40
              resize-none outline-none
              text-sm sm:text-base
              max-h-32 scrollbar-thin scrollbar-thumb-white/20
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              minHeight: '24px',
              height: 'auto',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
            }}
          />
        </div>

        {/* Emoji Button */}
        <button
          type="button"
          className="p-2 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/10 transition-all hidden sm:block"
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Voice Button */}
        {showVoiceButton && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStartRecording}
            disabled={disabled}
            className="
              p-2.5 rounded-xl
              bg-white/10 text-white/70
              hover:bg-white/20 hover:text-white
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Voice message"
          >
            <Mic className="w-5 h-5" />
          </motion.button>
        )}

        {/* Send Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={!message.trim() || disabled}
          className={`
            p-2.5 rounded-xl
            transition-all duration-200
            ${message.trim() && !disabled
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
            }
          `}
          title="Send message"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </form>

      {/* Character Count (optional, shows when typing) */}
      {message.length > 100 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -top-6 right-2 text-xs text-white/40"
        >
          {message.length} / 5000
        </motion.div>
      )}
    </motion.div>
  );
}
