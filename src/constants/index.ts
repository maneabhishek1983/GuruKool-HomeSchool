// Application Constants
export const APP_NAME = 'GuruKool HomeSchool';
export const APP_VERSION = '2.0.0';

// Authentication Constants
export const QR_CODE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
export const QR_CODE_REFRESH_INTERVAL = 30 * 1000; // 30 seconds
export const JWT_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Storage Keys
export const STORAGE_KEYS = {
  USER: 'gkh_user_v2',
  AUTH_TOKEN: 'gkh_auth_token_v2',
  SESSIONS: 'gkh_sessions_v2',
  PREFERENCES: 'gkh_preferences_v2',
  OFFLINE_ACTIONS: 'gkh_offline_actions_v2',
  SYNC_STATUS: 'gkh_sync_status_v2',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    QR_GENERATE: '/api/auth/qr/generate',
    QR_VERIFY: '/api/auth/qr/verify',
  },
  SESSIONS: {
    LIST: '/api/sessions',
    CREATE: '/api/sessions',
    UPDATE: '/api/sessions',
    DELETE: '/api/sessions',
  },
  AI: {
    INSIGHTS: '/api/ai/insights',
    RECOMMENDATIONS: '/api/ai/recommendations',
    ANALYTICS: '/api/ai/analytics',
  },
  SYNC: {
    UPLOAD: '/api/sync/upload',
    DOWNLOAD: '/api/sync/download',
    STATUS: '/api/sync/status',
  },
} as const;

// WebSocket Events
export const WS_EVENTS = {
  QR_AUTH_STATUS: 'qr_auth_status',
  SESSION_UPDATE: 'session_update',
  NOTIFICATION: 'notification',
  SYNC_STATUS: 'sync_status',
  AI_INSIGHT: 'ai_insight',
} as const;

// UI Constants
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// AI Configuration
export const AI_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
  MIN_CONFIDENCE: 0.7,
  BATCH_SIZE: 10,
} as const;

// Session Status
export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// User Roles
export const USER_ROLES = {
  PARENT: 'parent',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Sync Priorities
export const SYNC_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;