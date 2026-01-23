'use client';

import { useState, useEffect } from 'react';
import { GeolocationService } from '@/services/geolocation.service';

interface GeofenceSettingsProps {
  studentId: string;
  studentName: string;
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  initialRadius?: number;
  onSave?: () => void;
}

export default function GeofenceSettings({
  studentId,
  studentName,
  initialAddress = '',
  initialLatitude,
  initialLongitude,
  initialRadius = 100,
  onSave,
}: GeofenceSettingsProps) {
  const [address, setAddress] = useState(initialAddress);
  const [latitude, setLatitude] = useState(initialLatitude);
  const [longitude, setLongitude] = useState(initialLongitude);
  const [radius, setRadius] = useState(initialRadius);
  const [customRadius, setCustomRadius] = useState(initialRadius.toString());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const radiusOptions = [
    { value: 50, label: '50 meters (Strict)', description: 'Small apartment or precise location' },
    { value: 100, label: '100 meters (Recommended)', description: 'Standard home or neighborhood' },
    { value: 200, label: '200 meters (Flexible)', description: 'Large property or rural area' },
    { value: 'custom', label: 'Custom', description: 'Set your own radius' },
  ];

  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    setSuccess(false);
  };

  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      setError('Please enter an address');
      return;
    }

    setIsGeocoding(true);
    setError(null);

    try {
      const coords = await GeolocationService.geocodeAddress(address);
      
      if (!coords) {
        setError('Could not find this address. Please check and try again.');
        return;
      }

      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
      setSuccess(false);
    } catch (err) {
      setError('Failed to geocode address. Please try again.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setIsGeocoding(true);
    setError(null);

    try {
      const location = await GeolocationService.getCurrentLocation();
      setLatitude(location.latitude);
      setLongitude(location.longitude);

      // Reverse geocode to get address
      const reverseAddress = await GeolocationService.reverseGeocode(
        location.latitude,
        location.longitude
      );
      setAddress(reverseAddress);
      setSuccess(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get current location');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleRadiusChange = (value: string) => {
    if (value === 'custom') {
      setRadius(parseInt(customRadius) || 100);
    } else {
      setRadius(parseInt(value));
    }
  };

  const handleSave = async () => {
    if (!address.trim()) {
      setError('Please enter a home address');
      return;
    }

    if (!latitude || !longitude) {
      setError('Please geocode the address first');
      return;
    }

    if (radius < 10 || radius > 1000) {
      setError('Radius must be between 10 and 1000 meters');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          home_address: address,
          home_latitude: latitude,
          home_longitude: longitude,
          geofence_radius_meters: radius,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSuccess(true);
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Geofence Settings
      </h2>
      <p className="text-gray-600 mb-6">
        Configure location verification for {studentName}'s check-ins
      </p>

      {/* Home Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Home Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="123 Main St, Springfield, IL 62701"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleGeocodeAddress}
            disabled={isGeocoding || !address.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGeocoding ? 'Locating...' : 'Find'}
          </button>
        </div>
        <button
          onClick={handleUseCurrentLocation}
          disabled={isGeocoding}
          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
        >
          📍 Use my current location
        </button>
      </div>

      {/* Coordinates Display */}
      {latitude && longitude && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold text-green-800">Location Found</span>
          </div>
          <p className="text-sm text-green-700">
            Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </p>
        </div>
      )}

      {/* Geofence Radius */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Geofence Radius
        </label>
        <div className="space-y-3">
          {radiusOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name="radius"
                value={option.value}
                checked={
                  option.value === 'custom'
                    ? ![50, 100, 200].includes(radius)
                    : radius === option.value
                }
                onChange={(e) => handleRadiusChange(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Custom Radius Input */}
        {![50, 100, 200].includes(radius) && (
          <div className="mt-3 ml-7">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Radius (meters)
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              value={customRadius}
              onChange={(e) => {
                setCustomRadius(e.target.value);
                setRadius(parseInt(e.target.value) || 100);
              }}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must be between 10 and 1000 meters
            </p>
          </div>
        )}
      </div>

      {/* Visualization */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Teachers must be within {radius}m of your home to check in/out</li>
          <li>✓ Location is verified automatically using GPS</li>
          <li>✓ All location checks are logged for your records</li>
          <li>✓ Teachers can request exceptions for off-site sessions</li>
        </ul>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">Settings saved successfully!</p>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSaving || !latitude || !longitude}
        className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
          isSaving || !latitude || !longitude
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Saving...
          </span>
        ) : (
          'Save Geofence Settings'
        )}
      </button>
    </div>
  );
}
