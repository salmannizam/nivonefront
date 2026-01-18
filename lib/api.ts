import axios from 'axios';
import { getFeatureFromPath } from './feature-utils';
import toast from '@/components/Toast';

// Check if feature is enabled (from localStorage cache)
function isFeatureEnabled(featureKey: string): boolean {
  try {
    const cachedFeatures = localStorage.getItem('userFeatures');
    if (cachedFeatures) {
      const features = JSON.parse(cachedFeatures);
      return features[featureKey] !== false;
    }
  } catch (e) {
    // Ignore parse errors
  }
  // Default to true if not cached (will be checked by backend anyway)
  return true;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.12:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

// Request interceptor to check features
api.interceptors.request.use(
  (config) => {
    // Cookies are sent automatically with withCredentials: true
    // No need to manually set Authorization header
    // Tenant is extracted from JWT token on backend, no need to send from frontend

    // Skip feature check for admin routes (Super Admin)
    const url = config.url || '';
    if (url.includes('/admin/')) {
      return config;
    }

    // Skip feature check for dashboard endpoint - it's accessible to all authenticated tenants
    if (url.includes('/reports/dashboard')) {
      return config;
    }

    // Skip feature check for residents API endpoint - it's needed for many features (dropdowns, etc.)
    // Only check feature for the residents page route, not the API endpoint
    // This must happen BEFORE getFeatureFromPath is called
    // Check if URL is exactly /residents (with or without query params, with or without trailing slash)
    const urlPath = url.split('?')[0].split('#')[0].trim(); // Remove query, hash, and whitespace
    const urlPathNormalized = urlPath.endsWith('/') ? urlPath.slice(0, -1) : urlPath;
    
    // Check if it's exactly the residents API endpoint (list endpoint, not a sub-route)
    // Match: /residents, /residents/, residents
    // Don't match: /residents/123, /residents/abc, etc.
    // Use a more explicit check: the path should be exactly '/residents' or 'residents'
    const pathSegments = urlPathNormalized.split('/').filter(Boolean);
    const isResidentsListEndpoint = 
      urlPathNormalized === '/residents' || 
      urlPathNormalized === 'residents' ||
      (pathSegments.length === 1 && pathSegments[0] === 'residents');
    
    if (isResidentsListEndpoint) {
      // Skip feature check - residents API is needed for dropdowns
      // Debug: Uncomment to verify this is being hit
      // console.log('[API Interceptor] Allowing /residents endpoint without feature check:', url);
      return config;
    }

    // Handle payment endpoints more specifically
    if (url.includes('/payments/')) {
      if (url.includes('/payments/extra') || url.includes('/payments/extra?')) {
        // Extra payments endpoint
        const featureKey = 'extraPayments';
        if (!isFeatureEnabled(featureKey)) {
          console.warn(`[API Interceptor] Feature ${featureKey} is not enabled, blocking request to ${url}`);
          toast.error('Permission not allowed: Extra Payments feature is not enabled for your account');
          return Promise.reject({
            response: {
              status: 403,
              data: {
                message: `Feature ${featureKey} is not enabled for your account`,
              },
            },
            isFeatureBlocked: true, // Flag to identify feature-blocked errors
          });
        }
        return config;
      } else if (url.includes('/payments/security-deposits') || url.includes('/payments/security-deposits?')) {
        // Security deposits endpoint
        const featureKey = 'securityDeposits';
        if (!isFeatureEnabled(featureKey)) {
          console.warn(`[API Interceptor] Feature ${featureKey} is not enabled, blocking request to ${url}`);
          toast.error('Permission not allowed: Security Deposits feature is not enabled for your account');
          return Promise.reject({
            response: {
              status: 403,
              data: {
                message: `Feature ${featureKey} is not enabled for your account`,
              },
            },
            isFeatureBlocked: true,
          });
        }
        return config;
      } else if (url.includes('/payments/rent') || url.includes('/payments/rent?')) {
        // Rent payments endpoint
        const featureKey = 'rentPayments';
        if (!isFeatureEnabled(featureKey)) {
          console.warn(`[API Interceptor] Feature ${featureKey} is not enabled, blocking request to ${url}`);
          toast.error('Permission not allowed: Rent Payments feature is not enabled for your account');
          return Promise.reject({
            response: {
              status: 403,
              data: {
                message: `Feature ${featureKey} is not enabled for your account`,
              },
            },
            isFeatureBlocked: true,
          });
        }
        return config;
      }
      // For other payment endpoints, let backend handle feature checks
      return config;
    }

    // Check if feature is enabled for this route
    const featureKey = getFeatureFromPath(url);
    if (featureKey && !isFeatureEnabled(featureKey)) {
      // Double-check: if it's residents endpoint, don't block it (needed for dropdowns)
      // This is a safety net in case the earlier check didn't catch it
      const urlPathCheck = url.split('?')[0].split('#')[0].trim();
      const urlPathNormalizedCheck = urlPathCheck.endsWith('/') ? urlPathCheck.slice(0, -1) : urlPathCheck;
      
      // Check if it's the residents list endpoint (not a sub-route like /residents/123)
      // Use the same explicit check as above
      const pathSegmentsCheck = urlPathNormalizedCheck.split('/').filter(Boolean);
      const isResidentsListEndpointCheck = 
        urlPathNormalizedCheck === '/residents' || 
        urlPathNormalizedCheck === 'residents' ||
        (pathSegmentsCheck.length === 1 && pathSegmentsCheck[0] === 'residents');
      
      if (isResidentsListEndpointCheck) {
        // Debug: Uncomment to verify this safety net is being hit
        // console.log('[API Interceptor] Safety net: Allowing /residents endpoint:', url);
        return config; // Allow residents endpoint even if feature not enabled
      }
      
      // Feature is not enabled - show toast and prevent API call
      console.warn(`[API Interceptor] Feature ${featureKey} is not enabled, blocking request to ${url}`);
      toast.error('Permission not allowed: This feature is not enabled for your account');
      return Promise.reject({
        response: {
          status: 403,
          data: {
            message: `Feature ${featureKey} is not enabled for your account`,
          },
        },
        isFeatureBlocked: true, // Flag to identify feature-blocked errors
      });
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors and avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipRefresh) {
      originalRequest._retry = true;

      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/admin/auth/refresh')) {
        const redirectPath = window.location.pathname.startsWith('/admin') 
          ? '/admin/login' 
          : '/login';
        window.location.href = redirectPath;
        return Promise.reject(error);
      }

      // Don't retry /auth/me or /admin/auth/me - these are used to check auth status
      if (originalRequest.url?.includes('/auth/me') || originalRequest.url?.includes('/admin/auth/me')) {
        return Promise.reject(error);
      }

      try {
        // Determine which refresh endpoint to use based on current path
        const refreshEndpoint = window.location.pathname.startsWith('/admin')
          ? '/admin/auth/refresh'
          : '/auth/refresh';

        // Refresh token is sent automatically via cookie
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}${refreshEndpoint}`,
          {},
          { withCredentials: true },
        );

        // New access token is set in cookie by backend, retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        const redirectPath = window.location.pathname.startsWith('/admin') 
          ? '/admin/login' 
          : '/login';
        window.location.href = redirectPath;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
