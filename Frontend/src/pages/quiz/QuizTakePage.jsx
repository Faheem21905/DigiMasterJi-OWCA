import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Home,
  Brain,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../../components/ui';
import { QuestionCard, QuizProgress, ConfettiEffect } from '../../components/quiz';
import { useProfile } from '../../hooks/useProfile';
import { quizzesApi } from '../../api/quizzes';

/**
 * QuizTakePage Component
 * Interactive quiz-taking experience with animations
 * Designed to be engaging for rural students
 */
export default function QuizTakePage() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { activeProfile, isProfileSessionValid } = useProfile();

  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Timer state
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Results state
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Review mode state
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState({});

  // AI Summary state
  const [quizSummary, setQuizSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [expandedConcept, setExpandedConcept] = useState(null);
  const [showHindi, setShowHindi] = useState(false);

  // Redirect if no active profile
  useEffect(() => {
    if (!isProfileSessionValid()) {
      navigate('/profiles', { replace: true });
    }
  }, [isProfileSessionValid, navigate]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await quizzesApi.getQuizById(quizId);
        setQuiz(response.data);
        setQuestions(response.data.questions || []);
        setIsTimerActive(true);
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError(err.response?.data?.detail || 'Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    if (quizId && activeProfile) {
      fetchQuiz();
    }
  }, [quizId, activeProfile]);

  // Timer
  useEffect(() => {
    let interval;
    if (isTimerActive && !showResults) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, showResults]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper for Hindi/English text
  const getText = (english, hindi) => {
    return showHindi && hindi ? hindi : english;
  };

  // Fetch AI-generated quiz summary
  const fetchQuizSummary = async (quizId) => {
    try {
      setLoadingSummary(true);
      const response = await quizzesApi.generateQuizSummary(quizId);
      setQuizSummary(response.data);
    } catch (err) {
      console.error('Error fetching quiz summary:', err);
      // Don't show error to user, summary is optional enhancement
    } finally {
      setLoadingSummary(false);
    }
  };

  // Current question
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Handle answer selection
  const handleSelectAnswer = (answer) => {
    if (showResults || isReviewMode) return;

    const questionId = currentQuestion.question_id;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Navigation
  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  // Check if all questions answered
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!allAnswered) {
      // Show confirmation for partial submission
      if (!confirm(`You have only answered ${answeredCount} of ${totalQuestions} questions. Submit anyway?`)) {
        return;
      }
    }

    try {
      setSubmitting(true);
      setIsTimerActive(false);
      setError(null);

      const response = await quizzesApi.submitQuiz(quizId, { answers });
      const data = response.data;

      // Transform feedback array into correct_answers map for review mode
      const correctAnswersMap = {};
      if (data.feedback && Array.isArray(data.feedback)) {
        data.feedback.forEach(item => {
          correctAnswersMap[item.question_id] = item.correct_answer;
        });
      }

      // Store results with correct_answers map
      setResults({
        ...data,
        correct_answers: correctAnswersMap,
      });
      setReviewAnswers(answers);
      setShowResults(true);

      // Show confetti for good performance (>= 60%)
      if (data.score >= 60) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }

      // Fetch AI-generated quiz summary in background
      fetchQuizSummary(quizId);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to submit quiz';
      setError(errorMessage);
      setSubmitting(false);
      // Don't set submitting to false in finally if successful - let the results show
      return;
    }
    setSubmitting(false);
  };

  // Enter review mode
  const handleReviewAnswers = () => {
    setIsReviewMode(true);
    setCurrentQuestionIndex(0);
  };

  // Exit quiz
  const handleExitQuiz = () => {
    navigate('/quiz');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>
        <div className="text-center relative z-10">
          <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  // Error state - quiz failed to load
  if (error && !quiz) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>
        <div className="glass-card p-8 text-center max-w-md relative z-10 border-red-500/30">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Oops! Something went wrong</h2>
          <p className="text-red-300 mb-6">{error}</p>
          <Button onClick={() => navigate('/quiz')} variant="secondary">
            Go Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  // No questions state
  if (quiz && (!questions || questions.length === 0)) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>
        <div className="glass-card p-8 text-center max-w-md relative z-10 border-amber-500/30">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Questions Found</h2>
          <p className="text-amber-300 mb-6">This quiz doesn't have any questions yet.</p>
          <Button onClick={() => navigate('/quiz')} variant="secondary">
            Go Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults && results && !isReviewMode) {
    const scorePercentage = results.score || 0;
    const isPassing = scorePercentage >= 60;
    const isExcellent = scorePercentage >= 90;

    return (
      <div className="min-h-screen bg-[#050816] overflow-y-auto">
        <ConfettiEffect isActive={showConfetti} intensity={isExcellent ? 'high' : 'medium'} />

        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.06),transparent_50%)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
          {/* Result Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 text-center"
          >
            {/* Trophy Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="text-7xl mb-6"
            >
              {isExcellent ? '🏆' : isPassing ? '🎉' : '💪'}
            </motion.div>

            {/* Score Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl font-bold text-white mb-2">
                {isExcellent ? 'Excellent!' : isPassing ? 'Great Job!' : 'Keep Learning!'}
              </h1>
              <p className="text-white/60 mb-6">You completed the quiz!</p>
            </motion.div>

            {/* Score Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.6 }}
              className="relative w-40 h-40 mx-auto mb-8"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={isPassing ? '#10B981' : '#F59E0B'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={440}
                  initial={{ strokeDashoffset: 440 }}
                  animate={{ strokeDashoffset: 440 - (440 * scorePercentage / 100) }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className={`text-4xl font-bold ${isPassing ? 'text-emerald-400' : 'text-amber-400'}`}
                >
                  {scorePercentage}%
                </motion.span>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="grid grid-cols-3 gap-4 mb-8"
            >
              <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
                <div className="text-2xl mb-1">✓</div>
                <div className="text-xl font-bold text-emerald-400">
                  {results.correct_count || Math.round(totalQuestions * scorePercentage / 100)}
                </div>
                <div className="text-xs text-white/50">Correct</div>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-xl font-bold text-orange-400">+{results.xp_earned || 0}</div>
                <div className="text-xs text-white/50">XP Earned</div>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.05]">
                <div className="text-2xl mb-1">⏱️</div>
                <div className="text-xl font-bold text-cyan-400">{formatTime(timeElapsed)}</div>
                <div className="text-xs text-white/50">Time Taken</div>
              </div>
            </motion.div>

            {/* Streak Info */}
            {results.streak_maintained && results.streak_days > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-8"
              >
                <p className="text-white/80">
                  🔥 {results.streak_days} day streak maintained! Keep it up!
                </p>
              </motion.div>
            )}

            {/* AI Summary Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mb-8"
            >
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="w-full bg-gradient-to-r from-orange-500/20 to-cyan-500/20 border border-orange-500/30 rounded-2xl p-4 flex items-center justify-between hover:bg-orange-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-orange-400" />
                  <div className="text-left">
                    <h3 className="text-white font-semibold">AI Learning Summary</h3>
                    <p className="text-white/60 text-sm">
                      {loadingSummary ? 'Analyzing your performance...' : 'Personalized insights & study tips'}
                    </p>
                  </div>
                </div>
                {loadingSummary ? (
                  <div className="w-5 h-5 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                ) : showSummary ? (
                  <ChevronUp className="w-5 h-5 text-white/50" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/50" />
                )}
              </button>

              <AnimatePresence>
                {showSummary && quizSummary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/5 rounded-2xl p-5 mt-3 space-y-4">
                      {/* Language Toggle */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => setShowHindi(!showHindi)}
                          className={`px-3 py-1 rounded-lg text-xs transition-all ${showHindi
                              ? 'bg-orange-500 text-white'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                          {showHindi ? 'English' : 'हिंदी'}
                        </button>
                      </div>

                      {/* Summary Text */}
                      <div className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-xl p-4">
                        <p className="text-white/90">
                          {getText(quizSummary.summary_text, quizSummary.summary_text_hindi)}
                        </p>
                      </div>

                      {/* Encouragement */}
                      {quizSummary.encouragement && (
                        <div className="flex items-start gap-3 bg-green-500/10 rounded-xl p-4">
                          <span className="text-2xl">💪</span>
                          <p className="text-green-300">
                            {getText(quizSummary.encouragement, quizSummary.encouragement_hindi)}
                          </p>
                        </div>
                      )}

                      {/* Topics to Review */}
                      {quizSummary.topics_to_review && quizSummary.topics_to_review.length > 0 && (
                        <div>
                          <h4 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" />
                            Topics to Review
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {quizSummary.topics_to_review.map((topic, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-amber-500/10 text-amber-300 rounded-lg text-sm"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Study Tips */}
                      {quizSummary.study_tips && quizSummary.study_tips.length > 0 && (
                        <div>
                          <h4 className="text-cyan-400 font-medium mb-2 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Study Tips
                          </h4>
                          <ul className="space-y-2">
                            {quizSummary.study_tips.map((tip, i) => (
                              <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                                <span className="text-cyan-400 mt-1">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Concepts Explained */}
                      {quizSummary.concepts_explained && quizSummary.concepts_explained.length > 0 && (
                        <div>
                          <h4 className="text-orange-400 font-medium mb-2 flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Concepts Explained
                          </h4>
                          <div className="space-y-2">
                            {quizSummary.concepts_explained.map((concept, i) => (
                              <div
                                key={i}
                                className="bg-white/[0.02] rounded-lg overflow-hidden border border-white/[0.05]"
                              >
                                <button
                                  onClick={() => setExpandedConcept(expandedConcept === i ? null : i)}
                                  className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors"
                                >
                                  <span className="text-white font-medium">{concept.concept}</span>
                                  {expandedConcept === i ? (
                                    <ChevronUp className="w-4 h-4 text-white/50" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-white/50" />
                                  )}
                                </button>
                                <AnimatePresence>
                                  {expandedConcept === i && (
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <p className="px-3 pb-3 text-white/70 text-sm">
                                        {getText(concept.explanation, concept.explanation_hindi)}
                                      </p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Steps */}
                      {quizSummary.next_steps && (
                        <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                          <h4 className="text-cyan-400 font-medium mb-1">What's Next?</h4>
                          <p className="text-white/80 text-sm">{quizSummary.next_steps}</p>
                        </div>
                      )}

                      {/* Link to Full Insights */}
                      <button
                        onClick={() => navigate('/insights')}
                        className="w-full py-3 bg-gradient-to-r from-orange-500/20 to-cyan-500/20 border border-orange-500/30 rounded-xl text-orange-300 hover:bg-orange-500/30 transition-colors text-sm"
                      >
                        View Full Learning Insights →
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                variant="secondary"
                onClick={handleReviewAnswers}
                icon={CheckCircle}
              >
                Review Answers
              </Button>
              <Button
                variant="primary"
                onClick={handleExitQuiz}
                icon={Home}
              >
                Back to Quizzes
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main quiz-taking view
  return (
    <div className="min-h-screen bg-[#050816] flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 py-4 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              if (isReviewMode) {
                setIsReviewMode(false);
              } else if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
                navigate('/quiz');
              }
            }}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>

          <div className="text-center">
            <h1 className="font-semibold text-white text-sm sm:text-base line-clamp-1">
              {quiz?.topic || 'Quiz'}
            </h1>
            {isReviewMode && (
              <span className="text-xs text-orange-400">Review Mode</span>
            )}
          </div>

          <div className="flex items-center gap-2 text-white/60">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && !showResults && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 px-4 py-3 bg-red-500/20 border-b border-red-500/30"
          >
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-red-300" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress */}
      <div className="relative z-10 px-4 py-6">
        <QuizProgress
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          answeredQuestions={Object.fromEntries(
            Object.keys(isReviewMode ? reviewAnswers : answers).map((qId) => {
              const idx = questions.findIndex(q => q.question_id === qId);
              return [idx + 1, true];
            })
          )}
          correctAnswers={isReviewMode ? Object.fromEntries(
            questions.map((q, idx) => [
              idx + 1,
              reviewAnswers[q.question_id] === results?.correct_answers?.[q.question_id]
            ])
          ) : {}}
          showResults={isReviewMode}
        />
      </div>

      {/* Question Card */}
      <div className="relative z-10 flex-1 px-4 pb-32">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <QuestionCard
              key={currentQuestion.question_id}
              question={{
                ...currentQuestion,
                correct_answer: isReviewMode ? results?.correct_answers?.[currentQuestion.question_id] : undefined,
              }}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              selectedAnswer={isReviewMode ? reviewAnswers[currentQuestion.question_id] : answers[currentQuestion.question_id]}
              onSelectAnswer={handleSelectAnswer}
              showResult={isReviewMode}
              isCorrect={isReviewMode && reviewAnswers[currentQuestion.question_id] === results?.correct_answers?.[currentQuestion.question_id]}
              disabled={isReviewMode}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-4 bg-[#050816]/90 backdrop-blur-lg border-t border-white/[0.08]">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <Button
              variant="secondary"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              icon={ChevronLeft}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Question Dots - Mobile */}
            <div className="hidden sm:flex items-center gap-1">
              {questions.slice(
                Math.max(0, currentQuestionIndex - 2),
                Math.min(totalQuestions, currentQuestionIndex + 3)
              ).map((q, i) => {
                const actualIndex = Math.max(0, currentQuestionIndex - 2) + i;
                return (
                  <button
                    key={q.question_id}
                    onClick={() => goToQuestion(actualIndex)}
                    className={`
                      w-8 h-8 rounded-lg text-xs font-bold transition-all
                      ${actualIndex === currentQuestionIndex
                        ? 'bg-orange-500 text-white'
                        : answers[q.question_id]
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-white/10 text-white/40 hover:bg-white/20'
                      }
                    `}
                  >
                    {actualIndex + 1}
                  </button>
                );
              })}
            </div>

            {/* Next/Submit Button */}
            {currentQuestionIndex === totalQuestions - 1 ? (
              isReviewMode ? (
                <Button
                  variant="primary"
                  onClick={handleExitQuiz}
                  icon={Home}
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Done</span>
                  <span className="sm:hidden">Done</span>
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmitQuiz}
                  loading={submitting}
                  disabled={submitting}
                  icon={CheckCircle}
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Submit Quiz</span>
                  <span className="sm:hidden">Submit</span>
                </Button>
              )
            ) : (
              <Button
                variant="primary"
                onClick={goToNextQuestion}
                icon={ChevronRight}
                iconPosition="right"
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Next</span>
              </Button>
            )}
          </div>

          {/* Answer status indicator */}
          {!isReviewMode && (
            <div className="text-center mt-3">
              <span className="text-xs text-white/40">
                {answeredCount} of {totalQuestions} answered
                {allAnswered && ' ✓'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
