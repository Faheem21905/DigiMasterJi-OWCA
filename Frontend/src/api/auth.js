import apiClient from './axios';

// Authentication & Master Account API

export const authApi = {
  /**
   * Send OTP to the user's phone number.
   * @param {string} phone 
   */
  sendOtp: (phone) => {
    return apiClient.post('/auth/send-otp', { phone });
  },

  /**
   * Register a new master account using Phone & OTP.
   * @param {Object} data - { full_name, phone, otp }
   */
  register: (data) => {
    return apiClient.post('/auth/register', data);
  },

  /**
   * Login to the master account.
   * ______________________________________________________________________
   * This is a JSDoc comment. It does not execute at runtime but is used for documentation, editor IntelliSense, type hinting, and auto-generating API docs. 
   * It helps developers and tools understand what parameters a function expects.
   * @param {Object} credentials - { username, password }
   * ________________________________________________________________________
   */
  login: (credentials) => {
    // Often OAuth2 endpoints expect form-urlencoded data, but here it uses JSON.
    // If it requires form-data, use `new URLSearchParams(credentials)`
    return apiClient.post('/auth/token', credentials);
  },

  /**
   * Get master account details and settings.
   */
  getAccountDetails: () => {
    return apiClient.get('/account/me');
  },

  /**
   * Update global settings (e.g., Data Saver Mode).
   * @param {Object} settings - { data_saver_mode: boolean, ... }
   */
  updateSettings: (settings) => {
    return apiClient.put('/account/settings', settings);
  },
};
