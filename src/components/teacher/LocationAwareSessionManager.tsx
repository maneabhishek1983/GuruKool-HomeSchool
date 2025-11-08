'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/design-system/components/base/Card';
import { SessionRecord } from '@/types/session.types';
import { User } from '@/types';
import { SessionStatus } from '@/types/session.types';
import { enhancedSessionStore } from '@/store/session.store';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

interface SessionLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  verified: boolean;
  radius: number; // meters
}

interface LocationAwareSessionManagerProps {
  teacherId: string;
  user: User;
  onSessionUpdate?: (session: SessionRecord) => void;
  className?: string;
}

export const LocationAwareSessionManager: React.FC<
  LocationAwareSessionManagerProps
> = ({ teacherId, user, onSessionUpdate, className = '' }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [activeSession, setActiveSession] = useState<SessionRecord | null>(
    null
  );
  const [locationPermission, setLocationPermission] = useState<
    'granted' | 'denied' | 'prompt'
  >('prompt');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<SessionLocation[]>([]);
  const [isAtValidLocation, setIsAtValidLocation] = useState(false);

  useEffect(() => {
    checkLocationPermission();
    loadTeacherSessions();
  }, [teacherId]);

  useEffect(() => {
    if (currentLocation) {
      checkNearbyLocations();
      validateCurrentLocation();
    }
  }, [currentLocation, sessions]);

  const checkLocationPermission = async () => {
    if ('geolocation' in navigator) {
      try {
        const permission = await navigator.permissions.query({
          name: 'geolocation',
        });
        setLocationPermission(permission.state);

        permission.addEventListener('change', () => {
          setLocationPermission(permission.state);
        });

        if (permission.state === 'granted') {
          getCurrentLocation();
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async position => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };

        // Get address from coordinates (reverse geocoding)
        try {
          const address = await reverseGeocode(
            locationData.latitude,
            locationData.longitude
          );
          locationData.address = address;
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
        }

        setCurrentLocation(locationData);
        setIsLoadingLocation(false);
      },
      error => {
        setLocationError(getLocationErrorMessage(error));
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Mock reverse geocoding - in real implementation, use Google Maps API or similar
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const getLocationErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location permissions.';
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable.';
      case error.TIMEOUT:
        return 'Location request timed out.';
      default:
        return 'An unknown error occurred while retrieving location.';
    }
  };

  const loadTeacherSessions = async () => {
    try {
      const teacherSessions =
        await enhancedSessionStore.getSessionsWithInsights({
          teacherId,
          status: ['scheduled', 'in-progress'],
          sortBy: 'date',
          sortOrder: 'asc',
        });

      setSessions(teacherSessions);

      // Find active session
      const active = teacherSessions.find(s => s.status === 'in-progress');
      setActiveSession(active || null);
    } catch (error) {
      console.error('Failed to load teacher sessions:', error);
    }
  };

  const checkNearbyLocations = () => {
    if (!currentLocation) {
      return;
    }

    const nearby = sessions
      .filter(session => session.location && session.location.coordinates)
      .map(session => ({
        id: session.id,
        name: `${session.subject} - ${session.studentId}`,
        address: session.location.address,
        coordinates: session.location.coordinates,
        verified: session.location.verified,
        radius: 100, // 100 meters default
      }))
      .filter(location => {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          location.coordinates.latitude,
          location.coordinates.longitude
        );
        return distance <= location.radius;
      });

    setNearbyLocations(nearby);
  };

  const validateCurrentLocation = () => {
    if (!currentLocation || !activeSession?.location) {
      setIsAtValidLocation(false);
      return;
    }

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      activeSession.location.coordinates.latitude,
      activeSession.location.coordinates.longitude
    );

    setIsAtValidLocation(distance <= 100); // 100 meters tolerance
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const startSession = async (sessionId: string) => {
    if (!currentLocation) {
      setLocationError('Location is required to start a session');
      return;
    }

    try {
      const updatedSession = await enhancedSessionStore.updateSession(
        {
          sessionId,
          updates: {
            status: 'in-progress' as SessionStatus,
            actualStart: new Date(),
            location: {
              address: currentLocation.address || 'Unknown location',
              coordinates: {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              },
              verified: currentLocation.accuracy < 50,
            },
          },
          requestedBy: user.id,
          aiAssisted: true,
        },
        user
      );

      if (updatedSession) {
        setActiveSession(updatedSession);
        onSessionUpdate?.(updatedSession);
        await loadTeacherSessions();
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      setLocationError('Failed to start session. Please try again.');
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const updatedSession = await enhancedSessionStore.updateSession(
        {
          sessionId,
          updates: {
            status: 'completed' as SessionStatus,
            actualEnd: new Date(),
          },
          requestedBy: user.id,
          aiAssisted: true,
        },
        user
      );

      if (updatedSession) {
        setActiveSession(null);
        onSessionUpdate?.(updatedSession);
        await loadTeacherSessions();
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      setLocationError('Failed to end session. Please try again.');
    }
  };

  const requestLocationPermission = () => {
    getCurrentLocation();
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Location Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Location & Session Management
          </h3>
          <button
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isLoadingLocation ? 'Updating...' : 'Update Location'}
          </button>
        </div>

        {locationPermission === 'denied' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p className="text-sm text-red-700">
                Location access is required for session management. Please
                enable location permissions in your browser.
              </p>
            </div>
          </div>
        )}

        {locationPermission === 'prompt' && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-yellow-700">
                Location access is needed to manage sessions effectively.
              </p>
              <button
                onClick={requestLocationPermission}
                className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Enable Location
              </button>
            </div>
          </div>
        )}

        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{locationError}</p>
          </div>
        )}

        {currentLocation && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Current Location
              </h4>
              <p className="text-sm text-gray-600">
                {currentLocation.address ||
                  `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Accuracy: {Math.round(currentLocation.accuracy)}m
              </p>
            </div>

            {activeSession && (
              <div
                className={`p-3 rounded-lg ${isAtValidLocation ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <h4 className="font-medium text-gray-900 mb-2">
                  Session Location Status
                </h4>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${isAtValidLocation ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span
                    className={`text-sm ${isAtValidLocation ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {isAtValidLocation
                      ? 'At session location'
                      : 'Not at session location'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Active Session */}
      {activeSession && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Active Session
            </h3>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              In Progress
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {activeSession.subject}
              </h4>
              <p className="text-sm text-gray-600">
                Student: {activeSession.studentId}
              </p>
              <p className="text-sm text-gray-600">
                Started: {activeSession.actualStart?.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Location</h4>
              <p className="text-sm text-gray-600">
                {activeSession.location.address}
              </p>
              {currentLocation && activeSession.location.coordinates && (
                <p className="text-xs text-gray-500">
                  Distance:{' '}
                  {formatDistance(
                    calculateDistance(
                      currentLocation.latitude,
                      currentLocation.longitude,
                      activeSession.location.coordinates.latitude,
                      activeSession.location.coordinates.longitude
                    )
                  )}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => endSession(activeSession.id)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
          >
            End Session
          </button>
        </Card>
      )}

      {/* Upcoming Sessions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upcoming Sessions
        </h3>

        {sessions.filter(s => s.status === 'scheduled').length === 0 ? (
          <p className="text-gray-500 text-center py-4">No upcoming sessions</p>
        ) : (
          <div className="space-y-3">
            {sessions
              .filter(s => s.status === 'scheduled')
              .slice(0, 5)
              .map(session => {
                const isNearby = nearbyLocations.some(
                  loc => loc.id === session.id
                );
                const distance =
                  currentLocation && session.location.coordinates
                    ? calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        session.location.coordinates.latitude,
                        session.location.coordinates.longitude
                      )
                    : null;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 border rounded-lg ${isNearby ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {session.subject}
                          </h4>
                          {isNearby && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Nearby
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Student: {session.studentId}
                        </p>
                        <p className="text-sm text-gray-600">
                          {session.scheduledStart.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.location.address}
                        </p>
                        {distance && (
                          <p className="text-xs text-gray-500">
                            Distance: {formatDistance(distance)}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => startSession(session.id)}
                        disabled={
                          !currentLocation ||
                          (!isNearby &&
                            distance !== null &&
                            distance !== undefined &&
                            distance > 500)
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Start Session
                      </button>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </Card>

      {/* Nearby Locations */}
      {nearbyLocations.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nearby Session Locations
          </h3>
          <div className="space-y-2">
            {nearbyLocations.map(location => (
              <div
                key={location.id}
                className="flex items-center gap-3 p-2 bg-green-50 rounded-lg"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{location.name}</p>
                  <p className="text-sm text-gray-600">{location.address}</p>
                </div>
                <span className="text-sm text-green-700 font-medium">
                  {formatDistance(
                    calculateDistance(
                      currentLocation!.latitude,
                      currentLocation!.longitude,
                      location.coordinates.latitude,
                      location.coordinates.longitude
                    )
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
