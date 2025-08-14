"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSyncContext } from '../../../../lib/syncContext';
import { useSessionStore, defaultSessions } from '@/store/sessionStore';

interface SessionDetails {
  id: string;
  childName: string;
  parentName: string;
  subject: string;
  date: string;
  time: string;
  address: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string | undefined;
  lessonPlan?: string | undefined;
  materials?: string[] | undefined;
  previousSessions?: {
    date: string;
    notes: string;
  }[] | undefined;
}

export default function SessionDetailsPage() {
  const { isOnline } = useSyncContext();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const { startSession, completeSession, cancelSession, addNote } = useSessionStore();

  useEffect(() => {
    // Use local store as data source for now
    const fetchSessionDetails = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const mapLesson: Record<string, Partial<SessionDetails>> = {
          '1': {
            lessonPlan: 'Review multiplication tables, introduce basic algebra concepts, practice word problems.',
            materials: ['Textbook pages 45-50', 'Worksheet on basic equations', 'Multiplication flash cards'],
            previousSessions: [
              { date: '2025-03-28', notes: 'Completed addition and subtraction review. Emma is making good progress.' },
              { date: '2025-03-21', notes: 'Introduced fractions. Need more practice next time.' },
            ],
          },
          '2': {
            lessonPlan: 'Introduction to the solar system, planet characteristics, and space exploration.',
            materials: ['Science textbook chapter 8', 'Solar system model', 'NASA videos'],
            previousSessions: [
              { date: '2025-03-29', notes: 'Completed unit on ecosystems. Noah showed great interest in marine biology.' },
            ],
          },
          '3': {
            lessonPlan: 'Reading comprehension, grammar review, and creative writing practice.',
            materials: ['English textbook', 'Grammar worksheet', 'Short story collection'],
            previousSessions: [
              { date: '2025-03-27', notes: 'Vocabulary building and sentence structure.' },
              { date: '2025-03-20', notes: 'Essay writing techniques and transitions.' },
            ],
          },
        };

        const raw = localStorage.getItem('gkh_sessions_v1');
        const list = raw ? JSON.parse(raw) : defaultSessions;
        const base = list.find((s: any) => s.id === sessionId);
        if (base) {
          setSession({ ...base, ...(mapLesson[sessionId] || {}) });
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Error fetching session details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [sessionId]);

  const handleStartSession = () => {
    if (session) {
      startSession(session.id);
      setSession({ ...session, status: 'in-progress' });
    }
  };

  const handleCompleteSession = () => {
    if (session) {
      completeSession(session.id, notes || session.notes);
      setSession({ ...session, status: 'completed', notes: notes || session.notes });
    }
  };

  const handleCancelSession = () => {
    if (session) {
      cancelSession(session.id);
      setSession({ ...session, status: 'cancelled' });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Loading session details...</h1>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Session Not Found</h1>
        <p>The requested session could not be found.</p>
        <Link href="/teacher/sessions" className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Back to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Session Details</h1>
        <Link href="/teacher/sessions" className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
          Back to Sessions
        </Link>
      </div>
      
      <div className="mb-6 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <p className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {isOnline ? 'Online - Changes will sync automatically' : 'Offline - Changes will sync when connection is restored'}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">{session.childName}</h2>
            <p className="text-gray-600">Parent: {session.parentName}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
            session.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
            session.status === 'completed' ? 'bg-green-100 text-green-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="font-semibold text-gray-700">Subject</h3>
            <p>{session.subject}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Date</h3>
            <p>{session.date}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Time</h3>
            <p>{session.time}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Address</h3>
            <p>{session.address}</p>
          </div>
        </div>

        {session.lessonPlan && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Lesson Plan</h3>
            <p className="bg-gray-50 p-3 rounded">{session.lessonPlan}</p>
          </div>
        )}

        {session.materials && session.materials.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Materials</h3>
            <ul className="list-disc pl-5">
              {session.materials.map((material, index) => (
                <li key={index}>{material}</li>
              ))}
            </ul>
          </div>
        )}

        {session.status === 'completed' && session.notes && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Session Notes</h3>
            <p className="bg-gray-50 p-3 rounded">{session.notes}</p>
          </div>
        )}

        {session.status === 'in-progress' && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-2">Session Notes</h3>
            <textarea
              className="w-full p-3 border rounded"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes about this session..."
            ></textarea>
          </div>
        )}

        <div className="flex space-x-3">
          {session.status === 'scheduled' && (
            <>
              <button 
                onClick={handleStartSession}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Start Session
              </button>
              <button 
                onClick={handleCancelSession}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cancel Session
              </button>
            </>
          )}
          {session.status === 'in-progress' && (
            <button 
              onClick={handleCompleteSession}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Complete Session
            </button>
          )}
        </div>
      </div>

      {session.previousSessions && session.previousSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Previous Sessions</h3>
          <div className="space-y-4">
            {session.previousSessions.map((prevSession, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{prevSession.date}</h4>
                </div>
                <p className="text-gray-700">{prevSession.notes}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
