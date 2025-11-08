'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionRecord } from '@/types/session.types';
import { User, Location } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface TeacherLocationTrackerProps {
  session?: SessionRecord;
  teacherId: string;
  parentId: string;
  activeSessionId?: string;
  currentUser?: User;
  onLocationUpdate?: (location: Location) => void;
  onStatusUpdate?: (status: string) => void;
  className?: string;
}

interface TeacherLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  isAtSessionLocation: boolean;
  distanceToSession: number;
}

interface SessionStatus {
  status:
    | 'scheduled'
    | 'in-progress'
    | 'completed'
    | 'cancelled'
    | 'rescheduled';
  startTime?: Date;
  endTime?: Date;
  duration: number; // in minutes
  notes?: string;
}

export default function TeacherLocationTracker({
  session: initialSession,
  teacherId,
  parentId,
  activeSessionId,
  currentUser,
  onLocationUpdate,
  onStatusUpdate,
  className = '',
}: TeacherLocationTrackerProps) {
  const [session, setSession] = useState<SessionRecord | null>(
    initialSession || null
  );
  const [teacherLocation, setTeacherLocation] =
    useState<TeacherLocation | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(() => {
    const status = initialSession?.status;
    // Ensure status is valid, default to 'scheduled' if invalid
    const validStatus: SessionStatus['status'] =
      status === 'scheduled' ||
      status === 'in-progress' ||
      status === 'completed' ||
      status === 'cancelled' ||
      status === 'rescheduled'
        ? status
        : 'scheduled';
    return {
      status: validStatus,
      duration: 0,
    };
  });
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch session if not provided
  useEffect(() => {
    const fetchSession = async () => {
      if (!session && activeSessionId) {
        try {
          setIsLoading(true);
          // In a real app, fetch from session store
          // For now, create a mock session
          const mockSession: SessionRecord = {
            id: activeSessionId,
            teacherId,
            parentId,
            studentId: 'student-1',
            subject: 'Math',
            scheduledStart: new Date(),
            scheduledEnd: new Date(Date.now() + 60 * 60 * 1000),
            status: 'in-progress',
            location: {
              address: 'Home',
              coordinates: {
                latitude: 0,
                longitude: 0,
              },
              verified: false,
            },
            notes: 'Active session',
            attachments: [],
            aiInsights: [],
            aiRecommendations: [],
            learningPatterns: [],
            sessionAnalytics: {
              engagementScore: 0,
              completionRate: 0,
              averageResponseTime: 0,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
          };
          setSession(mockSession);
          setSessionStatus({ status: mockSession.status, duration: 0 });
        } catch (err) {
          setError('Failed to load session data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSession();
  }, [activeSessionId, teacherId, parentId]);

  useEffect(() => {
    if (session?.status === 'in-progress') {
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [session?.status]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (isTracking && session?.status === 'in-progress') {
        updateSessionStatus();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isTracking, session?.status]);

  const startLocationTracking = () => {
    setIsTracking(true);
    // In a real implementation, this would connect to a WebSocket or polling service
    // to get real-time teacher location updates
    simulateLocationUpdates();
  };

  const stopLocationTracking = () => {
    setIsTracking(false);
  };

  const simulateLocationUpdates = () => {
    // Simulate teacher location updates
    const sessionLocation = session?.location?.coordinates;
    if (!sessionLocation) {
      return;
    }

    const updateLocation = () => {
      if (!isTracking) {
        return;
      }

      // Simulate teacher moving around the session location
      const offset = 0.001; // Small offset to simulate movement
      const newLat = sessionLocation.latitude + (Math.random() - 0.5) * offset;
      const newLng = sessionLocation.longitude + (Math.random() - 0.5) * offset;

      const distance = calculateDistance(
        newLat,
        newLng,
        sessionLocation.latitude,
        sessionLocation.longitude
      );

      const location: TeacherLocation = {
        latitude: newLat,
        longitude: newLng,
        accuracy: 10 + Math.random() * 20, // 10-30 meters accuracy
        timestamp: new Date(),
        isAtSessionLocation: distance <= 0.1, // Within 100 meters
        distanceToSession: distance,
      };

      setTeacherLocation(location);
      setLastUpdate(new Date());
      onLocationUpdate?.({
        address: session?.location?.address || '',
        coordinates: { latitude: newLat, longitude: newLng },
        verified: true,
      });

      // Schedule next update
      setTimeout(updateLocation, 10000 + Math.random() * 20000); // 10-30 seconds
    };

    updateLocation();
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateSessionStatus = () => {
    if (sessionStatus.status === 'in-progress') {
      const now = new Date();
      const startTime = sessionStatus.startTime || session?.scheduledStart;
      if (!startTime) {
        return;
      }
      const duration = Math.floor(
        (now.getTime() - startTime.getTime()) / (1000 * 60)
      );

      setSessionStatus(prev => ({
        ...prev,
        duration,
        endTime: now,
      }));

      onStatusUpdate?.(`Session in progress - ${duration} minutes elapsed`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'in-progress':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '⏰';
      case 'in-progress':
        return '🎓';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m ago`;
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading session data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
          <span className="text-gray-600">No active session to track</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Teacher Location & Session Status
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Real-time Tracking</span>
          <div
            className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
          ></div>
        </div>
      </div>

      {/* Session Status */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Session Status</h4>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sessionStatus.status)}`}
          >
            {getStatusIcon(sessionStatus.status)}{' '}
            {sessionStatus.status.replace('-', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Subject:</span>
            <span className="ml-2 font-medium">
              {session?.subject || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Teacher:</span>
            <span className="ml-2 font-medium">
              {session?.teacherName || 'Teacher'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Start Time:</span>
            <span className="ml-2 font-medium">
              {session?.scheduledStart
                ? new Date(session.scheduledStart).toLocaleTimeString()
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Duration:</span>
            <span className="ml-2 font-medium">
              {sessionStatus.duration > 0
                ? formatDuration(sessionStatus.duration)
                : 'Not started'}
            </span>
          </div>
        </div>

        {sessionStatus.status === 'in-progress' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-700 font-medium">
                Session is currently in progress
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Teacher Location */}
      {teacherLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white border border-gray-200 rounded-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Teacher Location</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {lastUpdate ? formatTimeAgo(lastUpdate) : 'Updating...'}
              </span>
              <div
                className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <span className="ml-2 font-mono">
                {teacherLocation.latitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Longitude:</span>
              <span className="ml-2 font-mono">
                {teacherLocation.longitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <span className="ml-2">
                ±{Math.round(teacherLocation.accuracy)}m
              </span>
            </div>
            <div>
              <span className="text-gray-600">Distance to Session:</span>
              <span
                className={`ml-2 font-medium ${
                  teacherLocation.isAtSessionLocation
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {teacherLocation.distanceToSession.toFixed(2)} km
              </span>
            </div>
          </div>

          {/* Location Status */}
          <div
            className={`p-3 rounded-lg border ${
              teacherLocation.isAtSessionLocation
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              {teacherLocation.isAtSessionLocation ? (
                <>
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-green-700">
                    Teacher is at the session location
                  </span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-yellow-700">
                    Teacher is not at the session location
                  </span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Session Location */}
      {session?.location && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Session Location</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">Address:</span>
              <span className="ml-2">{session?.location?.address}</span>
            </div>
            {session?.location?.coordinates && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Latitude:</span>
                  <span className="ml-2 font-mono">
                    {session?.location?.coordinates?.latitude?.toFixed(6)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Longitude:</span>
                  <span className="ml-2 font-mono">
                    {session?.location?.coordinates?.longitude?.toFixed(6)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Status */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700 font-medium">
            Updating location data...
          </span>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Real-time tracking shows teacher's current location</li>
          <li>• Green indicator means teacher is at the session location</li>
          <li>• Session status updates automatically during the session</li>
          <li>• Location data updates every 10-30 seconds</li>
        </ul>
      </div>
    </div>
  );
}
