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
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <title>Gurukool - AI-Enhanced Homeschooling Platform</title>
        <meta
          name="description"
          content="Streamline your homeschooling experience with AI-powered insights, secure authentication, and comprehensive student management."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
