'use client';

import { useState, useEffect } from 'react';

interface Exception {
  id: string;
  teacher_id: string;
  student_id: string;
  reason: string;
  alternate_location?: string;
  alternate_latitude?: number;
  alternate_longitude?: number;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  valid_from: string;
  valid_until: string;
  created_at: string;
  students: { name: string };
  teachers: { user_id: string; users: { email: string } };
}

export default function ExceptionApproval() {
  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState<string>('');
  const [showDenialModal, setShowDenialModal] = useState(false);
  const [selectedExceptionId, setSelectedExceptionId] = useState<string | null>(null);

  useEffect(() => {
    fetchExceptions();
  }, []);

  const fetchExceptions = async () => {
    try {
      const response = await fetch('/api/geofence/exception/approve?status=pending');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exception requests');
      }

      const data = await response.json();
      setExceptions(data.exceptions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exceptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (exceptionId: string) => {
    setProcessingId(exceptionId);
    setError(null);

    try {
      const response = await fetch('/api/geofence/exception/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exceptionId,
          approved: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve exception');
      }

      // Remove from list
      setExceptions(exceptions.filter((e) => e.id !== exceptionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve exception');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDenyClick = (exceptionId: string) => {
    setSelectedExceptionId(exceptionId);
    setShowDenialModal(true);
  };

  const handleDenyConfirm = async () => {
    if (!selectedExceptionId) return;

    setProcessingId(selectedExceptionId);
    setError(null);

    try {
      const response = await fetch('/api/geofence/exception/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exceptionId: selectedExceptionId,
          approved: false,
          denialReason: denialReason || 'No reason provided',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deny exception');
      }

      // Remove from list
      setExceptions(exceptions.filter((e) => e.id !== selectedExceptionId));
      setShowDenialModal(false);
      setDenialReason('');
      setSelectedExceptionId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deny exception');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (exceptions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Pending Exceptions
        </h3>
        <p className="text-gray-600">
          You don't have any exception requests to review at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Exception Requests ({exceptions.length})
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {exceptions.map((exception) => (
        <div key={exception.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {exception.students.name}
              </h3>
              <p className="text-sm text-gray-600">
                Teacher: {exception.teachers.users.email}
              </p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              Pending
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Reason:</label>
              <p className="text-gray-900 mt-1">{exception.reason}</p>
            </div>

            {exception.alternate_location && (
              <div>
                <label className="text-sm font-medium text-gray-700">Alternate Location:</label>
                <p className="text-gray-900 mt-1">{exception.alternate_location}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Valid From:</label>
                <p className="text-gray-900 mt-1">{formatDate(exception.valid_from)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Valid Until:</label>
                <p className="text-gray-900 mt-1">{formatDate(exception.valid_until)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Requested:</label>
              <p className="text-gray-900 mt-1">{formatDate(exception.created_at)}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleApprove(exception.id)}
              disabled={processingId === exception.id}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {processingId === exception.id ? 'Approving...' : '✓ Approve'}
            </button>
            <button
              onClick={() => handleDenyClick(exception.id)}
              disabled={processingId === exception.id}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {processingId === exception.id ? 'Denying...' : '✗ Deny'}
            </button>
          </div>
        </div>
      ))}

      {/* Denial Modal */}
      {showDenialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deny Exception Request
            </h3>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for denial (optional):
            </label>
            <textarea
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              placeholder="Explain why you're denying this request..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDenialModal(false);
                  setDenialReason('');
                  setSelectedExceptionId(null);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDenyConfirm}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Confirm Denial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
