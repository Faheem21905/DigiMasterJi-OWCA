import { motion } from 'framer-motion';

const variants = {
  primary: `
    bg-gradient-to-r from-orange-500 to-orange-600 
    hover:from-orange-400 hover:to-orange-500 
    text-white shadow-lg shadow-orange-500/25
    hover:shadow-orange-500/40 hover:shadow-xl
  `,
  secondary: `
    bg-white/[0.03] hover:bg-white/[0.08] 
    text-white border border-white/10 
    hover:border-white/20 backdrop-blur-xl
  `,
  ghost: `
    bg-transparent hover:bg-white/[0.05] 
    text-white/70 hover:text-white
  `,
  danger: `
    bg-gradient-to-r from-red-500 to-rose-600 
    hover:from-red-400 hover:to-rose-500 
    text-white shadow-lg shadow-red-500/25
  `,
  outline: `
    bg-transparent border-2 border-orange-500/50 
    hover:border-orange-400 text-orange-400 
    hover:text-orange-300 hover:bg-orange-500/10
  `,
  glow: `
    bg-gradient-to-r from-orange-500 to-cyan-500 
    text-white shadow-lg 
    shadow-orange-500/30 hover:shadow-orange-500/50
    animate-gradient bg-[length:200%_200%]
  `,
};

const sizes = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
};

const iconSizes = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled || loading ? 1 : 1.02, y: disabled || loading ? 0 : -1 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-semibold rounded-xl
        transition-all duration-300 ease-out
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      ) : null}
      <span className={`flex items-center gap-2 ${loading ? 'opacity-0' : ''}`}>
        {Icon && iconPosition === 'left' && (
          <Icon className={`${iconSizes[size]} transition-transform group-hover:scale-110`} />
        )}
        {children}
        {Icon && iconPosition === 'right' && (
          <motion.span
            initial={false}
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <Icon className={`${iconSizes[size]}`} />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}
