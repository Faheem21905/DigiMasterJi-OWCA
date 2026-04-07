import { motion } from 'framer-motion';

const variants = {
  default: `
    bg-gradient-to-br from-white/[0.05] to-white/[0.02]
    backdrop-blur-xl border border-white/[0.08]
  `,
  glass: `
    bg-white/[0.03] backdrop-blur-2xl
    border border-white/[0.06]
  `,
  solid: `
    bg-[#0d1224] border border-white/[0.08]
  `,
  glow: `
    bg-gradient-to-br from-white/[0.05] to-white/[0.02]
    backdrop-blur-xl border border-orange-500/20
    shadow-lg shadow-orange-500/5
  `,
  elevated: `
    bg-gradient-to-br from-white/[0.08] to-white/[0.03]
    backdrop-blur-xl border border-white/[0.1]
    shadow-2xl shadow-black/20
  `,
};

const padding = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  padding: p = 'none',
  onClick,
  ...props
}) {
  return (
    <motion.div
      whileHover={hover ? {
        scale: 1.02,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 17 }
      } : {}}
      whileTap={hover ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        rounded-2xl
        transition-all duration-300
        ${variants[variant]}
        ${padding[p]}
        ${hover ? 'cursor-pointer hover:border-white/20' : ''}
        ${glow ? 'hover:shadow-orange-500/10 hover:shadow-xl hover:border-orange-500/30' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}
