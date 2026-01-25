import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Sparkles,
  RefreshCw,
  ChevronRight,
  BookOpen,
  Target,
  Award,
  Users,
  Brain,
} from 'lucide-react';
import { Button, Card, NetworkStatusBadge, LowBandwidthToggle } from '../../components/ui';
import { StreakWidget, XPProgressWidget } from '../../components/gamification';
import { useProfile } from '../../hooks/useProfile';
import { quizzesApi } from '../../api/quizzes';

/**
 * GamificationDashboard Page
 * Full dashboard showing XP, streaks, badges, and leaderboard
 * Engaging visualization of student progress
 */
export default function GamificationDashboard() {
  const navigate = useNavigate();
  const { activeProfile, isProfileSessionValid } = useProfile();
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if no active profile
  useEffect(() => {
    if (!isProfileSessionValid()) {
      navigate('/profiles', { replace: true });
    }
  }, [isProfileSessionValid, navigate]);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await quizzesApi.getLeaderboard('family');
        setLeaderboard(response.data || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        // Don't show error for leaderboard - it's optional
      } finally {
        setLoading(false);
      }
    };

    if (activeProfile) {
      fetchLeaderboard();
    }
  }, [activeProfile]);

  const gamification = activeProfile?.gamification || {
    xp: 0,
    current_streak_days: 0,
    last_activity_date: null,
    badges: [],
  };

  // Badge definitions with emojis and descriptions
  const badgeDefinitions = {
    first_quiz: { emoji: '🎯', name: 'First Steps', description: 'Completed your first quiz' },
    streak_3: { emoji: '🔥', name: 'On Fire', description: '3-day streak' },
    streak_7: { emoji: '💪', name: 'Week Warrior', description: '7-day streak' },
    streak_30: { emoji: '🏆', name: 'Monthly Champion', description: '30-day streak' },
    perfect_score: { emoji: '💯', name: 'Perfectionist', description: 'Got 100% on a quiz' },
    math_wizard: { emoji: '🧮', name: 'Math Wizard', description: 'Mastered math topics' },
    science_star: { emoji: '🔬', name: 'Science Star', description: 'Mastered science topics' },
    early_bird: { emoji: '🌅', name: 'Early Bird', description: 'Quiz before 7 AM' },
    night_owl: { emoji: '🦉', name: 'Night Owl', description: 'Quiz after 10 PM' },
    quick_learner: { emoji: '⚡', name: 'Quick Learner', description: 'Finished quiz in under 2 min' },
    consistent: { emoji: '📆', name: 'Consistent', description: 'Quiz every day for a week' },
    explorer: { emoji: '🗺️', name: 'Explorer', description: 'Learned 5 different topics' },
    level_10: { emoji: '⭐', name: 'Rising Star', description: 'Reached Level 10' },
    level_25: { emoji: '🌟', name: 'Shining Star', description: 'Reached Level 25' },
    level_50: { emoji: '✨', name: 'Superstar', description: 'Reached Level 50' },
  };

  // Get user's earned badges with details
  const earnedBadges = (gamification.badges || []).map(badgeId => ({
    id: badgeId,
    ...(badgeDefinitions[badgeId] || { emoji: '🏅', name: badgeId, description: 'Achievement unlocked' })
  }));

  // Calculate level and stats
  const xpPerLevel = 100;
  const currentLevel = Math.floor(gamification.xp / xpPerLevel) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 overflow-y-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(251,146,60,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white/60" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">My Progress</h1>
              <p className="text-sm text-white/50">
                {activeProfile?.name}'s achievements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NetworkStatusBadge variant="minimal" size="sm" />
            <LowBandwidthToggle size="sm" />
          </div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StreakWidget
              currentStreak={gamification.current_streak_days}
              lastActivityDate={gamification.last_activity_date}
              size="md"
              showDetails={true}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <XPProgressWidget
              xp={gamification.xp}
              xpPerLevel={xpPerLevel}
              size="md"
              showDetails={true}
            />
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mb-8"
        >
          <button
            onClick={() => navigate('/quiz')}
            className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/20 hover:border-violet-400/40 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Daily Quiz</div>
              <div className="text-xs text-white/50">Test your knowledge</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
          </button>

          <button
            onClick={() => navigate('/insights')}
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 hover:border-cyan-400/40 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Insights</div>
              <div className="text-xs text-white/50">AI-powered analytics</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
          </button>

          <button
            onClick={() => navigate('/quiz/revision')}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 hover:border-amber-400/40 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Revision</div>
              <div className="text-xs text-white/50">Review past quizzes</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
          </button>

          <button
            onClick={() => navigate('/chat')}
            className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-400/40 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium text-white">Learn More</div>
              <div className="text-xs text-white/50">Ask DigiMasterJi</div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40 ml-auto" />
          </button>
        </motion.div>

        {/* Badges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Badges Earned ({earnedBadges.length})
          </h2>

          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {earnedBadges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center hover:border-amber-500/30 transition-all">
                    <div className="text-3xl mb-2">{badge.emoji}</div>
                    <div className="text-xs font-medium text-white truncate">{badge.name}</div>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 rounded-lg text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {badge.description}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl mb-4"
              >
                🎖️
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">No Badges Yet</h3>
              <p className="text-sm text-white/50">
                Complete quizzes and maintain streaks to earn badges!
              </p>
            </div>
          )}
        </motion.div>

        {/* Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-400" />
            Family Leaderboard
          </h2>

          {loading ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const isCurrentUser = entry.profile_id === (activeProfile?._id || activeProfile?.id);
                const rankIcon = index === 0 ? <Crown className="w-5 h-5 text-amber-400" /> 
                  : index === 1 ? <Medal className="w-5 h-5 text-slate-300" />
                  : index === 2 ? <Medal className="w-5 h-5 text-amber-600" />
                  : null;

                return (
                  <motion.div
                    key={entry.profile_id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`
                      p-4 rounded-2xl flex items-center gap-4
                      ${isCurrentUser 
                        ? 'bg-gradient-to-r from-violet-500/20 to-indigo-500/10 border-2 border-violet-500/30' 
                        : 'bg-white/5 border border-white/10'
                      }
                    `}
                  >
                    {/* Rank */}
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center font-bold
                      ${index === 0 ? 'bg-amber-500/20 text-amber-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                        index === 2 ? 'bg-amber-600/20 text-amber-600' :
                        'bg-white/10 text-white/60'
                      }
                    `}>
                      {rankIcon || (index + 1)}
                    </div>

                    {/* Profile info */}
                    <div className="flex-1">
                      <div className="font-medium text-white flex items-center gap-2">
                        {entry.name}
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/50">
                        Level {Math.floor(entry.xp / 100) + 1}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right">
                      <div className="font-bold text-violet-400">{entry.xp} XP</div>
                      <div className="text-xs text-orange-400 flex items-center justify-end gap-1">
                        🔥 {entry.streak}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <Trophy className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Rankings Yet</h3>
              <p className="text-sm text-white/50">
                Complete quizzes to appear on the leaderboard!
              </p>
            </div>
          )}
        </motion.div>

        {/* Motivational Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-white/60">
              Keep learning to unlock more achievements!
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
