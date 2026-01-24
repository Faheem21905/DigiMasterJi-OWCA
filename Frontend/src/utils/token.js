

const ACCESS_TOKEN_KEY = 'access_token';
const ACCESS_TOKEN_EXPIRY_KEY = 'access_token_expires';
const REFRESH_TOKEN_KEY = 'refresh_token';
const PROFILE_TOKEN_KEY = 'profile_access_token';
const PROFILE_TOKEN_EXPIRY_KEY = 'profile_access_token_expires';

// --- Access Token (Parent/Master) ---

export const setAccessToken = (token, expiresAtISO = null) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
  if (expiresAtISO) {
    localStorage.setItem(ACCESS_TOKEN_EXPIRY_KEY, expiresAtISO);
  }
};

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getAccessTokenExpiry = () => {
  return localStorage.getItem(ACCESS_TOKEN_EXPIRY_KEY);
};

export const clearAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_EXPIRY_KEY);
};

// --- Refresh Token ---

export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const clearRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// --- Profile Token  ---

export const setProfileToken = (token, expiresAtISO) => {
  if (token) {
    localStorage.setItem(PROFILE_TOKEN_KEY, token);
  }
  if (expiresAtISO) {
    localStorage.setItem(PROFILE_TOKEN_EXPIRY_KEY, expiresAtISO);
  }
};

export const getProfileToken = () => {
  return localStorage.getItem(PROFILE_TOKEN_KEY);
};

export const clearProfileToken = () => {
  localStorage.removeItem(PROFILE_TOKEN_KEY);
  localStorage.removeItem(PROFILE_TOKEN_EXPIRY_KEY);
};

// --- Validation ---

/**
 * Checks if a token is expired based on its expiry ISO string.
 * @param {string} tokenExpiryISO - The ISO date string of when the token expires.
 * @param {number} graceSeconds - Buffer time in seconds (default 120s).
 * @returns {boolean} - True if expired or invalid, False if valid.
 */
export const isTokenExpired = (tokenExpiryISO, graceSeconds = 120) => {
  if (!tokenExpiryISO) return true;

  const expiryDate = new Date(tokenExpiryISO);
  if (isNaN(expiryDate.getTime())) return true;

  const now = new Date();
  // Calculate expiration time minus grace period
  const expirationWithGrace = new Date(expiryDate.getTime() - graceSeconds * 1000);

  return now >= expirationWithGrace;
};

/**
 * Helper to clear all auth data (logout)
 */
export const clearAllTokens = () => {
  clearAccessToken();
  clearRefreshToken();
  clearProfileToken();
};
