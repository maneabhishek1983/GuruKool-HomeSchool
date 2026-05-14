import { EnhancedSessionStore } from '../session.store';
import {
  SchedulingRequest,
  SessionRecord,
  SessionQuery,
} from '@/types/session.types';
import { User } from '@/types';

// Mock the entire agent modules
jest.mock('@/agents/task-automation.agent', () => ({
  TaskAutomationAgent: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      data: {
        autoNotes: {
          summary: 'Great session on algebra',
          keyPoints: [
            'Covered quadratic equations',
            'Student showed good understanding',
          ],
          achievements: ['Solved 5 problems correctly'],
          challenges: ['Struggled with word problems'],
          nextSteps: ['Practice more word problems'],
          confidence: 0.85,
          generatedAt: new Date(),
          approved: false,
        },
      },
      insights: [
        {
          id: 'insight-1',
          sessionId: 'session-1',
          type: 'recommendation',
          content: 'This is a good time for learning',
          confidence: 0.8,
          metadata: {},
          createdAt: new Date(),
        },
      ],
      actions: [],
    }),
  })),
}));

jest.mock('@/agents/analytics.agent', () => ({
  AnalyticsAgent: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      data: {
        patterns: [
          {
            id: 'pattern-1',
            pattern: 'Better performance in morning sessions',
            frequency: 0.8,
            impact: 'positive',
            confidence: 0.9,
            detectedAt: new Date(),
            metadata: { timeOfDay: 'morning' },
          },
        ],
        recommendations: [
          {
            id: 'rec-1',
            type: 'scheduling',
            title: 'Schedule more frequent short sessions',
            description:
              'Student shows better retention with 45-minute sessions',
            confidence: 0.85,
            priority: 'high',
            actionable: true,
            metadata: { optimalDuration: 45 },
            createdAt: new Date(),
          },
        ],
      },
      insights: [
        {
          id: 'insight-1',
          sessionId: 'session-1',
          type: 'recommendation',
          content: 'Morning sessions work best for this student',
          confidence: 0.9,
          metadata: { timeOfDay: 'morning' },
          createdAt: new Date(),
        },
      ],
    }),
  })),
}));

describe('EnhancedSessionStore', () => {
  let sessionStore: EnhancedSessionStore;
  let mockUser: User;
  let mockSchedulingRequest: SchedulingRequest;

  beforeEach(() => {
    // Reset the singleton instance to ensure clean state
    (EnhancedSessionStore as any).instance = null;
    sessionStore = EnhancedSessionStore.getInstance();
    // Clear all data including sample data
    sessionStore.clearAll();

    mockUser = {
      id: 'user-1',
      email: 'parent@test.com',
      name: 'Test Parent',
      role: 'parent',
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

    mockSchedulingRequest = {
      studentId: 'student-1',
      teacherId: 'teacher-1',
      subject: 'Mathematics',
      preferredTimes: [
        {
          start: new Date('2024-01-15T10:00:00Z'),
          end: new Date('2024-01-15T11:00:00Z'),
          flexibility: 0.5,
        },
      ],
      duration: 60,
      priority: 'medium',
      constraints: [],
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session successfully when no conflicts exist', async () => {
      const result = await sessionStore.createSession(
        mockSchedulingRequest,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.scheduledSession).toBeDefined();
      expect(result.scheduledSession?.subject).toBe('Mathematics');
      expect(result.scheduledSession?.status).toBe('scheduled');
      expect(result.scheduledSession?.aiInsights).toHaveLength(1);
    });

    it('should detect scheduling conflicts and provide alternatives', async () => {
      // First create a session to cause conflict
      await sessionStore.createSession(mockSchedulingRequest, mockUser);

      // Try to create another session at the same time
      const conflictingRequest = { ...mockSchedulingRequest };
      const result = await sessionStore.createSession(
        conflictingRequest,
        mockUser
      );

      expect(result.success).toBe(false);
      expect(result.conflicts).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.aiRecommendations).toBeDefined();
    });

    it('should generate AI insights for new sessions', async () => {
      const result = await sessionStore.createSession(
        mockSchedulingRequest,
        mockUser
      );

      expect(result.success).toBe(true);
      expect(result.scheduledSession?.aiInsights).toHaveLength(1);
      expect(result.scheduledSession?.aiInsights[0]!.content).toContain(
        'Morning sessions work best'
      );
    });
  });

  describe('updateSession', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await sessionStore.createSession(
        mockSchedulingRequest,
        mockUser
      );
      sessionId = result.scheduledSession!.id;
    });

    it('should update session successfully', async () => {
      const updateRequest = {
        sessionId,
        updates: {
          status: 'in-progress' as const,
          actualStart: new Date(),
        },
        requestedBy: mockUser.id,
        aiAssisted: true,
      };

      const updatedSession = await sessionStore.updateSession(
        updateRequest,
        mockUser
      );

      expect(updatedSession).toBeDefined();
      expect(updatedSession?.status).toBe('in-progress');
      expect(updatedSession?.actualStart).toBeDefined();
      expect(updatedSession?.version).toBe(2);
    });

    it('should generate auto notes when session is completed', async () => {
      const updateRequest = {
        sessionId,
        updates: {
          status: 'completed' as const,
          actualEnd: new Date(),
        },
        requestedBy: mockUser.id,
        aiAssisted: true,
      };

      const updatedSession = await sessionStore.updateSession(
        updateRequest,
        mockUser
      );

      expect(updatedSession?.autoGeneratedNotes).toBeDefined();
      expect(updatedSession?.autoGeneratedNotes?.summary).toContain('algebra');
      expect(updatedSession?.autoGeneratedNotes?.keyPoints).toHaveLength(2);
    });

    it('should return null for non-existent session', async () => {
      const updateRequest = {
        sessionId: 'non-existent',
        updates: { status: 'completed' as const },
        requestedBy: mockUser.id,
      };

      const result = await sessionStore.updateSession(updateRequest, mockUser);

      expect(result).toBeNull();
    });
  });

  describe('getSessionsWithInsights', () => {
    beforeEach(async () => {
      // Create multiple sessions
      await sessionStore.createSession(mockSchedulingRequest, mockUser);
      await sessionStore.createSession(
        {
          ...mockSchedulingRequest,
          subject: 'Science',
          preferredTimes: [
            {
              start: new Date('2024-01-16T10:00:00Z'),
              end: new Date('2024-01-16T11:00:00Z'),
              flexibility: 0.5,
            },
          ],
        },
        mockUser
      );
    });

    it('should return sessions with AI insights when requested', async () => {
      const query: SessionQuery = {
        studentId: 'student-1',
        includeAIInsights: true,
      };

      const sessions = await sessionStore.getSessionsWithInsights(query);

      expect(sessions).toHaveLength(2);
      expect(sessions[0]!.aiInsights).toBeDefined();
    });

    it('should filter sessions by student ID', async () => {
      const query: SessionQuery = {
        studentId: 'student-1',
      };

      const sessions = await sessionStore.getSessionsWithInsights(query);

      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.studentId === 'student-1')).toBe(true);
    });

    it('should filter sessions by status', async () => {
      const query: SessionQuery = {
        status: ['scheduled'],
      };

      const sessions = await sessionStore.getSessionsWithInsights(query);

      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.status === 'scheduled')).toBe(true);
    });

    it('should sort sessions by date', async () => {
      const query: SessionQuery = {
        sortBy: 'date',
        sortOrder: 'asc',
      };

      const sessions = await sessionStore.getSessionsWithInsights(query);

      expect(sessions).toHaveLength(2);
      expect(sessions[0]!.scheduledStart.getTime()).toBeLessThan(
        sessions[1]!.scheduledStart.getTime()
      );
    });
  });

  describe('detectLearningPatterns', () => {
    beforeEach(async () => {
      // Create some sessions
      await sessionStore.createSession(mockSchedulingRequest, mockUser);
    });

    it('should detect learning patterns using AI', async () => {
      const patterns = await sessionStore.detectLearningPatterns('student-1');

      expect(patterns).toHaveLength(1);
      expect(patterns[0]!.pattern).toContain('morning sessions');
      expect(patterns[0]!.impact).toBe('positive');
      expect(patterns[0]!.confidence).toBe(0.9);
    });

    it('should return cached patterns on subsequent calls', async () => {
      // First call
      await sessionStore.detectLearningPatterns('student-1');

      // Second call should use cache
      const patterns = await sessionStore.detectLearningPatterns('student-1');

      expect(patterns).toHaveLength(1);
    });
  });

  describe('getSessionRecommendations', () => {
    beforeEach(async () => {
      await sessionStore.createSession(mockSchedulingRequest, mockUser);
    });

    it('should generate AI-powered session recommendations', async () => {
      const recommendations = await sessionStore.getSessionRecommendations(
        'student-1',
        'teacher-1'
      );

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0]!.type).toBe('scheduling');
      expect(recommendations[0]!.title).toContain('frequent short sessions');
      expect(recommendations[0]!.priority).toBe('high');
    });
  });

  describe('generateAutoNotes', () => {
    let mockSession: SessionRecord;

    beforeEach(() => {
      mockSession = {
        id: 'session-1',
        studentId: 'student-1',
        teacherId: 'teacher-1',
        parentId: 'parent-1',
        subject: 'Mathematics',
        scheduledStart: new Date(),
        scheduledEnd: new Date(),
        location: {
          address: 'Test Location',
          coordinates: { latitude: 0, longitude: 0 },
          verified: true,
        },
        status: 'completed',
        attachments: [],
        aiInsights: [],
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
      };
    });

    it('should generate automatic notes using AI', async () => {
      const autoNotes = await sessionStore.generateAutoNotes(mockSession);

      expect(autoNotes.summary).toContain('algebra');
      expect(autoNotes.keyPoints).toHaveLength(2);
      expect(autoNotes.achievements).toHaveLength(1);
      expect(autoNotes.challenges).toHaveLength(1);
      expect(autoNotes.nextSteps).toHaveLength(1);
      expect(autoNotes.confidence).toBe(0.85);
    });

    it('should provide fallback notes when AI fails', async () => {
      // Create a new store instance with a failing agent
      (EnhancedSessionStore as any).instance = null;

      // Mock AI failure
      const { TaskAutomationAgent } = require('@/agents/task-automation.agent');
      TaskAutomationAgent.mockImplementation(() => ({
        execute: jest.fn().mockResolvedValue({
          success: false,
          error: 'AI service unavailable',
        }),
      }));

      const failingSessionStore = EnhancedSessionStore.getInstance();
      const autoNotes =
        await failingSessionStore.generateAutoNotes(mockSession);

      expect(autoNotes.summary).toContain('Session completed');
      expect(autoNotes.confidence).toBe(0.5);
      expect(autoNotes.approved).toBe(false);
    });
  });
});
