'use client';

import ErrorPage from '@/components/shared/ErrorPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      type="500"
      description={`${error.message || 'Something went wrong on our end. Our team has been notified and is working to fix it.'}`}
      showRetryButton
      onRetry={reset}
    />
  );
}
