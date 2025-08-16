import React from 'react';
import { SyncProvider } from '@/lib/syncContext';
import { AuthProvider } from '@/lib/authContext';
import { ThemeProvider } from '@/design-system/themes/theme-provider';
import { Header } from '@/components/Header';
import { DemoNavigation } from '@/components/navigation/DemoNavigation';
import { AccessibilityProvider } from '@/components/accessibility/AccessibilityProvider';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Gurukool - AI-Enhanced Homeschooling Platform</title>
        <meta
          name="description"
          content="Streamline your homeschooling experience with AI-powered insights, secure authentication, and comprehensive student management."
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <SyncProvider>
              <AccessibilityProvider>{children}</AccessibilityProvider>
            </SyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
