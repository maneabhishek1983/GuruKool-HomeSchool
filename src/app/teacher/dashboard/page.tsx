"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSyncContext } from '../../../lib/syncContext';

interface LocationState {
  latitude: number;
  longitude: number;
}

export default function TeacherDashboardPage() {
  const { isOnline } = useSyncContext();

  // State for active session
  const [activeSession, setActiveSession] = useState(null);

  // State for upcoming sessions
  const [upcomingSessions, setUpcomingSessions] = useState([
    {
      id: '1',
      childName: 'Emma Smith',
      parentName: 'John Smith',
      subject: 'Mathematics',
      date: '2025-04-04',
      time: '14:00 - 16:00',
      address: '123 Main St, Anytown, USA'
    },
    {
      id: '2',
      childName: 'Noah Smith',
      parentName: 'John Smith',
      subject: 'Science',
      date: '2025-04-05',
      time: '10:00 - 12:00',
      address: '123 Main St, Anytown, USA'
    }
  ]);

  // State for completed sessions
  const [completedSessions, setCompletedSessions] = useState([]);

  // State for location
  const [location, setLocation] = useState<LocationState | null>(null);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Fetch active and upcoming sessions
    // This would be replaced with actual API calls
    const fetchSessions = async () => {
      try {
        // Simulating API calls
        // In a real app, these would be actual fetch calls to your backend
        console.log('Fetching sessions...');
        
        // For now, we're using the hardcoded data
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>
      
      <div className="mb-6 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {isOnline ? 'Online - Changes will sync automatically' : 'Offline - Changes will sync when connection is restored'}
        </p>
      </div>

      {location && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Your Location</h2>
          <p>Latitude: {location.latitude.toFixed(6)}</p>
          <p>Longitude: {location.longitude.toFixed(6)}</p>
        </div>
      )}

      {activeSession ? (
        <div className="mb-6 p-4 bg-green-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Active Session</h2>
          {/* Active session details would go here */}
        </div>
      ) : (
        <div className="mb-6 p-4 bg-yellow-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Active Session</h2>
          <p>You don't have any active teaching sessions right now.</p>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        {upcomingSessions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-medium text-lg">{session.childName}</h3>
                <p className="text-gray-600">Parent: {session.parentName}</p>
                <p className="text-gray-600">Subject: {session.subject}</p>
                <p className="text-gray-600">Date: {session.date}</p>
                <p className="text-gray-600">Time: {session.time}</p>
                <p className="text-gray-600">Address: {session.address}</p>
                <div className="mt-4 flex space-x-2">
                  <Link href={`/teacher/sessions/${session.id}`} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    View Details
                  </Link>
                  <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Start Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No upcoming sessions scheduled.</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Completed Sessions</h2>
        {completedSessions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Completed sessions would be mapped here */}
          </div>
        ) : (
          <p>No completed sessions yet.</p>
        )}
      </div>
    </div>
  );
}
