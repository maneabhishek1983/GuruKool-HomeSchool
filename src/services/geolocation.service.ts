/**
 * Geolocation Service
 * 
 * Handles GPS location tracking and geofence verification
 * for teacher check-in/out
 */

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeofenceResult {
  withinGeofence: boolean;
  distance: number;
  allowedRadius: number;
  accuracy: number;
}

export interface StudentLocation {
  latitude: number;
  longitude: number;
  address: string;
  geofenceRadius: number;
}

export class GeolocationService {
  private static readonly MAX_ACCEPTABLE_ACCURACY = 50; // meters
  private static readonly LOCATION_TIMEOUT = 10000; // 10 seconds
  private static readonly MAX_AGE = 5000; // 5 seconds

  /**
   * Get current device location
   */
  static async getCurrentLocation(): Promise<GeolocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this device'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location services in your device settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please ensure GPS is enabled.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: this.LOCATION_TIMEOUT,
          maximumAge: this.MAX_AGE,
        }
      );
    });
  }

  /**
   * Watch location changes (for continuous tracking)
   */
  static watchLocation(
    onLocationUpdate: (coords: GeolocationCoordinates) => void,
    onError: (error: Error) => void
  ): number {
    if (!navigator.geolocation) {
      onError(new Error('Geolocation is not supported'));
      return -1;
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        onLocationUpdate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        onError(new Error(`Location error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: this.LOCATION_TIMEOUT,
        maximumAge: this.MAX_AGE,
      }
    );
  }

  /**
   * Stop watching location
   */
  static clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in meters
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
  }

  /**
   * Verify if current location is within geofence
   */
  static async verifyGeofence(
    studentId: string
  ): Promise<GeofenceResult> {
    try {
      // Get current location
      const currentLocation = await this.getCurrentLocation();

      // Verify accuracy
      if (currentLocation.accuracy > this.MAX_ACCEPTABLE_ACCURACY) {
        throw new Error(
          `GPS accuracy too low (${Math.round(currentLocation.accuracy)}m). Please move to an open area for better signal.`
        );
      }

      // Call API to verify against student's home location
      const response = await fetch('/api/location/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Location verification failed');
      }

      const result = await response.json();

      return {
        withinGeofence: result.withinGeofence,
        distance: result.distance,
        allowedRadius: result.allowedRadius,
        accuracy: currentLocation.accuracy,
      };
    } catch (error) {
      console.error('Geofence verification error:', error);
      throw error;
    }
  }

  /**
   * Check if location accuracy is acceptable
   */
  static isAccuracyAcceptable(accuracy: number): boolean {
    return accuracy <= this.MAX_ACCEPTABLE_ACCURACY;
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Get location permission status
   */
  static async getPermissionStatus(): Promise<PermissionState> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch {
      return 'prompt';
    }
  }

  /**
   * Request location permission
   */
  static async requestPermission(): Promise<boolean> {
    try {
      await this.getCurrentLocation();
      return true;
    } catch (error) {
      console.error('Location permission denied:', error);
      return false;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<string> {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'GuruKool-HomeSchool',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      return data.display_name || 'Unknown location';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }

  /**
   * Forward geocode address to coordinates
   */
  static async geocodeAddress(address: string): Promise<{
    latitude: number;
    longitude: number;
  } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'GuruKool-HomeSchool',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      if (data.length === 0) {
        return null;
      }

      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Check if device supports geolocation
   */
  static isSupported(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Get location error message
   */
  static getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied. Please enable location permissions in your device settings.';
      case error.POSITION_UNAVAILABLE:
        return 'Location unavailable. Please ensure GPS is enabled and you have a clear view of the sky.';
      case error.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting your location.';
    }
  }

  /**
   * Validate coordinates
   */
  static isValidCoordinates(latitude: number, longitude: number): boolean {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Get distance description for UI
   */
  static getDistanceDescription(distance: number, allowedRadius: number): string {
    if (distance <= allowedRadius) {
      return `✓ You are within the allowed area (${this.formatDistance(distance)} from home)`;
    }
    
    const excess = distance - allowedRadius;
    return `⚠️ You are ${this.formatDistance(excess)} too far from the student's home`;
  }

  /**
   * Check if location is stale
   */
  static isLocationStale(timestamp: number): boolean {
    const age = Date.now() - timestamp;
    return age > 30000; // 30 seconds
  }
}
