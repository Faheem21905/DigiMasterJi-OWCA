import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Flame, 
  Star, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Zap,
  History,
} from 'lucide-react';
import { Button, Card, NetworkStatusBadge, LowBandwidthToggle } from '../../components/ui';
import { useProfile } from '../../hooks/useProfile';
import { quizzesApi } from '../../api/quizzes';

/**
 * QuizListPage Component
 * Displays available and completed quizzes for the user
 * Shows daily quiz status and gamification stats
 */
export default function QuizListPage() {
  const navigate = useNavigate();
  const { activeProfile, isProfileSessionValid } = useProfile();
  
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [todayQuiz, setTodayQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if no active profile
  useEffect(() => {
    if (!isProfileSessionValid()) {
      navigate('/profiles', { replace: true });
    }
  }, [isProfileSessionValid, navigate]);

  // Fetch quizzes on mount
  useEffect(() => {
    if (activeProfile) {
      fetchQuizzes();
    }
  }, [activeProfile]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch today's quiz
      try {
        const todayRes = await quizzesApi.getTodayQuiz();
        setTodayQuiz(todayRes.data);
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Error fetching today quiz:', err);
        }
        setTodayQuiz(null);
      }

      // Fetch pending quizzes
      try {
        const pendingRes = await quizzesApi.getPendingQuizzes(activeProfile._id || activeProfile.id);
        setPendingQuizzes(pendingRes.data || []);
      } catch (err) {
        console.error('Error fetching pending quizzes:', err);
        setPendingQuizzes([]);
      }

    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuizzes();
    setRefreshing(false);
  };

  const formatQuizDate = (dateStr) => {
    const quizDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (quizDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (quizDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return quizDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const handleStartQuiz = (quiz) => {
    const quizId = quiz._id || quiz.id;
    navigate(`/quiz/${quizId}`);
  };

  const gamification = activeProfile?.gamification || {
    xp: 0,
    current_streak_days: 0,
    badges: [],
  };

  // Calculate level from XP (simple formula)
  const calculateLevel = (xp) => Math.floor(xp / 100) + 1;
  const currentLevel = calculateLevel(gamification.xp);
  const xpForNextLevel = currentLevel * 100;
  const xpProgress = (gamification.xp % 100);

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
              <h1 className="text-2xl font-bold text-white">Daily Quiz</h1>
              <p className="text-sm text-white/50">Test your knowledge!</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NetworkStatusBadge variant="minimal" size="sm" />
            <LowBandwidthToggle size="sm" />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-white/60 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {/* Streak Card */}
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/10 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-4 text-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl mb-1"
            >
              🔥
            </motion.div>
            <div className="text-2xl font-bold text-orange-400">{gamification.current_streak_days}</div>
            <div className="text-xs text-white/50">Day Streak</div>
          </div>

          {/* XP Card */}
          <div className="bg-gradient-to-br from-violet-500/20 to-indigo-500/10 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">⚡</div>
            <div className="text-2xl font-bold text-violet-400">{gamification.xp}</div>
            <div className="text-xs text-white/50">Total XP</div>
          </div>

          {/* Level Card */}
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-4 text-center">
            <div className="text-3xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-emerald-400">Lvl {currentLevel}</div>
            <div className="text-xs text-white/50">{100 - xpProgress} XP to next</div>
          </div>
        </motion.div>

        {/* Today's Quiz Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-400" />
            Today's Quiz
          </h2>

          {loading ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4" />
                <p className="text-white/50">Loading today's quiz...</p>
              </div>
            </div>
          ) : todayQuiz ? (
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`
                relative overflow-hidden rounded-2xl p-6 cursor-pointer
                ${todayQuiz.status === 'completed' 
                  ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30' 
                  : 'bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-violet-500/30'
                }
              `}
              onClick={() => todayQuiz.status !== 'completed' && handleStartQuiz(todayQuiz)}
            >
              {/* Decorative sparkles */}
              <div className="absolute top-4 right-4">
                <Sparkles className="w-6 h-6 text-violet-400/50" />
              </div>

              <div className="flex items-start gap-4">
                <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center
                  ${todayQuiz.status === 'completed' 
                    ? 'bg-emerald-500' 
                    : 'bg-gradient-to-br from-violet-500 to-indigo-600'
                  }
                `}>
                  {todayQuiz.status === 'completed' ? (
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  ) : (
                    <BookOpen className="w-7 h-7 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white">{todayQuiz.topic}</h3>
                    {todayQuiz.status === 'completed' && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 mb-3">
                    {todayQuiz.total_questions} questions • {todayQuiz.difficulty} difficulty
                  </p>

                  {todayQuiz.status === 'completed' ? (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-sm text-white/80">
                          Score: <span className="font-bold text-amber-400">{todayQuiz.score}%</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-violet-400" />
                        <span className="text-sm text-white/80">
                          +{todayQuiz.xp_earned} XP
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={ChevronRight}
                      iconPosition="right"
                    >
                      Start Quiz
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl mb-4"
              >
                📚
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">No Quiz Today Yet</h3>
              <p className="text-sm text-white/50 mb-4">
                Your daily quiz is being prepared. Check back soon!
              </p>
              <p className="text-xs text-white/40">
                Quizzes are generated based on your recent learning conversations
              </p>
            </div>
          )}
        </motion.div>

        {/* Pending Quizzes Section */}
        {pendingQuizzes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Pending Quizzes ({pendingQuizzes.length})
            </h2>

            <div className="space-y-3">
              {pendingQuizzes.map((quiz, index) => {
                const isMissedQuiz = quiz.is_backlog || (quiz.quiz_date && new Date(quiz.quiz_date).toDateString() !== new Date().toDateString());
                return (
                <motion.div
                  key={quiz._id || quiz.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  onClick={() => handleStartQuiz(quiz)}
                  className={`backdrop-blur-xl rounded-2xl p-4 cursor-pointer transition-all ${
                    isMissedQuiz 
                      ? 'bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40' 
                      : 'bg-white/5 border border-white/10 hover:border-violet-500/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isMissedQuiz 
                        ? 'bg-gradient-to-br from-orange-400 to-red-500' 
                        : 'bg-gradient-to-br from-amber-400 to-orange-500'
                    }`}>
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-white flex items-center gap-2">
                        {quiz.topic}
                        {isMissedQuiz && (
                          <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded-full">
                            Missed
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatQuizDate(quiz.quiz_date)}
                        </span>
                        <span>•</span>
                        <span>{quiz.total_questions} questions</span>
                        <span>•</span>
                        <span>{quiz.difficulty}</span>
                      </div>
                      {isMissedQuiz && (
                        <p className="text-xs text-orange-400/70 mt-1">
                          Won't affect streak
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </div>
                </motion.div>
                );})}
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Revision Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <button
            onClick={() => navigate('/quiz/revision')}
            className="w-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 hover:from-indigo-500/20 hover:to-violet-500/20 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">Review Past Quizzes</h3>
                  <p className="text-sm text-white/50">Revise your completed quizzes</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/40" />
            </div>
          </button>
        </motion.div>

        {/* Motivational Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 backdrop-blur-xl border border-violet-500/20 rounded-2xl p-6 text-center"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-4xl mb-3"
          >
            💡
          </motion.div>
          <h3 className="text-lg font-semibold text-white mb-2">Keep Learning!</h3>
          <p className="text-sm text-white/60">
            Complete quizzes daily to maintain your streak and earn more XP.
            The more you learn, the higher you climb!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
