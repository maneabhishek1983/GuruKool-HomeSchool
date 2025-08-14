import React from 'react';
import { AuthGuard } from '@/components/AuthGuard';

export default function TeacherSectionLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}


