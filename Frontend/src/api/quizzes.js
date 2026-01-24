import apiClient from './axios';

/**
 * Quiz & Gamification API
 * Handles the daily streak and AI assessment logic
 */

export const quizzesApi = {
  /**
   * Trigger AI to generate a quiz based on recent chats
   * @param {Object} data - { conversation_id, difficulty }
   */
  generateQuiz: (data) => {
    return apiClient.post('/quizzes/generate', data);
  },

  /**
   * Check if any generated quizzes are ready to be taken
   * @param {string} profileId
   */
  getPendingQuizzes: (profileId) => {
    return apiClient.get('/quizzes/pending', {
      params: { profile_id: profileId },
    });
  },

  /**
   * Get today's quiz for the current profile
   * Returns the daily quiz if available
   */
  getTodayQuiz: () => {
    return apiClient.get('/quizzes/today');
  },

  /**
   * Fetch the actual quiz questions.
   * @param {string} quizId
   */
  getQuizById: (quizId) => {
    return apiClient.get(`/quizzes/${quizId}`);
  },

  /**
   * Submit answers and calculates score and updates XP
   * @param {string} quizId
   * @param {Object} answers - { answers: { q_id: option_id } }
   */
  submitQuiz: (quizId, answers) => {
    return apiClient.post(`/quizzes/${quizId}/submit`, answers);
  },

  /**
   * Get leaderboard data (Family or Global).
   * @param {string} scope - 'family' or 'global' (default is 'family')
   */
  getLeaderboard: (scope = 'family') => {
    return apiClient.get('/leaderboard', {
      params: { scope },
    });
  },
};
