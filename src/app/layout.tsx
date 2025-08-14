import React from 'react';
import { SyncProvider } from '@/lib/syncContext';
import { AuthProvider } from '@/lib/authContext';
import { ThemeProvider } from '@/design-system/themes/theme-provider';
import { Header } from '@/components/Header';
import { DemoNavigation } from '@/components/navigation/DemoNavigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <SyncProvider>
              <Header />
              {/* <DemoNavigation /> */}
              <div className="mx-auto max-w-6xl px-4 py-6">
                {children}
              </div>
            </SyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
