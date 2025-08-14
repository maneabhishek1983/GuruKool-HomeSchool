"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SyncBadge } from '@/components/SyncBadge';
import { useAuthContext } from '@/lib/authContext';

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-20">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg tracking-tight">GuruKool HomeSchool</Link>
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/teacher/dashboard"
              className={`px-3 py-2 rounded text-sm font-medium ${isActive('/teacher/dashboard') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/teacher/sessions"
              className={`px-3 py-2 rounded text-sm font-medium ${isActive('/teacher/sessions') ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              Sessions
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SyncBadge />
          {user ? (
            <button onClick={logout} className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm">Logout</button>
          ) : (
            <Link href="/login" className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}


