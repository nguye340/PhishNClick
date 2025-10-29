/**
 * Debug Utility - Conditional Console Logging for React/Next.js
 * Only logs in development environment
 */

// Check if we're in production
const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// Conditional console.log wrapper
export const debugLog = (...args: any[]): void => {
  if (!isProduction()) {
    console.log(...args);
  }
};

// Conditional console.error wrapper (always show errors)
export const debugError = (...args: any[]): void => {
  console.error(...args);
};

// Conditional console.warn wrapper
export const debugWarn = (...args: any[]): void => {
  if (!isProduction()) {
    console.warn(...args);
  }
};

// Export isProduction for conditional logic
export { isProduction };
