/**
 * Debug Utility - Conditional Console Logging
 * Only logs in development environment
 */

// Check if we're in production (deployed environment)
const isProduction = () => {
  // Check for production indicators
  return (
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1' &&
    !window.location.hostname.includes('local')
  );
};

// Conditional console.log wrapper
const debugLog = (...args) => {
  if (!isProduction()) {
    console.log(...args);
  }
};

// Conditional console.error wrapper (always show errors)
const debugError = (...args) => {
  console.error(...args);
};

// Conditional console.warn wrapper
const debugWarn = (...args) => {
  if (!isProduction()) {
    console.warn(...args);
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.debugLog = debugLog;
  window.debugError = debugError;
  window.debugWarn = debugWarn;
  window.isProduction = isProduction;
}
