'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SyncBadge } from '@/components/SyncBadge';
import { useAuthContext } from '@/lib/authContext';
import { Logo } from '@/components/Logo';

export function Header() {
  const pathname = usePathname();
  const authContext = useAuthContext();

  // Safely handle the case when context is not available
  const user = authContext?.user;
  const logout = authContext?.logout;

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <header className="border-b border-gurukool-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-20 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Logo size="sm" variant="default" />
            <span className="hidden sm:inline text-sm text-gurukool-gray-600 font-medium">
              HomeSchool
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/teacher/dashboard"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/teacher/dashboard') ? 'bg-gurukool-primary text-white shadow-sm' : 'text-gurukool-gray-700 hover:bg-gurukool-gray-100'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/teacher/sessions"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/teacher/sessions') ? 'bg-gurukool-primary text-white shadow-sm' : 'text-gurukool-gray-700 hover:bg-gurukool-gray-100'}`}
            >
              Sessions
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <SyncBadge />
          {user ? (
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg bg-gurukool-gray-100 hover:bg-gurukool-gray-200 text-sm font-medium text-gurukool-gray-700 transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-gurukool-primary hover:bg-gurukool-primary-dark text-white text-sm font-medium shadow-sm transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
