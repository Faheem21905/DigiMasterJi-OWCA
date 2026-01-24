import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  BookOpen,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  GraduationCap,
  Trophy,
} from 'lucide-react';
import { Button, NetworkStatusBadge } from '../../components/ui';
import { useProfile } from '../../hooks/useProfile';
import { quizzesApi } from '../../api/quizzes';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';

/**
 * LearningInsightsPage Component
 * Displays AI-powered learning analytics and recommendations for students
 * Shows subject-wise performance, weak topics, and personalized study tips
 */
export default function LearningInsightsPage() {
  const navigate = useNavigate();
  const { activeProfile, isProfileSessionValid } = useProfile();
  const { isOnline } = useNetworkStatus();
  
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [expandedWeakTopic, setExpandedWeakTopic] = useState(null);
  const [showHindi, setShowHindi] = useState(false);
  const [analysisRange, setAnalysisRange] = useState(30); // Days

  // Redirect if no active profile
  useEffect(() => {
    if (!isProfileSessionValid()) {
      navigate('/profiles', { replace: true });
    }
  }, [isProfileSessionValid, navigate]);

  // Fetch insights on mount
  useEffect(() => {
    if (activeProfile && isOnline) {
      fetchInsights();
    } else if (!isOnline) {
      setLoading(false);
      setError('Learning insights require an internet connection. Please connect to the internet.');
    }
  }, [activeProfile, analysisRange, isOnline]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await quizzesApi.getLearningInsights(analysisRange);
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching learning insights:', err);
      setError('Failed to load learning insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  const toggleSubjectExpansion = (subject) => {
    setExpandedSubject(expandedSubject === subject ? null : subject);
  };

  const toggleWeakTopicExpansion = (topic) => {
    setExpandedWeakTopic(expandedWeakTopic === topic ? null : topic);
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'declining':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'strong':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'average':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'weak':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'excellent':
        return 'from-green-500 to-emerald-500';
      case 'good':
        return 'from-blue-500 to-cyan-500';
      case 'average':
        return 'from-yellow-500 to-orange-500';
      case 'needs_improvement':
        return 'from-red-500 to-pink-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  const getText = (english, hindi) => {
    return showHindi && hindi ? hindi : english;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Brain className="w-16 h-16 text-violet-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white/70 text-lg">Analyzing your learning journey...</p>
          <p className="text-white/50 text-sm mt-2">आपकी सीखने की यात्रा का विश्लेषण...</p>
        </motion.div>
      </div>
    );
  }

  // No Data State
  if (insights && !insights.has_data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.15),transparent_50%)]" />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Learning Insights</h1>
              <p className="text-white/60">AI-powered analysis</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl p-8 text-center"
          >
            <BookOpen className="w-16 h-16 text-violet-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {insights.message || "No quiz data available yet"}
            </h2>
            <p className="text-white/60 mb-6">
              {insights.message_hindi || "अभी तक कोई क्विज़ डेटा उपलब्ध नहीं है"}
            </p>
            <Button
              onClick={() => navigate('/quiz')}
              className="bg-gradient-to-r from-violet-500 to-purple-500"
            >
              <Target className="w-4 h-4 mr-2" />
              Take Your First Quiz
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

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
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Brain className="w-7 h-7 text-violet-400" />
                Learning Insights
              </h1>
              <p className="text-white/60">
                {insights?.profile_name && `For ${insights.profile_name}`} • {insights?.grade_level || 'Student'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NetworkStatusBadge />
            <button
              onClick={handleRefresh}
              disabled={refreshing || !isOnline}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Language Toggle */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex gap-2">
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setAnalysisRange(days)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  analysisRange === days
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowHindi(!showHindi)}
            className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
              showHindi
                ? 'bg-orange-500 text-white'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {showHindi ? 'English' : 'हिंदी'}
          </button>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{error}</p>
            </div>
          </motion.div>
        )}

        {insights && (
          <>
            {/* Overall Assessment Card */}
            {insights.overall_assessment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden rounded-2xl p-6 mb-6 bg-gradient-to-r ${getLevelColor(insights.overall_assessment.level)}`}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="w-8 h-8 text-white" />
                    <div>
                      <h2 className="text-xl font-bold text-white">Overall Assessment</h2>
                      <p className="text-white/80 capitalize">{insights.overall_assessment.level?.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <p className="text-white text-lg">
                    {getText(insights.overall_assessment.summary, insights.overall_assessment.summary_hindi)}
                  </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </motion.div>
            )}

            {/* Stats Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mb-6"
            >
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-violet-400">{insights.total_quizzes || 0}</div>
                <div className="text-white/60 text-sm">Quizzes Taken</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-cyan-400">{insights.overall_average || 0}%</div>
                <div className="text-white/60 text-sm">Average Score</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-center flex flex-col items-center">
                <div className="flex items-center gap-2">
                  {getTrendIcon(insights.performance_trend)}
                  <span className="text-xl font-bold text-white capitalize">
                    {insights.performance_trend || 'Neutral'}
                  </span>
                </div>
                <div className="text-white/60 text-sm">Trend</div>
              </div>
            </motion.div>

            {/* Subject Insights */}
            {insights.subject_insights && insights.subject_insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-400" />
                  Subject-wise Analysis
                </h3>
                <div className="space-y-3">
                  {insights.subject_insights.map((subject, index) => (
                    <motion.div
                      key={subject.subject}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white/5 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSubjectExpansion(subject.subject)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(subject.status)}`}>
                            {subject.status?.toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{subject.subject}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white/70">{subject.score_average?.toFixed(1) || 0}%</span>
                          {expandedSubject === subject.subject ? (
                            <ChevronUp className="w-5 h-5 text-white/50" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-white/50" />
                          )}
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {expandedSubject === subject.subject && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-4 space-y-3">
                              <div>
                                <p className="text-violet-400 text-sm mb-1">Recommendation:</p>
                                <p className="text-white/80">
                                  {getText(subject.recommendation, subject.recommendation_hindi)}
                                </p>
                              </div>
                              {subject.improvement_areas && subject.improvement_areas.length > 0 && (
                                <div>
                                  <p className="text-orange-400 text-sm mb-2">Areas to improve:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {subject.improvement_areas.map((area, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-1 bg-orange-500/10 text-orange-300 rounded-lg text-sm"
                                      >
                                        {area}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weak Topics Explanation */}
            {insights.weak_topics_explanation && insights.weak_topics_explanation.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  Topics to Focus On
                </h3>
                <div className="space-y-3">
                  {insights.weak_topics_explanation.map((topic, index) => (
                    <motion.div
                      key={`${topic.topic}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white/5 rounded-xl overflow-hidden"
                    >
                      <button
                        onClick={() => toggleWeakTopicExpansion(`${topic.topic}-${index}`)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                          <div className="text-left">
                            <span className="text-white font-medium">{topic.topic}</span>
                            <span className="text-white/50 text-sm ml-2">• {topic.subject}</span>
                          </div>
                        </div>
                        {expandedWeakTopic === `${topic.topic}-${index}` ? (
                          <ChevronUp className="w-5 h-5 text-white/50" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white/50" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedWeakTopic === `${topic.topic}-${index}` && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10"
                          >
                            <div className="p-4 space-y-4">
                              <div className="bg-blue-500/10 rounded-lg p-3">
                                <p className="text-blue-400 text-sm mb-1">Why it matters:</p>
                                <p className="text-white/80">{topic.why_important}</p>
                              </div>
                              <div className="bg-violet-500/10 rounded-lg p-3">
                                <p className="text-violet-400 text-sm mb-1">Simple Explanation:</p>
                                <p className="text-white/80">
                                  {getText(topic.simple_explanation, topic.simple_explanation_hindi)}
                                </p>
                              </div>
                              <div className="bg-green-500/10 rounded-lg p-3">
                                <p className="text-green-400 text-sm mb-1">Practice Tip:</p>
                                <p className="text-white/80">{topic.practice_tip}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Strengths */}
            {insights.strengths && insights.strengths.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Your Strengths
                </h3>
                <div className="grid gap-3">
                  {insights.strengths.map((strength, index) => (
                    <motion.div
                      key={`${strength.area}-${index}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                        <div>
                          <h4 className="text-green-400 font-medium">{strength.area}</h4>
                          <p className="text-white/70 mt-1">
                            {getText(strength.praise, strength.praise_hindi)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly Goals */}
            {insights.weekly_goals && insights.weekly_goals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Weekly Goals
                </h3>
                <div className="space-y-3">
                  {insights.weekly_goals.map((goal, index) => (
                    <motion.div
                      key={`${goal.goal}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white/5 rounded-xl p-4 flex items-center gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">
                          {getText(goal.goal, goal.goal_hindi)}
                        </p>
                        <p className="text-white/50 text-sm mt-1">{goal.subject}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Motivational Message */}
            {insights.motivational_message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl p-6 text-center border border-violet-500/20"
              >
                <Award className="w-12 h-12 text-violet-400 mx-auto mb-4" />
                <p className="text-white text-lg font-medium">
                  {getText(insights.motivational_message, insights.motivational_message_hindi)}
                </p>
                {insights.generated_at && (
                  <p className="text-white/50 text-sm mt-4 flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Generated: {new Date(insights.generated_at).toLocaleString()}
                  </p>
                )}
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex gap-4"
            >
              <Button
                onClick={() => navigate('/quiz')}
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500"
              >
                <Target className="w-4 h-4 mr-2" />
                Take a Quiz
              </Button>
              <Button
                onClick={() => navigate('/quiz/revision')}
                variant="secondary"
                className="flex-1 bg-white/5 hover:bg-white/10"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Review Past Quizzes
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
