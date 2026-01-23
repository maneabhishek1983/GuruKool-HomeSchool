'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BiometricService,
  BiometricCredential,
} from '@/services/biometric.service';

interface Device extends BiometricCredential {
  id?: string;
  lastUsed?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface BiometricDeviceManagerProps {
  teacherId: string;
  onDeviceRegistered?: (device: Device) => void;
  onDeviceRevoked?: (credentialId: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export function BiometricDeviceManager({
  teacherId,
  onDeviceRegistered,
  onDeviceRevoked,
  onError,
  className = '',
}: BiometricDeviceManagerProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAvailable, setIsPlatformAvailable] = useState(false);

  // Check biometric support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const supported = BiometricService.isSupported();
      setIsSupported(supported);

      if (supported) {
        const available =
          await BiometricService.isPlatformAuthenticatorAvailable();
        setIsPlatformAvailable(available);
      }
    };

    checkSupport();
  }, []);

  // Fetch devices on mount
  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const credentials = await BiometricService.listCredentials(teacherId);

      // Fetch additional details from API
      const response = await fetch(
        `/api/biometric/credentials?teacherId=${teacherId}`
      );

      if (response.ok) {
        const data = await response.json();
        // Merge data from API with credentials
        setDevices(
          data.credentials?.map((cred: Device) => ({
            ...cred,
            credentialId: cred.credentialId || cred.id,
          })) || credentials
        );
      } else {
        setDevices(credentials);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
      setError('Failed to load registered devices');
      onError?.(
        err instanceof Error ? err : new Error('Failed to load devices')
      );
    } finally {
      setLoading(false);
    }
  }, [teacherId, onError]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Register new device
  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    setSuccess(null);

    try {
      const credential = await BiometricService.register(teacherId);

      const newDevice: Device = {
        ...credential,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      setDevices(prev => [...prev, newDevice]);
      setSuccess('Device registered successfully!');
      onDeviceRegistered?.(newDevice);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to register device';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setRegistering(false);
    }
  };

  // Revoke device
  const handleRevoke = async (credentialId: string, deviceName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${deviceName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setRevoking(credentialId);
    setError(null);
    setSuccess(null);

    try {
      await BiometricService.revokeCredential(credentialId);

      setDevices(prev => prev.filter(d => d.credentialId !== credentialId));
      setSuccess(`"${deviceName}" has been removed`);
      onDeviceRevoked?.(credentialId);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Revoke error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to remove device';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setRevoking(null);
    }
  };

  // Get device icon based on type
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'ios':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      case 'android':
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      default:
        return (
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'Never';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get biometric type label
  const getBiometricLabel = () => {
    return BiometricService.getBiometricTypeDescription();
  };

  if (!isSupported) {
    return (
      <div
        className={`p-6 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
            <svg
              className="w-6 h-6 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              Biometric Authentication Not Supported
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Your browser or device does not support WebAuthn biometric
              authentication. Please use a modern browser like Chrome, Safari,
              Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isPlatformAvailable) {
    return (
      <div
        className={`p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-200">
              Device Biometrics Not Available
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              {getBiometricLabel()} is not available on this device. Make sure
              biometric authentication is enabled in your device settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Biometric Devices
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your {getBiometricLabel()} devices for secure authentication
          </p>
        </div>
        <button
          onClick={handleRegister}
          disabled={registering}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {registering ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Registering...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Device
            </>
          )}
        </button>
      </div>

      {/* Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto p-1 text-red-500 hover:text-red-700"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-sm text-green-700 dark:text-green-300">
                {success}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : devices.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
            No Devices Registered
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Register your first device to enable {getBiometricLabel()}{' '}
            authentication
          </p>
          <button
            onClick={handleRegister}
            disabled={registering}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Your First Device
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {devices.map((device, index) => (
              <motion.div
                key={device.credentialId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                    {getDeviceIcon(device.deviceType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 dark:text-white truncate">
                        {device.deviceName}
                      </h3>
                      {device.isActive !== false && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{device.deviceType}</span>
                      {device.createdAt && (
                        <>
                          <span className="hidden sm:inline">
                            Added {formatDate(device.createdAt)}
                          </span>
                        </>
                      )}
                      {device.lastUsed && (
                        <>
                          <span className="text-slate-300 dark:text-slate-600">
                            |
                          </span>
                          <span>Last used {formatDate(device.lastUsed)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleRevoke(device.credentialId, device.deviceName)
                    }
                    disabled={revoking === device.credentialId}
                    className="flex-shrink-0 p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Remove device"
                  >
                    {revoking === device.credentialId ? (
                      <motion.div
                        className="w-5 h-5 border-2 border-slate-300 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Security Info */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-slate-400 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              Security Information
            </p>
            <p className="mt-1">
              Your biometric data never leaves your device. Only a secure
              cryptographic key is stored on our servers. Each authentication
              requires a unique challenge that cannot be reused.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
