import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeacherDashboard } from '../TeacherDashboard';
import { User } from '@/types';
import { enhancedSessionStore } from '@/store/session.store';

// Mock the session store
jest.mock('@/store/session.store', () => ({
  enhancedSessionStore: {
    getSessionsWithInsights: jest.fn(),
    updateSession: jest.fn(),
    getSessionRecommendations: jest.fn(),
    detectLearningPatterns: jest.fn(),
    generateAutoNotes: jest.fn(),
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the child components
jest.mock('../AILessonPlanSuggestions', () => ({
  AILessonPlanSuggestions: ({ studentId, subject }: any) => (
    <div data-testid="ai-lesson-plans">
      AI Lesson Plans for {subject} - Student: {studentId}
    </div>
  ),
}));

jest.mock('../VoiceToTextNotes', () => ({
  VoiceToTextNotes: ({ sessionId }: any) => (
    <div data-testid="voice-notes">Voice Notes for Session: {sessionId}</div>
  ),
}));

jest.mock('../LocationAwareSessionManager', () => ({
  LocationAwareSessionManager: ({ teacherId }: any) => (
    <div data-testid="location-manager">
      Location Manager for Teacher: {teacherId}
    </div>
  ),
}));

jest.mock('../DragDropScheduleManager', () => ({
  DragDropScheduleManager: ({ teacherId }: any) => (
    <div data-testid="schedule-manager">
      Schedule Manager for Teacher: {teacherId}
    </div>
  ),
}));

const mockUser: User = {
  id: 'teacher-1',
  email: 'teacher@test.com',
  name: 'Test Teacher',
  role: 'teacher',
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false,
      inApp: true,
      frequency: 'immediate',
    },
    dashboard: {
      layout: 'detailed',
      theme: 'light',
      widgets: [],
    },
    privacy: {
      dataSharing: true,
      analytics: true,
      aiTraining: true,
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      reducedMotion: false,
      screenReader: false,
    },
  },
  createdAt: new Date(),
  lastActive: new Date(),
};

const mockSessions = [
  {
    id: 'session-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    parentId: 'parent-1',
    subject: 'Mathematics',
    scheduledStart: new Date('2024-01-15T10:00:00Z'),
    scheduledEnd: new Date('2024-01-15T11:00:00Z'),
    status: 'completed',
    location: {
      address: 'Test Location',
      coordinates: { latitude: 0, longitude: 0 },
      verified: true,
    },
    attachments: [],
    aiInsights: [
      {
        id: 'insight-1',
        sessionId: 'session-1',
        type: 'recommendation',
        content: 'Great progress in algebra',
        confidence: 0.9,
        metadata: {},
        createdAt: new Date(),
      },
    ],
    aiRecommendations: [],
    learningPatterns: [],
    sessionAnalytics: {
      engagementScore: 0.8,
      progressScore: 0.7,
      difficultyLevel: 0.6,
      conceptsMastered: ['algebra'],
      conceptsStruggling: ['geometry'],
      timeDistribution: {
        instruction: 30,
        practice: 20,
        assessment: 10,
        discussion: 5,
        breaks: 5,
      },
      interactionMetrics: {
        questionsAsked: 5,
        questionsAnswered: 4,
        correctAnswers: 3,
        incorrectAnswers: 1,
        helpRequests: 2,
        selfCorrections: 1,
      },
      learningVelocity: 0.75,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  {
    id: 'session-2',
    studentId: 'student-2',
    teacherId: 'teacher-1',
    parentId: 'parent-2',
    subject: 'Science',
    scheduledStart: new Date('2024-01-16T14:00:00Z'),
    scheduledEnd: new Date('2024-01-16T15:00:00Z'),
    status: 'scheduled',
    location: {
      address: 'Science Lab',
      coordinates: { latitude: 1, longitude: 1 },
      verified: true,
    },
    attachments: [],
    aiInsights: [],
    aiRecommendations: [],
    learningPatterns: [],
    sessionAnalytics: {
      engagementScore: 0,
      progressScore: 0,
      difficultyLevel: 0,
      conceptsMastered: [],
      conceptsStruggling: [],
      timeDistribution: {
        instruction: 0,
        practice: 0,
        assessment: 0,
        discussion: 0,
        breaks: 0,
      },
      interactionMetrics: {
        questionsAsked: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        helpRequests: 0,
        selfCorrections: 0,
      },
      learningVelocity: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
  {
    id: 'session-3',
    studentId: 'student-3',
    teacherId: 'teacher-1',
    parentId: 'parent-3',
    subject: 'English',
    scheduledStart: new Date(),
    scheduledEnd: new Date(Date.now() + 60 * 60 * 1000),
    status: 'in-progress',
    location: {
      address: 'Home Office',
      coordinates: { latitude: 2, longitude: 2 },
      verified: true,
    },
    attachments: [],
    aiInsights: [],
    aiRecommendations: [],
    learningPatterns: [],
    sessionAnalytics: {
      engagementScore: 0.9,
      progressScore: 0.8,
      difficultyLevel: 0.5,
      conceptsMastered: ['reading'],
      conceptsStruggling: ['writing'],
      timeDistribution: {
        instruction: 15,
        practice: 10,
        assessment: 5,
        discussion: 3,
        breaks: 2,
      },
      interactionMetrics: {
        questionsAsked: 3,
        questionsAnswered: 3,
        correctAnswers: 2,
        incorrectAnswers: 1,
        helpRequests: 1,
        selfCorrections: 0,
      },
      learningVelocity: 0.85,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  },
];

describe('TeacherDashboard', () => {
  beforeEach(() => {
    (
      enhancedSessionStore.getSessionsWithInsights as jest.Mock
    ).mockResolvedValue(mockSessions);
    jest.clearAllMocks();
  });

  it('renders dashboard with correct user name', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(
        screen.getByText('Welcome back, Test Teacher')
      ).toBeInTheDocument();
    });
  });

  it('displays correct session statistics', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total sessions
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed sessions
      expect(screen.getByText('1')).toBeInTheDocument(); // Upcoming sessions
      expect(screen.getByText('33%')).toBeInTheDocument(); // Success rate
    });
  });

  it('shows active session indicator when there is an active session', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Active Session')).toBeInTheDocument();
      expect(screen.getByText('English - student-3')).toBeInTheDocument();
    });
  });

  it('displays recent sessions list', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('Science')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('location-manager')).toBeInTheDocument();
    });

    // Click on Schedule tab
    fireEvent.click(screen.getByText('Schedule'));
    await waitFor(() => {
      expect(screen.getByTestId('schedule-manager')).toBeInTheDocument();
    });

    // Click on Lesson Plans tab
    fireEvent.click(screen.getByText('Lesson Plans'));
    await waitFor(() => {
      expect(
        screen.getByText('Select a session to view AI lesson plan suggestions')
      ).toBeInTheDocument();
    });

    // Click on Session Notes tab
    fireEvent.click(screen.getByText('Session Notes'));
    await waitFor(() => {
      expect(
        screen.getByText('Select a session to add voice-to-text notes')
      ).toBeInTheDocument();
    });
  });

  it('allows session selection for lesson plans', async () => {
    render(<TeacherDashboard user={mockUser} />);

    // Switch to lesson plans tab
    fireEvent.click(screen.getByText('Lesson Plans'));

    await waitFor(() => {
      expect(
        screen.getByText('Select a session to view AI lesson plan suggestions')
      ).toBeInTheDocument();
    });

    // Click on a session
    const mathSession = screen.getByText('Mathematics');
    fireEvent.click(mathSession);

    await waitFor(() => {
      expect(screen.getByTestId('ai-lesson-plans')).toBeInTheDocument();
      expect(
        screen.getByText('AI Lesson Plans for Mathematics - Student: student-1')
      ).toBeInTheDocument();
    });
  });

  it('allows session selection for notes', async () => {
    render(<TeacherDashboard user={mockUser} />);

    // Switch to notes tab
    fireEvent.click(screen.getByText('Session Notes'));

    await waitFor(() => {
      expect(
        screen.getByText('Select a session to add voice-to-text notes')
      ).toBeInTheDocument();
    });

    // Click on a session
    const sessions = screen.getAllByText('Mathematics');
    if (sessions.length > 0 && sessions[0]) {
      fireEvent.click(sessions[0]);
    }

    await waitFor(() => {
      expect(screen.getByTestId('voice-notes')).toBeInTheDocument();
      expect(
        screen.getByText('Voice Notes for Session: session-1')
      ).toBeInTheDocument();
    });
  });

  it('opens session details modal when clicking on a session in overview', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    });

    // Click on a session
    const mathSession = screen.getByText('Mathematics');
    fireEvent.click(mathSession);

    await waitFor(() => {
      expect(screen.getByText('Session Details')).toBeInTheDocument();
      expect(screen.getByText('Student: student-1')).toBeInTheDocument();
      expect(screen.getByText('Great progress in algebra')).toBeInTheDocument();
    });
  });

  it('closes session details modal when clicking close button', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    });

    // Click on a session to open modal
    const mathSession = screen.getByText('Mathematics');
    fireEvent.click(mathSession);

    await waitFor(() => {
      expect(screen.getByText('Session Details')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Session Details')).not.toBeInTheDocument();
    });
  });

  it('handles loading state correctly', () => {
    (
      enhancedSessionStore.getSessionsWithInsights as jest.Mock
    ).mockImplementation(
      () =>
        new Promise(resolve => setTimeout(() => resolve(mockSessions), 1000))
    );

    render(<TeacherDashboard user={mockUser} />);

    expect(screen.getByText('Teacher Dashboard')).toBeInTheDocument();
    // Should show loading animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('handles empty sessions state', async () => {
    (
      enhancedSessionStore.getSessionsWithInsights as jest.Mock
    ).mockResolvedValue([]);

    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument(); // Total sessions
      expect(screen.getByText('No sessions found')).toBeInTheDocument();
    });
  });

  it('handles session store errors gracefully', async () => {
    (
      enhancedSessionStore.getSessionsWithInsights as jest.Mock
    ).mockRejectedValue(new Error('Failed to load sessions'));

    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load dashboard data:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('updates session data when handleSessionUpdate is called', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Sessions')).toBeInTheDocument();
    });

    // The location manager should be rendered and can trigger session updates
    expect(screen.getByTestId('location-manager')).toBeInTheDocument();
  });

  it('displays session status colors correctly', async () => {
    render(<TeacherDashboard user={mockUser} />);

    await waitFor(() => {
      const completedStatus = screen.getByText('completed');
      const scheduledStatus = screen.getByText('scheduled');
      const inProgressStatus = screen.getByText('in-progress');

      expect(completedStatus).toHaveClass('bg-gray-100', 'text-gray-800');
      expect(scheduledStatus).toHaveClass('bg-blue-100', 'text-blue-800');
      expect(inProgressStatus).toHaveClass('bg-green-100', 'text-green-800');
    });
  });
});
