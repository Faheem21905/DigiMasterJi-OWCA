import { motion } from 'framer-motion';
import { Zap, TrendingUp, Star, Award } from 'lucide-react';

/**
 * XPProgressWidget Component
 * XP progress bar with level indicator
 * Shows progress towards next level
 */
export default function XPProgressWidget({
  xp = 0,
  xpPerLevel = 100,
  size = 'md', // 'sm', 'md', 'lg'
  showDetails = true,
  className = '',
}) {
  // Calculate level and progress
  const currentLevel = Math.floor(xp / xpPerLevel) + 1;
  const xpInCurrentLevel = xp % xpPerLevel;
  const progressPercentage = (xpInCurrentLevel / xpPerLevel) * 100;
  const xpToNextLevel = xpPerLevel - xpInCurrentLevel;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'p-3',
      icon: 'w-8 h-8 text-2xl',
      level: 'text-xl',
      label: 'text-xs',
      bar: 'h-2',
    },
    md: {
      container: 'p-4',
      icon: 'w-12 h-12 text-3xl',
      level: 'text-2xl',
      label: 'text-sm',
      bar: 'h-3',
    },
    lg: {
      container: 'p-6',
      icon: 'w-16 h-16 text-4xl',
      level: 'text-3xl',
      label: 'text-base',
      bar: 'h-4',
    },
  };

  const config = sizeConfig[size];

  // Get level title based on level
  const getLevelTitle = (level) => {
    if (level <= 5) return 'Beginner';
    if (level <= 10) return 'Learner';
    if (level <= 20) return 'Scholar';
    if (level <= 35) return 'Expert';
    if (level <= 50) return 'Master';
    return 'Grandmaster';
  };

  // Get level color based on level
  const getLevelColor = (level) => {
    if (level <= 5) return { gradient: 'from-emerald-400 to-teal-500', text: 'text-emerald-400', bg: 'bg-emerald-500' };
    if (level <= 10) return { gradient: 'from-blue-400 to-cyan-500', text: 'text-blue-400', bg: 'bg-blue-500' };
    if (level <= 20) return { gradient: 'from-violet-400 to-purple-500', text: 'text-violet-400', bg: 'bg-violet-500' };
    if (level <= 35) return { gradient: 'from-amber-400 to-orange-500', text: 'text-amber-400', bg: 'bg-amber-500' };
    if (level <= 50) return { gradient: 'from-rose-400 to-pink-500', text: 'text-rose-400', bg: 'bg-rose-500' };
    return { gradient: 'from-yellow-400 to-amber-500', text: 'text-yellow-400', bg: 'bg-yellow-500' };
  };

  const levelInfo = getLevelColor(currentLevel);
  const levelTitle = getLevelTitle(currentLevel);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-purple-500/10
        backdrop-blur-xl border border-violet-500/20
        ${config.container}
        ${className}
      `}
    >
      <div className="relative z-10">
        {/* Header with icon and level */}
        <div className="flex items-center gap-4 mb-4">
          {/* Level Badge */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className={`
              ${config.icon} rounded-2xl
              bg-gradient-to-br ${levelInfo.gradient}
              flex items-center justify-center
              shadow-lg shadow-violet-500/30
            `}
          >
            <span>⚡</span>
          </motion.div>

          <div className="flex-1">
            {/* Level number */}
            <div className="flex items-baseline gap-2">
              <motion.span
                key={currentLevel}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-bold ${config.level} ${levelInfo.text}`}
              >
                Level {currentLevel}
              </motion.span>
            </div>

            {/* Level title */}
            <p className={`text-white/60 ${config.label}`}>
              {levelTitle}
            </p>
          </div>

          {/* Total XP badge */}
          <div className="text-right">
            <div className={`font-bold ${levelInfo.text} text-lg`}>{xp.toLocaleString()}</div>
            <div className="text-xs text-white/40">Total XP</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className={`relative ${config.bar} bg-white/10 rounded-full overflow-hidden`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${levelInfo.gradient} rounded-full`}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </motion.div>
          </div>
        </div>

        {/* Progress details */}
        {showDetails && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">
              {xpInCurrentLevel} / {xpPerLevel} XP
            </span>
            <span className="text-xs text-white/60 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {xpToNextLevel} XP to Level {currentLevel + 1}
            </span>
          </div>
        )}

        {/* Level up celebration (when close to leveling) */}
        {progressPercentage >= 90 && showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 px-3 py-2 bg-violet-500/20 border border-violet-500/30 rounded-xl"
          >
            <p className="text-xs text-violet-300 flex items-center gap-2">
              <Star className="w-3 h-3" />
              Almost there! You're about to level up! 🎉
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Compact version for headers/toolbars
export function XPBadge({ xp = 0, className = '' }) {
  const level = Math.floor(xp / 100) + 1;
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
        bg-gradient-to-r from-violet-500/20 to-indigo-500/10
        border border-violet-500/20
        ${className}
      `}
    >
      <Zap className="w-4 h-4 text-violet-400" />
      <span className="text-sm font-bold text-violet-400">{xp}</span>
      <span className="text-xs text-white/40">Lvl {level}</span>
    </motion.div>
  );
}

// Mini XP gain indicator for animations
export function XPGainIndicator({ amount, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1 }}
      transition={{ duration: 1.5 }}
      className={`
        absolute pointer-events-none
        px-2 py-1 rounded-lg
        bg-violet-500 text-white text-sm font-bold
        ${className}
      `}
    >
      +{amount} XP
    </motion.div>
  );
}
