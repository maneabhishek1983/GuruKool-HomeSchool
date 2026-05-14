import { AnalyticsAgent } from '../analytics.agent';
import { AgentContext, User, Session } from '@/types';

describe('AnalyticsAgent', () => {
  let analyticsAgent: AnalyticsAgent;
  let mockUser: User;
  let mockSessions: Session[];
  let mockContext: AgentContext;

  beforeEach(() => {
    analyticsAgent = new AnalyticsAgent();

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'parent',
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          frequency: 'daily',
        },
        dashboard: {
          layout: 'detailed',
          theme: 'light',
          widgets: ['progress', 'analytics'],
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
      createdAt: new Date('2024-01-01'),
      lastActive: new Date(),
    };

    mockSessions = [
      {
        id: 'session-1',
        studentId: 'student-1',
        teacherId: 'teacher-1',
        parentId: 'parent-1',
        subject: 'mathematics',
        scheduledStart: new Date('2024-01-01T09:00:00Z'),
        scheduledEnd: new Date('2024-01-01T10:00:00Z'),
        actualStart: new Date('2024-01-01T09:05:00Z'),
        actualEnd: new Date('2024-01-01T10:00:00Z'),
        location: {
          address: '123 Test St',
          coordinates: { latitude: 40.7128, longitude: -74.006 },
          verified: true,
        },
        status: 'completed',
        notes: 'Great progress in algebra',
        aiInsights: [],
        attachments: [],
      },
      {
        id: 'session-2',
        studentId: 'student-1',
        teacherId: 'teacher-1',
        parentId: 'parent-1',
        subject: 'science',
        scheduledStart: new Date('2024-01-02T14:00:00Z'),
        scheduledEnd: new Date('2024-01-02T15:00:00Z'),
        actualStart: new Date('2024-01-02T14:00:00Z'),
        actualEnd: new Date('2024-01-02T15:00:00Z'),
        location: {
          address: '123 Test St',
          coordinates: { latitude: 40.7128, longitude: -74.006 },
          verified: true,
        },
        status: 'completed',
        notes: 'Excellent understanding of physics concepts',
        aiInsights: [],
        attachments: [],
      },
    ];

    mockContext = {
      user: mockUser,
      sessionData: mockSessions,
      preferences: mockUser.preferences,
      historicalData: {
        sessions: mockSessions,
        analytics: [],
        interactions: [],
      },
    };
  });

  describe('Basic Agent Properties', () => {
    it('should have correct agent properties', () => {
      expect(analyticsAgent.id).toBe('analytics');
      expect(analyticsAgent.name).toBe('Analytics Agent');
      expect(analyticsAgent.priority).toBe(6);
      expect(analyticsAgent.capabilities).toContain('learning-analytics');
      expect(analyticsAgent.capabilities).toContain(
        'learning-pattern-analysis'
      );
      expect(analyticsAgent.capabilities).toContain('gap-detection');
      expect(analyticsAgent.capabilities).toContain('weekly-reports');
      expect(analyticsAgent.capabilities).toContain('alert-generation');
    });
  });

  describe('Health Check', () => {
    it('should return healthy status on health check', async () => {
      const healthContext = { ...mockContext, healthCheck: true };
      const result = await analyticsAgent.execute(healthContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: 'healthy',
        agent: 'Analytics Agent',
      });
    });
  });

  describe('Learning Pattern Analysis', () => {
    it('should analyze learning patterns with sufficient data', async () => {
      const patternContext = {
        ...mockContext,
        eventType: 'learning_pattern_analysis',
        historicalData: {
          sessions: Array(6)
            .fill(null)
            .map((_, i) => ({
              ...mockSessions[0],
              id: `session-${i + 1}`,
              scheduledStart: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
              subject: i % 2 === 0 ? 'mathematics' : 'science',
            })),
          analytics: [],
          interactions: [],
        },
      };

      const result = await analyticsAgent.execute(patternContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userId', mockUser.id);
      expect(result.data).toHaveProperty('temporalPatterns');
      expect(result.data).toHaveProperty('subjectPatterns');
      expect(result.data).toHaveProperty('engagementPatterns');
      expect(result.data).toHaveProperty('learningStylePatterns');
      expect(result.data).toHaveProperty('sessionCount', 6);
      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should fail with insufficient data', async () => {
      const patternContext = {
        ...mockContext,
        eventType: 'learning_pattern_analysis',
        historicalData: {
          sessions: mockSessions.slice(0, 2), // Only 2 sessions
          analytics: [],
          interactions: [],
        },
      };

      const result = await analyticsAgent.execute(patternContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient historical data');
    });
  });

  describe('Progress Tracking', () => {
    it('should build progress tracking with AI recommendations', async () => {
      const progressContext = {
        ...mockContext,
        eventType: 'progress_tracking',
      };

      const result = await analyticsAgent.execute(progressContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userId', mockUser.id);
      expect(result.data).toHaveProperty('currentProgress');
      expect(result.data).toHaveProperty('aiRecommendations');
      expect(result.data).toHaveProperty('skillTracking');
      expect(result.data).toHaveProperty('milestones');
      expect(result.insights).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(Array.isArray(result.actions)).toBe(true);
    });

    it('should fail without user context', async () => {
      const progressContext = {
        ...mockContext,
        user: null,
        eventType: 'progress_tracking',
      };

      const result = await analyticsAgent.execute(progressContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('User context required');
    });
  });

  describe('Learning Alerts', () => {
    it('should create learning alerts and interventions', async () => {
      const alertContext = {
        ...mockContext,
        eventType: 'learning_alerts',
      };

      const result = await analyticsAgent.execute(alertContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userId', mockUser.id);
      expect(result.data).toHaveProperty('learningGaps');
      expect(result.data).toHaveProperty('improvements');
      expect(result.data).toHaveProperty('performanceAlerts');
      expect(result.data).toHaveProperty('interventions');
      expect(result.insights).toBeDefined();
      expect(result.actions).toBeDefined();
      expect(Array.isArray(result.actions)).toBe(true);
    });
  });

  describe('Weekly Report Generation', () => {
    it('should generate comprehensive weekly report', async () => {
      const reportContext = {
        ...mockContext,
        eventType: 'weekly_report',
      };

      const result = await analyticsAgent.execute(reportContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userId', mockUser.id);
      expect(result.data).toHaveProperty('reportPeriod');
      expect(result.data).toHaveProperty('performanceSummary');
      expect(result.data).toHaveProperty('achievements');
      expect(result.data).toHaveProperty('improvementAreas');
      expect(result.data).toHaveProperty('actionableInsights');
      expect(result.data).toHaveProperty('nextWeekRecommendations');
      expect(result.data.reportPeriod).toHaveProperty('start');
      expect(result.data.reportPeriod).toHaveProperty('end');
      expect(result.insights).toBeDefined();
      expect(result.actions).toBeDefined();
    });
  });

  describe('Session Analytics', () => {
    it('should analyze individual session data', async () => {
      const sessionContext = {
        ...mockContext,
        eventType: 'session_completed',
        eventData: mockSessions[0],
      };

      const result = await analyticsAgent.execute(sessionContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('sessionId');
      expect(result.data).toHaveProperty('effectiveness');
      expect(result.data).toHaveProperty('engagement');
      expect(result.data).toHaveProperty('learningOutcomes');
      expect(result.data).toHaveProperty('improvements');
      expect(result.data).toHaveProperty('overallScore');
      expect(result.insights).toBeDefined();
      expect(result.insights).toHaveLength(1);
    });

    it('should fail without session data', async () => {
      const sessionContext = {
        ...mockContext,
        eventType: 'session_completed',
        eventData: null,
        sessionData: [],
      };

      const result = await analyticsAgent.execute(sessionContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No session data available');
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze trends with sufficient data', async () => {
      const trendContext = {
        ...mockContext,
        eventType: 'trend_analysis', // Explicitly set event type
        sessionData: Array(6)
          .fill(null)
          .map((_, i) => ({
            ...mockSessions[0],
            id: `session-${i + 1}`,
            scheduledStart: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          })),
      };

      const result = await analyticsAgent.execute(trendContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('timeTrends');
      expect(result.data).toHaveProperty('subjectTrends');
      expect(result.data).toHaveProperty('engagementTrends');
      expect(result.data).toHaveProperty('anomalies');
      expect(result.data).toHaveProperty('trendStrength');
      expect(result.insights).toBeDefined();
    });

    it('should fail with insufficient data for trend analysis', async () => {
      // Create a context that will force trend analysis but with insufficient data
      const trendContext = {
        ...mockContext,
        sessionData: mockSessions.slice(0, 2), // Only 2 sessions
      };

      // Manually call the analyzeTrends method to test the insufficient data case
      const result = await (analyticsAgent as any).analyzeTrends(trendContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient data for trend analysis');
    });
  });

  describe('Progress Analytics', () => {
    it('should analyze progress data over time', async () => {
      const progressContext = {
        ...mockContext,
        eventType: 'progress_analytics',
      };

      const result = await analyticsAgent.execute(progressContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('userId', mockUser.id);
      expect(result.data).toHaveProperty('progression');
      expect(result.data).toHaveProperty('skillDevelopment');
      expect(result.data).toHaveProperty('progressMetrics');
      expect(result.data).toHaveProperty('predictions');
      expect(result.insights).toBeDefined();
    });
  });

  describe('Performance Insights', () => {
    it('should generate performance insights', async () => {
      const insightContext = {
        ...mockContext,
        eventType: 'performance_insights',
      };

      const result = await analyticsAgent.execute(insightContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('performanceTrends');
      expect(result.data).toHaveProperty('benchmarkComparison');
      expect(result.data).toHaveProperty('strengthsWeaknesses');
      expect(result.data).toHaveProperty('recommendations');
      expect(result.insights).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      const errorContext = {
        ...mockContext,
        eventType: 'learning_pattern_analysis',
        user: null, // This will cause an error
      };

      const result = await analyticsAgent.execute(errorContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Insufficient historical data for learning pattern analysis'
      );
    });

    it('should handle general analytics fallback', async () => {
      const generalContext = {
        ...mockContext,
        eventType: 'unknown_type',
        user: null, // Remove user to force general analytics
        sessionData: [], // Remove session data
        historicalData: { sessions: [], analytics: [], interactions: [] },
      };

      const result = await analyticsAgent.execute(generalContext);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('analyticsType', 'general');
      expect(result.data).toHaveProperty('status', 'completed');
    });
  });

  describe('Utility Methods', () => {
    it('should calculate average scores correctly', async () => {
      // Test through session analytics which uses calculateAverageScore
      const sessionContext = {
        ...mockContext,
        eventType: 'session_completed',
        eventData: mockSessions[0],
      };

      const result = await analyticsAgent.execute(sessionContext);
      expect(result.success).toBe(true);
      expect(typeof result.data.overallScore).toBe('number');
      expect(result.data.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.data.overallScore).toBeLessThanOrEqual(1);
    });

    it('should generate meaningful insights', async () => {
      const patternContext = {
        ...mockContext,
        eventType: 'learning_pattern_analysis',
        historicalData: {
          sessions: Array(6)
            .fill(null)
            .map((_, i) => ({
              ...mockSessions[0],
              id: `session-${i + 1}`,
              scheduledStart: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            })),
          analytics: [],
          interactions: [],
        },
      };

      const result = await analyticsAgent.execute(patternContext);
      expect(result.success).toBe(true);
      expect(result.insights).toBeDefined();

      if (result.insights && result.insights.length > 0) {
        const insight = result.insights[0];
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('content');
        expect(insight).toHaveProperty('confidence');
        expect(insight).toHaveProperty('createdAt');
        expect(typeof insight!.confidence).toBe('number');
        expect(insight!.confidence).toBeGreaterThanOrEqual(0);
        expect(insight!.confidence).toBeLessThanOrEqual(1);
      }
    });
  });
});
