'use client';

import { useEffect, useState } from 'react';
import { createFormToken } from '@/lib/csrf';

interface CSRFTokenProps {
  fieldName?: string;
}

/**
 * CSRF Token component for forms
 * Automatically generates and includes CSRF tokens in form submissions
 */
export function CSRFToken({ fieldName = '_csrf' }: CSRFTokenProps) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    // Generate CSRF token on component mount
    const { token: csrfToken } = createFormToken();
    setToken(csrfToken);
  }, []);

  if (!token) {
    return null;
  }

  return (
    <input
      type="hidden"
      name={fieldName}
      value={token}
      data-testid="csrf-token"
    />
  );
}

/**
 * Hook to get CSRF token for API requests
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const { token: csrfToken } = createFormToken();
    setToken(csrfToken);
  }, []);

  return token;
}

/**
 * Hook to add CSRF token to fetch requests
 */
export function useCSRFHeaders() {
  const token = useCSRFToken();

  const getCSRFHeaders = () => ({
    'X-CSRF-Token': token,
    'Content-Type': 'application/json',
  });

  return { getCSRFHeaders, token };
}
