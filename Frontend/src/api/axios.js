import axios from 'axios';
import {
  getAccessToken,
  getAccessTokenExpiry,
  getRefreshToken,
  getProfileToken,
  setAccessToken,
  setRefreshToken,
  clearAllTokens,
  clearProfileToken,
  isTokenExpired,
} from '../utils/token';

// --- Constants & Configuration ---

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Endpoints that should use the Profile Token (Student/Child)
// These are endpoints where the user is acting AS a profile (chat, quizzes)
// Note: Profile management endpoints (/profiles, /profiles/:id, /profiles/:id/access)
// use the MASTER token since they manage profiles, not act as one
const PROFILE_SCOPED_PATHS = [
  '/chat',
  '/quizzes',
];

/**
 * Determines if a URL is profile-scoped (requires profile token).
 * Profile management endpoints use master token, only chat/quizzes use profile token.
 * @param {string} url 
 * @returns {boolean}
 */
const isProfileScoped = (url) => {
  if (!url) return false;
  
  // Explicitly NOT profile-scoped (use master token):
  // - /profiles (list all profiles)
  // - /profiles/:id (get/update/delete profile)  
  // - /profiles/:id/access (get profile access token)
  if (url.match(/^\/profiles(\/[^/]+)?(\/access)?$/)) {
    return false;
  }
  
  return PROFILE_SCOPED_PATHS.some((path) => url.includes(path));
};

// Create the main Axios instance
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// --- State for Refresh Logic ---

let isRefreshing = false;
let failedQueue = [];

/**
 * Add a request to the queue to be retried after refresh.
 * @param {Function} onRefreshed - Callback when token is refreshed (or failed)
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// --- Callbacks for Context Integration ---
// These will be set by AuthContext/ProfileContext via setupAxiosInterceptors
let onAuthFailure = () => {}; 
let onProfileAuthFailure = () => {}; 

/**
 * Register callback for Master Auth Failure (Logout)
 */
export const setAuthFailureCallback = (callback) => {
  onAuthFailure = callback;
};

/**
 * Register callback for Profile Auth Failure (Profile Session Expired)
 */
export const setProfileAuthFailureCallback = (callback) => {
  onProfileAuthFailure = callback;
};

/**
 * Setup function to inject context callbacks.
 * Call this from your main App or Context provider.
 * @deprecated Use setAuthFailureCallback and setProfileAuthFailureCallback instead
 */
export const setupAxiosInterceptors = (authFailureCallback, profileAuthFailureCallback) => {
  if (authFailureCallback) onAuthFailure = authFailureCallback;
  if (profileAuthFailureCallback) onProfileAuthFailure = profileAuthFailureCallback;
};

// --- Request Interceptor ---

// Track if we're proactively refreshing to avoid race conditions
let isProactivelyRefreshing = false;
let proactiveRefreshPromise = null;

/**
 * Proactively refresh the access token if it's about to expire.
 * This prevents 401 errors by refreshing before expiration.
 */
const proactiveTokenRefresh = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${BASE_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  });

  const { access_token, refresh_token: newRefreshToken, expires_at } = response.data;

  setAccessToken(access_token, expires_at);
  if (newRefreshToken) {
    setRefreshToken(newRefreshToken);
  }

  return access_token;
};

apiClient.interceptors.request.use(
  async (config) => {
    const url = config.url || '';
    
    // Skip token handling for auth endpoints (login, register, refresh)
    if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
      return config;
    }
    
    // 1. Determine which token to use
    let token = null;
    const useProfileToken = isProfileScoped(url);

    if (useProfileToken) {
      // Check if profile token exists and is valid
      const profileToken = getProfileToken();
      const profileExpiry = localStorage.getItem('profile_access_token_expires');
      
      // Requirement: "if profile token expired, it should NOT attach it"
      if (profileToken && !isTokenExpired(profileExpiry)) {
        token = profileToken;
      } else {
        token = getAccessToken();
      }
    } else {
      // Standard auth endpoint - check if access token needs proactive refresh
      const accessToken = getAccessToken();
      const accessExpiry = getAccessTokenExpiry();
      
      // Check if token is expired or about to expire (within grace period)
      if (accessToken && accessExpiry && isTokenExpired(accessExpiry, 120)) {
        // Token is expired or expiring soon, try to refresh proactively
        if (!isProactivelyRefreshing) {
          isProactivelyRefreshing = true;
          proactiveRefreshPromise = proactiveTokenRefresh()
            .then((newToken) => {
              isProactivelyRefreshing = false;
              proactiveRefreshPromise = null;
              return newToken;
            })
            .catch((err) => {
              isProactivelyRefreshing = false;
              proactiveRefreshPromise = null;
              throw err;
            });
        }
        
        try {
          // Wait for the refresh to complete
          if (proactiveRefreshPromise) {
            token = await proactiveRefreshPromise;
          } else {
            token = getAccessToken(); // Refresh already completed
          }
        } catch (refreshError) {
          // Proactive refresh failed, use existing token and let response interceptor handle 401
          token = accessToken;
        }
      } else {
        token = accessToken;
      }
    }

    // 2. Attach Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      const url = originalRequest.url || '';
      
      // Case A: Profile-scoped 401
      // If the request was intended for a profile endpoint, and failed.
      if (isProfileScoped(url)) {
        // Requirement: "clear only profile_access_token... notify ProfileContext... Do NOT clear parent access_token"
        clearProfileToken();
        if (onProfileAuthFailure) {
          onProfileAuthFailure();
        }
        return Promise.reject(error);
      }

      // Case B: Auth/Master 401 (Parent Token Invalid)
      // Requirement: "attempt silent refresh... queue... retry"
      
      if (originalRequest.url.includes('/auth/refresh')) {
        // If the refresh request itself fails, we are done.
        clearAllTokens();
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // No refresh token, cannot refresh.
        clearAllTokens();
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(error);
      }

      try {
       
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken, expires_at } = response.data;

        setAccessToken(access_token, expires_at);
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken);
        }

        // Process queue
        processQueue(null, access_token);
        isRefreshing = false;

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Refresh failed
        processQueue(refreshError, null);
        isRefreshing = false;
        clearAllTokens();
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    // Return other errors
    return Promise.reject(error);
  }
);

export default apiClient;
