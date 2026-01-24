import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function OtpInput({ length = 6, value, onChange, error }) {
  const inputRefs = useRef([]);
  const [focused, setFocused] = useState(-1);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return;

    const newValue = value.split('');
    newValue[index] = val.slice(-1);
    const result = newValue.join('');
    onChange(result);

    // Auto-focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;
    onChange(pastedData.padEnd(length, ''));
    inputRefs.current[Math.min(pastedData.length, length - 1)]?.focus();
  };

  return (
    <div className="w-full">
      <div className="flex gap-3 justify-center">
        {Array.from({ length }).map((_, index) => (
          <motion.input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            onFocus={() => setFocused(index)}
            onBlur={() => setFocused(-1)}
            whileFocus={{ scale: 1.05 }}
            className={`
              w-12 h-14 sm:w-14 sm:h-16
              text-center text-2xl font-bold
              bg-white/5 border rounded-xl
              text-white
              outline-none transition-all duration-200
              ${error
                ? 'border-rose-500/50'
                : focused === index
                  ? 'border-violet-500 ring-2 ring-violet-500/20 bg-white/10'
                  : 'border-white/10'
              }
            `}
          />
        ))}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-sm text-rose-400 text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
