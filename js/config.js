/*
  Configuration for Quiznaut AI (Static Deploy)
  Reads configuration from window variables (set by env.js)
*/

const getEnvVar = (key, fallback = '') => {
  if (typeof window !== 'undefined' && window[key]) return window[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  return fallback;
};

// Exposed keys for static hosting (user supplies via env.js)
export const GEMINI_API_KEY = getEnvVar('GEMINI_API_KEY', '');
export const SUPABASE_URL = getEnvVar('SUPABASE_URL', '');
export const SUPABASE_ANON_KEY = getEnvVar('SUPABASE_ANON_KEY', '');

// App Configuration (safe constants)
export const APP_CONFIG = {
  maxQuestions: 15,
  defaultMarksPerQuestion: 1,
  defaultDifficulty: 'Medium',
  defaultQuestionCount: 5,
  apiTimeout: 30000, // 30 seconds
  retryAttempts: 3
};

// Feature flags
export const FEATURES = {
  enableGeminiAI: true,
  enableFallbackQuestions: true,
  enableNegativeMarks: true,
  enableQuestionShuffling: true
};
