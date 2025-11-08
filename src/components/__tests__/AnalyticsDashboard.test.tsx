import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

// Mock the analytics service
jest.mock('@/services/analytics.service', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    getLearningProgress: jest.fn().mockResolvedValue([
      { date: '2024-01-01', progress: 75 },
      { date: '2024-01-02', progress: 80 }
    ]),
    getSessionMetrics: jest.fn().mockResolvedValue({
      totalSessions: 25,
      averageDuration: 45,
      completionRate: 92
    }),
    getTeacherPerformance: jest.fn().mockResolvedValue([
      { teacherId: '1', name: 'John Doe', rating: 4.5, sessions: 12 },
      { teacherId: '2', name: 'Jane Smith', rating: 4.8, sessions: 15 }
    ])
  }))
}));

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />
}));

describe('AnalyticsDashboard Component', () => {
  const defaultProps = {
    userId: 'test-user-123',
    userRole: 'teacher' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with correct title', () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
  });

  it('renders learning progress section', async () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Learning Progress/i)).toBeInTheDocument();
    });
  });

  it('renders session metrics section', async () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Session Metrics/i)).toBeInTheDocument();
    });
  });

  it('renders teacher performance section for admin role', async () => {
    render(<AnalyticsDashboard {...defaultProps} userRole="admin" />);
    await waitFor(() => {
      expect(screen.getByText(/Teacher Performance/i)).toBeInTheDocument();
    });
  });

  it('does not render teacher performance for non-admin roles', async () => {
    render(<AnalyticsDashboard {...defaultProps} userRole="parent" />);
    await waitFor(() => {
      expect(screen.queryByText(/Teacher Performance/i)).not.toBeInTheDocument();
    });
  });

  it('renders charts when data is loaded', async () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Loading analytics/i)).toBeInTheDocument();
  });

  it('renders error state when data fails to load', async () => {
    // Mock the service to throw an error
    const mockAnalyticsService = require('@/services/analytics.service').AnalyticsService;
    mockAnalyticsService.mockImplementationOnce(() => ({
      getLearningProgress: jest.fn().mockRejectedValue(new Error('Failed to load')),
      getSessionMetrics: jest.fn().mockRejectedValue(new Error('Failed to load')),
      getTeacherPerformance: jest.fn().mockRejectedValue(new Error('Failed to load'))
    }));

    render(<AnalyticsDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Error loading analytics/i)).toBeInTheDocument();
    });
  });

  it('renders refresh button', () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  it('renders date range selector', () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    expect(screen.getByText(/Last 30 days/i)).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    const dashboard = screen.getByTestId('analytics-dashboard');
    expect(dashboard).toHaveClass('analytics-dashboard');
  });
});
