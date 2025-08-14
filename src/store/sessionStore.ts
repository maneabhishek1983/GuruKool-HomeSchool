"use client";

import { useEffect, useMemo, useState } from 'react';

export type SessionStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface SessionRecord {
  id: string;
  childName: string;
  parentName: string;
  subject: string;
  date: string;
  time: string;
  address: string;
  status: SessionStatus;
  notes?: string | undefined;
}

const STORAGE_KEY = 'gkh_sessions_v1';

export const defaultSessions: SessionRecord[] = [
  {
    id: '1',
    childName: 'Emma Smith',
    parentName: 'John Smith',
    subject: 'Mathematics',
    date: '2025-04-04',
    time: '14:00 - 16:00',
    address: '123 Main St, Anytown, USA',
    status: 'scheduled',
  },
  {
    id: '2',
    childName: 'Noah Smith',
    parentName: 'John Smith',
    subject: 'Science',
    date: '2025-04-05',
    time: '10:00 - 12:00',
    address: '123 Main St, Anytown, USA',
    status: 'scheduled',
  },
  {
    id: '3',
    childName: 'Olivia Johnson',
    parentName: 'Sarah Johnson',
    subject: 'English',
    date: '2025-04-03',
    time: '13:00 - 15:00',
    address: '456 Oak Ave, Anytown, USA',
    status: 'completed',
    notes: 'Covered chapters 3-5. Homework assigned for next week.',
  },
];

export function useSessionStore() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSessions(JSON.parse(raw));
      } else {
        setSessions(defaultSessions);
      }
    } catch {
      setSessions(defaultSessions);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  const actions = useMemo(() => ({
    startSession(id: string) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'in-progress' } : s));
    },
    completeSession(id: string, notes?: string) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'completed', notes: notes ?? s.notes } : s));
    },
    cancelSession(id: string) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    },
    addNote(id: string, note: string) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, notes: note } : s));
    }
  }), []);

  return { sessions, ...actions };
}


