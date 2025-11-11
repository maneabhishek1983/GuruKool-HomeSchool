'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRAuthState, User, AIInsight } from '@/types';
import { qrAuthService } from '@/services/qr-auth.service';
import { wsService } from '@/services/websocket.service';
import { useAuthContext } from '@/lib/authContext';
import { AuthStatusIndicator, AuthStatusCard } from './AuthStatusIndicator';
import { AIAuthFlow } from './AIAuthFlow';
import { FallbackAuth } from './FallbackAuth';

interface QRAuthContextType {
  qrAuthState: QRAuthState;
  generateQR: () => Promise<void>;
  refreshQR: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  aiInsights: AIInsight[];
  showFallback: boolean;
  setShowFallback: (show: boolean) => void;
}

const QRAuthContext = createContext<QRAuthContextType>({
  qrAuthState: {
    qrCode: '',
    isScanning: false,
    authStatus: 'pending',
  },
  generateQR: async () => {},
  refreshQR: async () => {},
  isLoading: false,
  error: null,
  clearError: () => {},
  aiInsights: [],
  showFallback: false,
  setShowFallback: () => {},
});

export const useQRAuth = () => useContext(QRAuthContext);

interface QRAuthProviderProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function QRAuthProvider({
  children,
  autoRefresh = true,
  refreshInterval = 30000,
}: QRAuthProviderProps) {
  const { login } = useAuthContext();
  const [qrAuthState, setQRAuthState] = useState<QRAuthState>({
    qrCode: '',
    isScanning: false,
    authStatus: 'pending',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showFallback, setShowFallback] = useState(false);

  /**
   * Generate new QR code
   */
  const generateQR = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('🔄 Starting QR code generation...');

    try {
      // Generate QR code with placeholder user info (real email/role will be set after scan)
      console.log('🎯 Calling QR auth service...');
      const tempEmail = `qr-login-${Date.now()}@temp.local`;
      const qrToken = await qrAuthService.generateQRToken(tempEmail, 'parent');
      console.log('✅ QR token generated (real QR code for iOS)');

      const newSessionId = `session-${Date.now()}`;

      setQRAuthState(prev => ({
        ...prev,
        qrCode: qrToken,
        authStatus: 'pending',
      }));

      setSessionId(newSessionId);

      // Connect to WebSocket for real-time updates (skip in development)
      let unsubscribe = () => {};

      try {
        await wsService.connect();

        // Subscribe to authentication status updates
        unsubscribe = wsService.subscribeToQRAuth(newSessionId, data => {
          setQRAuthState(prev => ({
            ...prev,
            authStatus: data.status,
            user: data.user,
          }));

          // Handle successful authentication
          if (data.status === 'success' && data.user) {
            // User is already authenticated via QR, no need to call login
            // The auth context will be updated via the WebSocket callback
            clearRefreshTimer();
          }
        });
      } catch (wsError) {
        console.warn(
          'WebSocket connection failed, continuing without real-time updates:',
          wsError
        );
      }

      // Set up auto-refresh if enabled
      if (autoRefresh) {
        const timer = setTimeout(() => {
          generateQR();
        }, refreshInterval);
        setRefreshTimer(timer);
      }

      // Clean up subscription after QR expires
      setTimeout(() => {
        unsubscribe();
        if (qrAuthState.authStatus === 'pending') {
          setQRAuthState(prev => ({
            ...prev,
            authStatus: 'expired',
          }));
        }
      }, 300000); // 5 minutes
    } catch (err) {
      console.error('❌ QR service failed:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate QR code';

      // Fallback: Generate a simple QR code directly
      try {
        console.log('🔧 Attempting fallback QR generation...');
        const fallbackData = {
          type: 'fallback_auth',
          sessionId: `fallback-${Date.now()}`,
          timestamp: Date.now(),
          version: '1.0',
        };

        const QRCode = (await import('qrcode')).default;
        const fallbackQRCode = await QRCode.toDataURL(
          JSON.stringify(fallbackData),
          {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
              dark: '#1f2937',
              light: '#ffffff',
            },
            width: 256,
          }
        );

        console.log('✅ Fallback QR generated successfully');

        setQRAuthState(prev => ({
          ...prev,
          qrCode: fallbackQRCode,
          authStatus: 'pending',
        }));

        setSessionId(fallbackData.sessionId);
        setShowFallback(true);
      } catch (fallbackErr) {
        console.error('❌ Fallback QR generation also failed:', fallbackErr);
        setError('QR code generation failed. Please try again.');
        setQRAuthState(prev => ({
          ...prev,
          authStatus: 'error',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    autoRefresh,
    refreshInterval,
    login,
    qrAuthService,
    qrAuthState.authStatus,
  ]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear refresh timer
   */
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
  }, [refreshTimer]);

  /**
   * Refresh QR code manually
   */
  const refreshQR = useCallback(async () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      setRefreshTimer(null);
    }
    await generateQR();
  }, [refreshTimer, generateQR]);

  // Initialize QR generation on mount
  useEffect(() => {
    generateQR();

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        setRefreshTimer(null);
      }
      wsService.disconnect();
    };
  }, [generateQR, refreshTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        setRefreshTimer(null);
      }
    };
  }, [refreshTimer]);

  const contextValue: QRAuthContextType = {
    qrAuthState,
    generateQR,
    refreshQR,
    isLoading,
    error,
    clearError,
    aiInsights,
    showFallback,
    setShowFallback,
  };

  return (
    <QRAuthContext.Provider value={contextValue}>
      {children}
    </QRAuthContext.Provider>
  );
}

/**
 * QR Code Display Component with premium animations
 */
interface QRCodeDisplayProps {
  className?: string;
  showStatus?: boolean;
  showRefreshButton?: boolean;
}

export function QRCodeDisplay({
  className = '',
  showStatus = true,
  showRefreshButton = true,
}: QRCodeDisplayProps) {
  const {
    qrAuthState,
    refreshQR,
    isLoading,
    error,
    clearError,
    aiInsights,
    showFallback,
    setShowFallback,
  } = useQRAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success-600';
      case 'expired':
        return 'text-warning-600';
      case 'error':
        return 'text-error-600';
      default:
        return 'text-primary-600';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Scan QR code with your mobile device';
      case 'success':
        return 'Authentication successful!';
      case 'expired':
        return 'QR code expired. Please refresh.';
      case 'error':
        return 'Authentication failed. Please try again.';
      default:
        return 'Preparing QR code...';
    }
  };

  if (showFallback) {
    return (
      <FallbackAuth
        onSuccess={() => setShowFallback(false)}
        onCancel={() => setShowFallback(false)}
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main QR Display */}
      <div className="flex flex-col items-center space-y-6">
        {/* QR Code Container */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="relative p-6 bg-white rounded-3xl shadow-soft border border-neutral-200">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-64 h-64 flex items-center justify-center"
                >
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </motion.div>
              ) : qrAuthState.qrCode ? (
                <div className="relative">
                  <motion.img
                    key="qr-code"
                    src={qrAuthState.qrCode}
                    alt="QR Code for Authentication"
                    className="w-64 h-64 rounded-xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  />
                  {showFallback && (
                    <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      Test Mode
                    </div>
                  )}
                </div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-64 h-64 flex items-center justify-center bg-neutral-100 rounded-xl"
                >
                  <span className="text-neutral-500">No QR code available</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Enhanced Status Indicator */}
            <div className="absolute -top-2 -right-2">
              <AuthStatusIndicator
                authStatus={qrAuthState.authStatus}
                showText={false}
                size="md"
              />
            </div>
          </div>
        </motion.div>

        {/* Enhanced Status Card */}
        {showStatus && (
          <AuthStatusCard
            authState={qrAuthState}
            onRefresh={refreshQR}
            className="w-full max-w-md"
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          {showRefreshButton && (
            <motion.button
              onClick={refreshQR}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 
                         text-white font-medium rounded-xl transition-colors duration-200
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Generating...' : 'Refresh QR Code'}
            </motion.button>
          )}

          <motion.button
            onClick={() => setShowFallback(true)}
            className="flex-1 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 
                       text-neutral-700 font-medium rounded-xl transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Use Password
          </motion.button>
        </div>

        {/* AI Enhancement Indicator */}
        <motion.div
          className="flex items-center space-x-2 text-xs text-neutral-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft" />
          <span>AI-Enhanced Security</span>
        </motion.div>
      </div>

      {/* AI Authentication Flow */}
      <AIAuthFlow
        authState={qrAuthState}
        aiInsights={aiInsights}
        className="max-w-md mx-auto"
      />

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-error-50 border border-error-200 rounded-xl p-4 max-w-md mx-auto"
          >
            <div className="flex items-center justify-between">
              <p className="text-error-700 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-error-500 hover:text-error-700 ml-2"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
