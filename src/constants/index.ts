// WebSocket Events
export const WS_EVENTS = {
  // Authentication events
  QR_AUTH_STATUS: 'qr_auth_status',
  QR_GENERATE_REQUEST: 'qr_generate_request',
  QR_VERIFY_REQUEST: 'qr_verify_request',

  // Session events
  SESSION_UPDATE: 'session_update',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',

  // Communication events
  MESSAGE: 'message',
  NOTIFICATION: 'notification',
  TYPING_INDICATOR: 'typing_indicator',
  READ_RECEIPT: 'read_receipt',

  // System events
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_RESPONSE: 'heartbeat_response',
  SYNC_STATUS: 'sync_status',
  AI_INSIGHT: 'ai_insight',

  // Real-time events
  REALTIME_MESSAGE: 'realtime_message',
  MESSAGE_ACK: 'message_ack',
  DELIVERY_CONFIRMATION: 'delivery_confirmation',

  // Location events
  LOCATION_UPDATE: 'location_update',
  LOCATION_VERIFY: 'location_verify',

  // Error events
  ERROR: 'error',
  CONNECTION_ERROR: 'connection_error',
  AUTH_ERROR: 'auth_error',
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
  USERS: {
    PROFILE: '/api/users/profile',
    PREFERENCES: '/api/users/preferences',
    SESSIONS: '/api/users/sessions',
  },
  SESSIONS: {
    LIST: '/api/sessions',
    CREATE: '/api/sessions',
    UPDATE: '/api/sessions/:id',
    DELETE: '/api/sessions/:id',
    ANALYTICS: '/api/sessions/:id/analytics',
  },
  AI: {
    INSIGHTS: '/api/ai/insights',
    RECOMMENDATIONS: '/api/ai/recommendations',
    PATTERNS: '/api/ai/patterns',
  },
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  OFFLINE_QUEUE: 'offline_queue',
  SYNC_STATUS: 'sync_status',
  CACHED_DATA: 'cached_data',
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // QR Code errors
  QR_EXPIRED: 'QR_EXPIRED',
  QR_INVALID: 'QR_INVALID',
  QR_ALREADY_USED: 'QR_ALREADY_USED',

  // Session errors
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_CONFLICT: 'SESSION_CONFLICT',
  SESSION_INVALID_STATUS: 'SESSION_INVALID_STATUS',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
} as const;

// User Roles
export const USER_ROLES = {
  PARENT: 'parent',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

// Session Status
export const SESSION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  SESSION_REMINDER: 'session_reminder',
  SESSION_STARTED: 'session_started',
  SESSION_COMPLETED: 'session_completed',
  SESSION_CANCELLED: 'session_cancelled',
  MESSAGE_RECEIVED: 'message_received',
  AI_INSIGHT: 'ai_insight',
  SYSTEM_UPDATE: 'system_update',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
} as const;

// Breakpoints (in pixels)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Default Values
export const DEFAULTS = {
  SESSION_DURATION: 60, // minutes
  QR_EXPIRY_TIME: 5, // minutes
  HEARTBEAT_INTERVAL: 30, // seconds
  RECONNECT_INTERVAL: 5, // seconds
  MAX_RECONNECT_ATTEMPTS: 10,
  MESSAGE_TIMEOUT: 30, // seconds
  TYPING_TIMEOUT: 3, // seconds
  MAX_QUEUE_SIZE: 1000,
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
} as const;

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  MESSAGE_MAX_LENGTH: 1000,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]+$/,
} as const;

export default {
  WS_EVENTS,
  API_ENDPOINTS,
  STORAGE_KEYS,
  ERROR_CODES,
  USER_ROLES,
  SESSION_STATUS,
  NOTIFICATION_TYPES,
  PRIORITY_LEVELS,
  THEMES,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
  DEFAULTS,
  FILE_UPLOAD,
  VALIDATION,
};
