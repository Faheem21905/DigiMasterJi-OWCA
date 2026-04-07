import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
  className = '',
  disabled = false,
  required = false,
  size = 'md',
  variant = 'default',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const sizes = {
    sm: 'px-3 py-2.5 text-sm',
    md: 'px-4 py-3.5 text-base',
    lg: 'px-5 py-4 text-lg',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconPadding = {
    sm: 'pl-10',
    md: 'pl-12',
    lg: 'pl-14',
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <motion.label
          className="block text-sm font-medium text-white/80 mb-2"
          animate={{ color: isFocused ? 'rgba(249, 115, 22, 0.9)' : 'rgba(255, 255, 255, 0.8)' }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && <span className="text-orange-400 ml-1">*</span>}
        </motion.label>
      )}
      <div className="relative group">
        {Icon && (
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            animate={{
              color: isFocused ? 'rgba(249, 115, 22, 0.8)' : 'rgba(255, 255, 255, 0.4)',
              scale: isFocused ? 1.1 : 1
            }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={iconSizes[size]} />
          </motion.div>
        )}
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full ${sizes[size]}
            ${Icon ? iconPadding[size] : ''}
            ${type === 'password' ? 'pr-12' : ''}
            bg-white/[0.03] backdrop-blur-xl
            border rounded-xl
            text-white placeholder-white/30
            outline-none transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_20px_rgba(244,63,94,0.2)]'
              : isFocused
                ? 'border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)] bg-white/[0.05]'
                : 'border-white/[0.08] hover:border-white/[0.15]'
            }
          `}
          {...props}
        />
        {type === 'password' && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
          >
            {showPassword ? <EyeOff className={iconSizes[size]} /> : <Eye className={iconSizes[size]} />}
          </motion.button>
        )}

        {/* Focus glow effect */}
        <AnimatePresence>
          {isFocused && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-orange-500/10 to-cyan-500/10 blur-xl"
            />
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mt-2 text-sm text-rose-400 flex items-center gap-1"
          >
            <span className="w-1 h-1 rounded-full bg-rose-400" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
