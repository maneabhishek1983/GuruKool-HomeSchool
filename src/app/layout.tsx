import React from 'react';
import { SyncProvider } from '@/lib/syncContext';
import { AuthProvider } from '@/lib/authContext';
import { ThemeProvider } from '@/design-system/themes/theme-provider';
import { RoleBasedThemeProvider } from '@/components/RoleBasedTheme';
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Gurukool - AI-Enhanced Homeschooling Platform</title>
        <meta
          name="description"
          content="Streamline your homeschooling experience with AI-powered insights, secure authentication, and comprehensive student management."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#E50914" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GuruKool" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme="netflix">
          <AuthProvider>
            <RoleBasedThemeProvider>
              <SyncProvider>
                <AccessibilityProvider>{children}</AccessibilityProvider>
              </SyncProvider>
            </RoleBasedThemeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
