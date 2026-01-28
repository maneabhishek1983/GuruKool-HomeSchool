import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { analyticsService } from '@/services/analytics.service';

// Mock the analytics service
jest.mock('@/services/analytics.service', () => {
  const mockService = {
    getLearningProgress: jest.fn().mockResolvedValue({
      progressPercentage: 78.5,
      totalSessions: 25,
      totalHours: 42.5,
      averageRating: 4.8,
      trendData: [
        { date: '2024-01-01', score: 75 },
        { date: '2024-01-02', score: 80 },
      ],
      strengthAreas: ['Mathematics', 'Logic'],
      improvementAreas: ['History', 'Writing'],
      milestones: [
        {
          id: '1',
          title: 'Algebra Basics',
          description: 'Mastered linear equations',
          progress: 100,
        },
        {
          id: '2',
          title: 'Geometry',
          description: 'Understanding shapes',
          progress: 60,
        },
      ],
    }),
    getSessionMetrics: jest.fn().mockResolvedValue({
      totalSessions: 25,
      averageDuration: 45,
      completionRate: 92,
    }),
    getTeacherPerformance: jest.fn().mockResolvedValue({
      averageRating: 4.8,
      studentRetention: 95,
      punctualityScore: 98,
      preparationScore: 92,
      engagementScore: 4.9,
      monthlyTrends: [
        { month: 'Jan', rating: 4.7, retention: 94 },
        { month: 'Feb', rating: 4.9, retention: 96 },
      ],
      subjectExpertise: [
        { subject: 'Math', score: 95 },
        { subject: 'Physics', score: 90 },
      ],
    }),
    getSessionAnalytics: jest.fn().mockResolvedValue({
      totalSessions: 25,
      completedSessions: 23,
      averageDuration: 45,
      averageRating: 4.5,
      sessionsBySubject: [],
      sessionsByTimeOfDay: [],
      sessionsByDayOfWeek: [],
    }),
    getComparativeAnalytics: jest.fn().mockResolvedValue({}),
  };

  return {
    AnalyticsService: jest.fn(),
    analyticsService: mockService,
  };
});

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  AreaChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  RadarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="radar-chart">{children}</div>
  ),
  Radar: () => <div data-testid="radar" />,
  PolarGrid: () => <div data-testid="polar-grid" />,
  PolarAngleAxis: () => <div data-testid="polar-angle-axis" />,
  PolarRadiusAxis: () => <div data-testid="polar-radius-axis" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => children,
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
      // Check for chart title or metrics
      expect(screen.getByText(/Learning Progress Trend/i)).toBeInTheDocument();
    });
  });

  it('renders session metrics section', async () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    // Switch to Sessions tab first if needed, but activeView defaults to progress.
    // Wait, we need to click the tab to see session metrics!
    // But default view is 'progress'. Test needs to click 'Sessions'.
    const sessionTab = screen.getByText('Sessions');
    sessionTab.click();
    // Use fireEvent or userEvent. Since userEvent setup is better...
    // But sticking to simple click for now if fireEvent is imported.
    // fireEvent.click(sessionTab);

    await waitFor(() => {
      expect(screen.getByText(/Sessions by Subject/i)).toBeInTheDocument();
    });
  });

  it('renders teacher performance section for admin role', async () => {
    render(<AnalyticsDashboard {...defaultProps} userRole="admin" />);
    // Needs to click Performance tab
    // However, logic says if userRole is teacher, it loads data.
    // The component renders Tabs.
    // Step 232 line 60: activeView defaults to 'progress'.
    // And teacher performance data is loaded if userRole is teacher.
    // Use userRole='teacher' for this test to match data loading logic?
    // Step 232 line 116: if userRole === 'teacher', load performance.
    // If admin, it loads everything? No.
    // Step 232 line 96: filter logic differs.
    // The test mock returns performance data.

    // Let's click the tab.
    const performanceTab = screen.getByText('Performance');
    performanceTab.click();

    await waitFor(() => {
      expect(screen.getByText(/Performance Overview/i)).toBeInTheDocument();
    });
  });

  it('does not render teacher performance for non-admin roles', async () => {
    // This test logic is flawed if tabs are always visible but data is hidden?
    // Step 232: Tab navigation is ALWAYS visible.
    // Line 293: Renders all tabs: progress, performance, sessions, comparison.
    // So 'Performance' tab IS visible for everyone.
    // But maybe the content is null?
    // If userRole is parent, line 106 loads learning progress.
    // line 116 (teacher) NOT called.
    // So teacherPerformance state is null.
    // Line 443: {activeView === 'performance' && teacherPerformance && (
    // So clicking 'Performance' tab shows NOTHING.

    render(<AnalyticsDashboard {...defaultProps} userRole="parent" />);
    const performanceTab = screen.getByText('Performance');
    performanceTab.click();

    await waitFor(() => {
      expect(
        screen.queryByText(/Performance Overview/i)
      ).not.toBeInTheDocument();
    });
  });

  it('renders charts when data is loaded', async () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', async () => {
    // Delay the response
    (analyticsService.getLearningProgress as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                progressPercentage: 78.5,
                totalSessions: 25,
                totalHours: 42.5,
                averageRating: 4.8,
                trendData: [],
                strengthAreas: [],
                improvementAreas: [],
                milestones: [],
              }),
            100
          )
        )
    );

    render(<AnalyticsDashboard {...defaultProps} />);
    expect(screen.getByTestId('loading-skeletons')).toBeInTheDocument();

    // Wait for it to disappear (optional but good practice)
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeletons')).not.toBeInTheDocument();
    });
  });

  it('renders error state when data fails to load', async () => {
    // Mock the service to throw an error
    const mockAnalyticsService =
      require('@/services/analytics.service').AnalyticsService;
    mockAnalyticsService.mockImplementationOnce(() => ({
      getLearningProgress: jest
        .fn()
        .mockRejectedValue(new Error('Failed to load')),
      getSessionMetrics: jest
        .fn()
        .mockRejectedValue(new Error('Failed to load')),
      getTeacherPerformance: jest
        .fn()
        .mockRejectedValue(new Error('Failed to load')),
    }));

    render(<AnalyticsDashboard {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Error loading analytics/i)).toBeInTheDocument();
    });
  });

  it('renders refresh button', () => {
    render(<AnalyticsDashboard {...defaultProps} />);
    expect(
      screen.getByRole('button', { name: /refresh/i })
    ).toBeInTheDocument();
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
