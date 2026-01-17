import toast from '@/components/Toast';

/**
 * Get user-friendly error message from API error
 */
export function getErrorMessage(error: any, defaultMessage: string): string {
  if (!error) return defaultMessage;

  // Handle API response errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle validation errors
  if (error.response?.data?.errors) {
    const errors = error.response.data.errors;
    if (Array.isArray(errors)) {
      return errors.map((e: any) => e.message || e).join(', ');
    }
    if (typeof errors === 'object') {
      return Object.values(errors).flat().join(', ');
    }
  }

  // Handle network errors
  if (error.message) {
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    return error.message;
  }

  return defaultMessage;
}

/**
 * Show success toast
 */
export function showSuccess(message: string) {
  toast.success(message);
}

/**
 * Show error toast
 */
export function showError(error: any, defaultMessage: string) {
  const message = getErrorMessage(error, defaultMessage);
  toast.error(message);
}

/**
 * Show warning toast
 */
export function showWarning(message: string) {
  toast.warning(message);
}

/**
 * Show info toast
 */
export function showInfo(message: string) {
  toast.info(message);
}

/**
 * Confirm action with better UX
 */
export function confirmAction(
  message: string,
  details?: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmed = window.confirm(
      details ? `${message}\n\n${details}` : message
    );
    resolve(confirmed);
  });
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Log error with detailed information for debugging
 */
export function logError(error: any, context: string) {
  const errorInfo: any = {
    context,
    timestamp: new Date().toISOString(),
  };

  // Handle null/undefined errors
  if (!error) {
    errorInfo.error = 'Error object is null or undefined';
    console.error(`[${context}]`, errorInfo);
    return errorInfo;
  }

  // Extract error message
  if (error.message) {
    errorInfo.message = error.message;
  }

  // Extract response data (from Axios errors or custom rejections)
  if (error.response) {
    errorInfo.response = {
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data,
    };
    // Extract message from response if available
    if (error.response.data?.message) {
      errorInfo.message = error.response.data.message;
    }
  }

  // Extract request info (from Axios config)
  if (error.config) {
    errorInfo.request = {
      url: error.config.url,
      method: error.config.method,
      baseURL: error.config.baseURL,
    };
  }

  // Extract network error info
  if (error.code) {
    errorInfo.code = error.code;
  }

  // Extract name/type
  if (error.name) {
    errorInfo.name = error.name;
  }

  // Extract stack trace if available
  if (error.stack) {
    errorInfo.stack = error.stack;
  }

  // If error is a string
  if (typeof error === 'string') {
    errorInfo.message = error;
  }

  // If error is an object, try to extract all enumerable properties
  if (typeof error === 'object' && error !== null) {
    // Check if it's an empty object
    const keys = Object.keys(error);
    if (keys.length === 0) {
      errorInfo.error = 'Error object is empty {}';
    } else {
      // Include all properties that aren't already extracted
      const extractedKeys = ['message', 'response', 'config', 'code', 'name', 'stack'];
      const additionalProps: any = {};
      keys.forEach((key) => {
        if (!extractedKeys.includes(key)) {
          try {
            additionalProps[key] = error[key];
          } catch (e) {
            additionalProps[key] = '[Unable to serialize]';
          }
        }
      });
      if (Object.keys(additionalProps).length > 0) {
        errorInfo.additionalProperties = additionalProps;
      }
    }
  }

  // If no useful info found, log the raw error (but try to stringify it safely)
  if (Object.keys(errorInfo).length === 2) { // Only context and timestamp
    try {
      errorInfo.rawError = JSON.stringify(error, Object.getOwnPropertyNames(error));
    } catch (e) {
      errorInfo.rawError = String(error);
    }
  }

  console.error(`[${context}]`, errorInfo);
  
  return errorInfo;
}
