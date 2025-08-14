"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionRecord, User, Location } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

interface LocationAwareSessionManagerProps {
  session: SessionRecord;
  currentUser: User;
  onLocationVerified?: (location: Location) => void;
  onLocationError?: (error: string) => void;
  className?: string;
}

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export default function LocationAwareSessionManager({
  session,
  currentUser,
  onLocationVerified,
  onLocationError,
  className = ''
}: LocationAwareSessionManagerProps) {
  const [currentLocation, setCurrentLocation] = useState<LocationState | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceToSession, setDistanceToSession] = useState<number | null>(null);
  const [isAtLocation, setIsAtLocation] = useState(false);
  const [locationHistory, setLocationHistory] = useState<LocationState[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const sessionLocation = session.location;

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      onLocationError?.('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000
    };

    const successCallback = (position: GeolocationPosition) => {
      const location: LocationState = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy || 0,
        timestamp: position.timestamp
      };

      setCurrentLocation(location);
      setLocationHistory(prev => [...prev, location]);

      // Calculate distance to session location
      if (sessionLocation?.coordinates) {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          sessionLocation.coordinates.latitude,
          sessionLocation.coordinates.longitude
        );
        
        setDistanceToSession(distance);
        setIsAtLocation(distance <= 0.1); // Within 100 meters
      }

      setIsLoading(false);
      setIsTracking(true);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = 'Unknown location error';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location services.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setLocationError(errorMessage);
      onLocationError?.(errorMessage);
      setIsLoading(false);
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);

    // Start watching for position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const verifyLocation = async () => {
    if (!currentLocation || !sessionLocation?.coordinates) {
      setLocationError('Unable to verify location - missing location data');
      return;
    }

    try {
      setIsLoading(true);

      // Create verified location object
      const verifiedLocation: Location = {
        address: sessionLocation.address,
        coordinates: {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude
        },
        verified: true
      };

      // Update session with verified location
      await enhancedSessionStore.updateSession({
        sessionId: session.id,
        updates: {
          location: verifiedLocation
        },
        requestedBy: currentUser.id,
        aiAssisted: true
      }, currentUser);

      onLocationVerified?.(verifiedLocation);
      
      // Show success message
      setLocationError(null);
    } catch (error) {
      const errorMessage = 'Failed to verify location: ' + (error instanceof Error ? error.message : 'Unknown error');
      setLocationError(errorMessage);
      onLocationError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getDistanceColor = (distance: number): string => {
    if (distance <= 0.1) return 'text-green-600';
    if (distance <= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDistanceStatus = (distance: number): string => {
    if (distance <= 0.1) return 'At Location';
    if (distance <= 0.5) return 'Nearby';
    return 'Too Far';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Location-Aware Session Management
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">GPS Enabled</span>
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Session Location Info */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">Session Location</h4>
        <p className="text-sm text-gray-600 mb-2">{sessionLocation?.address || 'Location not specified'}</p>
        {sessionLocation?.coordinates && (
          <p className="text-xs text-gray-500">
            Coordinates: {sessionLocation.coordinates.latitude.toFixed(6)}, {sessionLocation.coordinates.longitude.toFixed(6)}
          </p>
        )}
      </div>

      {/* Location Controls */}
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={isTracking ? stopLocationTracking : startLocationTracking}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isTracking
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className={`w-4 h-4 rounded-full ${
            isTracking ? 'bg-white animate-pulse' : 'bg-white'
          }`}></div>
          <span>{isLoading ? 'Loading...' : isTracking ? 'Stop Tracking' : 'Start Tracking'}</span>
        </motion.button>

        {isAtLocation && currentLocation && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={verifyLocation}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify Location
          </motion.button>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {locationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm">{locationError}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Location Display */}
      {currentLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Your Current Location</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Latitude:</span>
                <span className="ml-2 text-blue-900">{currentLocation.latitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-blue-700">Longitude:</span>
                <span className="ml-2 text-blue-900">{currentLocation.longitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-blue-700">Accuracy:</span>
                <span className="ml-2 text-blue-900">±{Math.round(currentLocation.accuracy)}m</span>
              </div>
              <div>
                <span className="text-blue-700">Updated:</span>
                <span className="ml-2 text-blue-900">
                  {new Date(currentLocation.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Distance Information */}
          {distanceToSession !== null && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Distance to Session</h4>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-lg font-semibold ${getDistanceColor(distanceToSession)}`}>
                    {distanceToSession.toFixed(2)} km
                  </span>
                  <p className={`text-sm ${getDistanceColor(distanceToSession)}`}>
                    {getDistanceStatus(distanceToSession)}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 ${
                  isAtLocation ? 'border-green-500 bg-green-100' : 'border-red-500 bg-red-100'
                } flex items-center justify-center`}>
                  {isAtLocation ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Location History */}
          {locationHistory.length > 1 && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Location History</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {locationHistory.slice(-5).map((location, index) => (
                  <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                    <span>
                      {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </span>
                    <span>{new Date(location.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tracking Status */}
      {isTracking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700 font-medium">Location tracking active...</span>
        </motion.div>
      )}

      {/* Loading Status */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-700 font-medium">Processing location data...</span>
        </motion.div>
      )}
    </div>
  );
}
