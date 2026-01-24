import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy, TrendingUp } from 'lucide-react';

/**
 * StreakWidget Component
 * Animated streak flame display with streak history
 * Designed to motivate daily engagement
 */
export default function StreakWidget({ 
  currentStreak = 0,
  bestStreak = 0,
  lastActivityDate = null,
  size = 'md', // 'sm', 'md', 'lg'
  showDetails = true,
  className = '',
}) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'p-3',
      flame: 'text-3xl',
      number: 'text-2xl',
      label: 'text-xs',
    },
    md: {
      container: 'p-4',
      flame: 'text-5xl',
      number: 'text-3xl',
      label: 'text-sm',
    },
    lg: {
      container: 'p-6',
      flame: 'text-7xl',
      number: 'text-4xl',
      label: 'text-base',
    },
  };

  const config = sizeConfig[size];
  const isActive = currentStreak > 0;
  const isOnFire = currentStreak >= 7;

  // Check if streak is at risk (no activity today)
  const today = new Date().toDateString();
  const lastActivity = lastActivityDate ? new Date(lastActivityDate).toDateString() : null;
  const isStreakActive = lastActivity === today;

  // Generate streak history dots (last 7 days)
  const generateStreakDots = () => {
    const dots = [];
    for (let i = 6; i >= 0; i--) {
      const isCompleted = i < currentStreak;
      dots.push(
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.05 * (6 - i) }}
          className={`
            w-3 h-3 rounded-full transition-all duration-300
            ${isCompleted 
              ? 'bg-gradient-to-br from-orange-400 to-red-500 shadow-sm shadow-orange-500/50' 
              : 'bg-white/10 border border-white/20'
            }
          `}
        />
      );
    }
    return dots;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-red-500/10
        backdrop-blur-xl border border-orange-500/20
        ${config.container}
        ${className}
      `}
    >
      {/* Animated background glow for active streaks */}
      {isOnFire && (
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent pointer-events-none"
        />
      )}

      <div className="relative z-10">
        {/* Main display */}
        <div className="flex items-center gap-4">
          {/* Animated flame */}
          <motion.div
            animate={isActive ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            } : {}}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className={`${config.flame} ${!isActive && 'grayscale opacity-30'}`}
          >
            🔥
          </motion.div>

          <div className="flex-1">
            {/* Streak number */}
            <div className="flex items-baseline gap-2">
              <motion.span
                key={currentStreak}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`
                  font-bold bg-gradient-to-r from-orange-400 to-red-500 
                  bg-clip-text text-transparent
                  ${config.number}
                `}
              >
                {currentStreak}
              </motion.span>
              <span className={`text-white/60 ${config.label}`}>
                {currentStreak === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {/* Label */}
            <p className={`text-orange-300/80 ${config.label}`}>
              {isOnFire ? '🔥 On Fire!' : isActive ? 'Keep it going!' : 'Start your streak!'}
            </p>
          </div>

          {/* Streak icon badge */}
          {isOnFire && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-2 right-2"
            >
              <div className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <span className="text-xs font-bold text-white">HOT</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Streak history dots */}
        {showDetails && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40">Last 7 days</span>
              {bestStreak > 0 && (
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  Best: {bestStreak}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {generateStreakDots()}
            </div>
          </div>
        )}

        {/* Streak at risk warning */}
        {isActive && !isStreakActive && showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl"
          >
            <p className="text-xs text-amber-300 flex items-center gap-2">
              <Calendar className="w-3 h-3" />
              Complete today's quiz to keep your streak!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Compact version for headers/toolbars
export function StreakBadge({ streak = 0, className = '' }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
        bg-gradient-to-r from-orange-500/20 to-amber-500/10
        border border-orange-500/20
        ${className}
      `}
    >
      <motion.span
        animate={streak > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-base"
      >
        🔥
      </motion.span>
      <span className="text-sm font-bold text-orange-400">{streak}</span>
    </motion.div>
  );
}
