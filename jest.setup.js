// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Import jest-dom matchers
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock WebSocket for tests
global.WebSocket = jest.fn(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock fetch for tests
global.fetch = jest.fn();

// --- WebAuthn mocks ---
// PublicKeyCredential exists on `window` in browsers. Default to "available + platform authenticator yes".
// Individual tests can override with `(window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable as jest.Mock).mockResolvedValue(false)`.
if (typeof window !== 'undefined') {
  // @ts-ignore - test-only shim
  window.PublicKeyCredential = window.PublicKeyCredential || function () {};
  // @ts-ignore
  window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable =
    jest.fn().mockResolvedValue(true);
  // @ts-ignore
  window.PublicKeyCredential.isConditionalMediationAvailable = jest
    .fn()
    .mockResolvedValue(true);

  Object.defineProperty(navigator, 'credentials', {
    value: {
      create: jest.fn(),
      get: jest.fn(),
    },
    configurable: true,
    writable: true,
  });
}

// --- getUserMedia mock ---
// Default returns an empty MediaStream-like object. Tests that exercise camera flow
// should override with a custom stream that emits frames.
if (typeof navigator !== 'undefined') {
  const fakeStream = {
    getTracks: () => [{ stop: jest.fn(), kind: 'video' }],
    getVideoTracks: () => [{ stop: jest.fn(), kind: 'video' }],
    getAudioTracks: () => [],
    active: true,
  };
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn().mockResolvedValue(fakeStream),
      enumerateDevices: jest.fn().mockResolvedValue([]),
    },
    configurable: true,
    writable: true,
  });
}

// --- isSecureContext ---
// face/biometric features gate on HTTPS. Default to true in tests.
if (typeof window !== 'undefined' && !('isSecureContext' in window)) {
  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });
}

// Mock timers
// jest.useFakeTimers() - Removed to prevent global timeouts. Enable explicitly in tests if needed.
