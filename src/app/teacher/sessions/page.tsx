"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSessionStore } from '@/store/sessionStore';
import { useSearchParams } from 'next/navigation';
import { useSyncContext } from '../../../lib/syncContext';

interface SessionState {
  id: string;
  childName: string;
  parentName: string;
  subject: string;
  date: string;
  time: string;
  address: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

function TeacherSessionsContent() {
  const { isOnline } = useSyncContext();
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';

  const { sessions, startSession } = useSessionStore();

  // Filter sessions based on status
  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') {
      return true;
    }
    if (filter === 'upcoming') {
      return session.status === 'scheduled';
    }
    if (filter === 'completed') {
      return session.status === 'completed';
    }
    if (filter === 'cancelled') {
      return session.status === 'cancelled';
    }
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Teacher Sessions</h1>
      
      <div className="mb-6 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {isOnline ? 'Online - Changes will sync automatically' : 'Offline - Changes will sync when connection is restored'}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <Link href="/teacher/sessions?filter=all" className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            All
          </Link>
          <Link href="/teacher/sessions?filter=upcoming" className={`px-4 py-2 rounded ${filter === 'upcoming' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            Upcoming
          </Link>
          <Link href="/teacher/sessions?filter=completed" className={`px-4 py-2 rounded ${filter === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            Completed
          </Link>
          <Link href="/teacher/sessions?filter=cancelled" className={`px-4 py-2 rounded ${filter === 'cancelled' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
            Cancelled
          </Link>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => (
              <div key={session.id} className={`border rounded-lg p-4 shadow-sm ${
                session.status === 'completed' ? 'bg-green-50' : 
                session.status === 'cancelled' ? 'bg-red-50' : 'bg-white'
              }`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg">{session.childName}</h3>
                  <span className={`px-2 py-1 rounded text-sm ${
                    session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                    session.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                    session.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600">Parent: {session.parentName}</p>
                <p className="text-gray-600">Subject: {session.subject}</p>
                <p className="text-gray-600">Date: {session.date}</p>
                <p className="text-gray-600">Time: {session.time}</p>
                <p className="text-gray-600">Address: {session.address}</p>
                {session.notes && (
                  <div className="mt-2 p-2 bg-gray-100 rounded">
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm">{session.notes}</p>
                  </div>
                )}
                <div className="mt-4 flex space-x-2">
                  <Link href={`/teacher/sessions/${session.id}`} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    View Details
                  </Link>
                  {session.status === 'scheduled' && (
                    <button onClick={() => startSession(session.id)} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                      Start Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No sessions found matching the selected filter.</p>
        )}
      </div>
    </div>
  );
}

export default function TeacherSessionsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold mb-6">Loading sessions...</h1></div>}>
      <TeacherSessionsContent />
    </Suspense>
  );
}
