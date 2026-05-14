import { TaskAutomationAgent } from '../task-automation.agent';
import { AgentContext, Session, User, HistoricalData } from '@/types';

describe('TaskAutomationAgent', () => {
  let agent: TaskAutomationAgent;
  let mockUser: User;
  let mockSession: Session;
  let mockHistoricalData: HistoricalData;
  let baseContext: AgentContext;

  beforeEach(() => {
    agent = new TaskAutomationAgent();
    console.log('Agent capabilities:', agent.capabilities);
    console.log('Agent has hasCapability method:', typeof agent.hasCapability);

    mockUser = {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'parent',
      preferences: {
        notifications: {
          email: true,
          push: true,
          sms: false,
          inApp: true,
          frequency: 'immediate',
        },
        dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
        privacy: { dataSharing: false, analytics: true, aiTraining: true },
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

    mockSession = {
      id: 'session1',
      studentId: 'student1',
      teacherId: 'teacher1',
      parentId: 'parent1',
      subject: 'Math',
      scheduledStart: new Date('2024-01-15T10:00:00Z'),
      scheduledEnd: new Date('2024-01-15T12:00:00Z'),
      actualStart: new Date('2024-01-15T10:05:00Z'),
      actualEnd: new Date('2024-01-15T11:55:00Z'),
      location: {
        address: '123 Test St',
        coordinates: { latitude: 40.7128, longitude: -74.006 },
        verified: true,
      },
      status: 'completed',
      notes: 'Great session',
      aiInsights: [],
      attachments: [],
    };

    mockHistoricalData = {
      sessions: [mockSession],
      analytics: [
        {
          studentId: 'student1',
          subject: 'Math',
          progressMetrics: [
            {
              metric: 'comprehension',
              value: 0.8,
              trend: 'improving',
              period: 'weekly',
            },
            {
              metric: 'problem_solving',
              value: 0.7,
              trend: 'stable',
              period: 'weekly',
            },
          ],
          learningPatterns: [],
          recommendations: [],
          lastUpdated: new Date(),
        },
      ],
      interactions: [],
    };

    baseContext = {
      user: mockUser,
      sessionData: [mockSession],
      preferences: mockUser.preferences,
      historicalData: mockHistoricalData,
      timestamp: Date.now(),
    };
  });

  describe('Basic Properties', () => {
    it('should have correct agent properties', () => {
      expect(agent.id).toBe('task-automation');
      expect(agent.name).toBe('Task Automation Agent');
      expect(agent.capabilities).toContain('timesheet-automation');
      expect(agent.capabilities).toContain('session-management');
      expect(agent.capabilities).toContain('notification-triggering');
      expect(agent.capabilities).toContain('conflict-detection');
      expect(agent.priority).toBe(7);
    });

    it('should have session-dependent capability', () => {
      expect(agent.hasCapability('session-dependent')).toBe(true);
    });
  });

  describe('Task Type Determination', () => {
    it('should determine session_started task type', () => {
      const context = { ...baseContext, eventType: 'session_started' };
      const taskType = (agent as any).determineTaskType(context);
      expect(taskType).toBe('session_started');
    });

    it('should determine session_completed task type', () => {
      const context = { ...baseContext, eventType: 'session_completed' };
      const taskType = (agent as any).determineTaskType(context);
      expect(taskType).toBe('session_completed');
    });

    it('should determine conflict_detection for critical urgency', () => {
      const context = { ...baseContext, urgencyLevel: 'critical' as const };
      const taskType = (agent as any).determineTaskType(context);
      expect(taskType).toBe('conflict_detection');
    });

    it('should determine timesheet_automation for batch mode', () => {
      const context = {
        ...baseContext,
        batchMode: true,
        batchData: [mockSession],
      };
      const taskType = (agent as any).determineTaskType(context);
      expect(taskType).toBe('timesheet_automation');
    });

    it('should determine scheduling_optimization for session data', () => {
      const context = { ...baseContext };
      const taskType = (agent as any).determineTaskType(context);
      expect(taskType).toBe('scheduling_optimization');
    });
  });

  describe('Session Start Automation', () => {
    it('should handle session start successfully', async () => {
      const context = {
        ...baseContext,
        eventType: 'session_started',
        eventData: {
          sessionId: 'session1',
          teacherId: 'teacher1',
          studentId: 'student1',
          parentId: 'parent1',
          subject: 'Math',
          location: mockSession.location,
        },
      };

      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.sessionId).toBe('session1');
      expect(result.data.automatedTasks).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.insights!.length).toBeGreaterThan(0);

      // Check that timesheet creation was attempted
      const timesheetTask = result.data.automatedTasks.find(
        (t: any) => t.task === 'timesheet_creation'
      );
      expect(timesheetTask).toBeDefined();
      expect(timesheetTask.status).toBe('completed');
    });

    it('should handle session start with missing session data', async () => {
      const context = {
        ...baseContext,
        eventType: 'session_started',
        eventData: null,
      };

      const result = await agent.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Session data is required');
    });

    it('should create proper timesheet entry', async () => {
      const sessionData = {
        sessionId: 'session1',
        teacherId: 'teacher1',
        studentId: 'student1',
        location: mockSession.location,
      };

      const timesheetEntry = await (agent as any).createTimesheetEntry(
        sessionData
      );

      expect(timesheetEntry.id).toBeDefined();
      expect(timesheetEntry.sessionId).toBe('session1');
      expect(timesheetEntry.teacherId).toBe('teacher1');
      expect(timesheetEntry.status).toBe('active');
      expect(timesheetEntry.autoGenerated).toBe(true);
      expect(timesheetEntry.locationVerified).toBe(true);
      expect(timesheetEntry.rate).toBe(50);
    });

    it('should send appropriate notifications', async () => {
      const sessionData = {
        sessionId: 'session1',
        parentId: 'parent1',
        teacherId: 'teacher1',
        studentId: 'student1',
        subject: 'Math',
      };

      const notifications = await (agent as any).sendSessionStartNotifications(
        sessionData,
        mockUser
      );

      expect(notifications.length).toBeGreaterThan(0);

      const parentNotification = notifications.find(
        (n: any) => n.recipient === 'parent1'
      );
      expect(parentNotification).toBeDefined();
      expect(parentNotification.type).toBe('session_started');
      expect(parentNotification.channel).toBe('push');

      const teacherNotification = notifications.find(
        (n: any) => n.recipient === 'teacher1'
      );
      expect(teacherNotification).toBeDefined();
      expect(teacherNotification.type).toBe('session_confirmation');
    });
  });

  describe('Session Completion Automation', () => {
    it('should handle session completion successfully', async () => {
      const context = {
        ...baseContext,
        eventType: 'session_completed',
        eventData: {
          sessionId: 'session1',
          teacherId: 'teacher1',
          studentId: 'student1',
          parentId: 'parent1',
          subject: 'Math',
          actualStart: mockSession.actualStart,
          actualEnd: mockSession.actualEnd,
          duration: 110, // minutes
        },
      };

      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.sessionId).toBe('session1');
      expect(result.data.automatedTasks).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.insights!.length).toBeGreaterThan(0);

      // Check that all completion tasks were attempted
      const taskTypes = result.data.automatedTasks.map((t: any) => t.task);
      expect(taskTypes).toContain('timesheet_finalization');
      expect(taskTypes).toContain('session_summary');
      expect(taskTypes).toContain('completion_notifications');
      expect(taskTypes).toContain('progress_update');
      expect(taskTypes).toContain('follow_up_scheduling');
    });

    it('should finalize timesheet correctly', async () => {
      const sessionData = {
        sessionId: 'session1',
        actualStart: mockSession.actualStart!.getTime(),
        actualEnd: mockSession.actualEnd!.getTime(),
      };

      const finalization = await (agent as any).finalizeTimesheetEntry(
        sessionData
      );

      expect(finalization.sessionId).toBe('session1');
      expect(finalization.hours).toBeCloseTo(1.83, 1); // ~110 minutes
      expect(finalization.amount).toBeCloseTo(91.67, 1); // ~1.83 * 50
      expect(finalization.status).toBe('completed');
      expect(finalization.autoCalculated).toBe(true);
    });

    it('should generate AI-powered session summary', async () => {
      const sessionData = {
        sessionId: 'session1',
        studentId: 'student1',
        subject: 'Math',
      };

      const summary = await (agent as any).generateSessionSummary(
        sessionData,
        mockHistoricalData
      );

      expect(summary.sessionId).toBe('session1');
      expect(summary.summary).toBeDefined();
      expect(summary.keyPoints).toBeDefined();
      expect(summary.recommendations).toBeDefined();
      expect(summary.aiGenerated).toBe(true);
      expect(summary.confidence).toBeGreaterThan(0.8);
      expect(summary.analysisDepth).toBe('comprehensive');
    });

    it('should update progress tracking with historical context', async () => {
      const sessionData = {
        sessionId: 'session1',
        studentId: 'student1',
        subject: 'Math',
        duration: 2,
      };

      const progressUpdate = await (agent as any).updateProgressTracking(
        sessionData,
        mockHistoricalData
      );

      expect(progressUpdate.studentId).toBe('student1');
      expect(progressUpdate.subject).toBe('Math');
      expect(progressUpdate.progressIncrement).toBeGreaterThan(0);
      expect(progressUpdate.skillsImproved).toContain('problem_solving');
      expect(progressUpdate.skillsImproved).toContain('numerical_reasoning');
      expect(progressUpdate.learningVelocity).toBeDefined();
      expect(progressUpdate.metadata.historicalDataUsed).toBe(true);
    });

    it('should schedule intelligent follow-up actions', async () => {
      const sessionData = {
        sessionId: 'session1',
        studentId: 'student1',
        parentId: 'parent1',
        teacherId: 'teacher1',
        subject: 'Math',
      };

      const followUpActions = await (agent as any).scheduleFollowUpActions(
        sessionData,
        mockHistoricalData
      );

      expect(followUpActions.length).toBeGreaterThan(0);

      const homeworkReminder = followUpActions.find(
        (a: any) => a.action === 'homework_reminder'
      );
      expect(homeworkReminder).toBeDefined();
      expect(homeworkReminder.recipient).toBe('student1');
      expect(homeworkReminder.automated).toBe(true);

      const progressReview = followUpActions.find(
        (a: any) => a.action === 'progress_review'
      );
      expect(progressReview).toBeDefined();
      expect(progressReview.recipient).toBe('parent1');
    });
  });

  describe('Conflict Detection and Resolution', () => {
    it('should detect time conflicts between sessions', async () => {
      const overlappingSession: Session = {
        ...mockSession,
        id: 'session2',
        scheduledStart: new Date('2024-01-15T11:00:00Z'),
        scheduledEnd: new Date('2024-01-15T13:00:00Z'),
      };

      const sessions = [mockSession, overlappingSession];
      const conflicts = await (agent as any).detectTimeConflicts(sessions);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('time_overlap');
      expect(conflicts[0].severity).toBe('high');
      expect(conflicts[0].sessions).toContain('session1');
      expect(conflicts[0].sessions).toContain('session2');
    });

    it('should detect resource conflicts (teacher overbooking)', async () => {
      const conflictingSession: Session = {
        ...mockSession,
        id: 'session2',
        status: 'in-progress',
        teacherId: 'teacher1', // Same teacher
      };

      const sessions = [mockSession, conflictingSession];
      const conflicts = await (agent as any).detectResourceConflicts(sessions);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('teacher_overbooked');
      expect(conflicts[0].severity).toBe('high');
      expect(conflicts[0].resource).toBe('teacher');
      expect(conflicts[0].resourceId).toBe('teacher1');
    });

    it('should detect location conflicts', async () => {
      const locationConflictSession: Session = {
        ...mockSession,
        id: 'session2',
        scheduledStart: new Date('2024-01-15T11:30:00Z'),
        scheduledEnd: new Date('2024-01-15T13:30:00Z'),
        ...(mockSession.location ? { location: mockSession.location } : {}), // Same location
      };

      const sessions = [mockSession, locationConflictSession];
      const conflicts = await (agent as any).detectLocationConflicts(sessions);

      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('location_overlap');
      expect(conflicts[0].severity).toBe('medium');
      expect(conflicts[0].location).toBe('123 Test St');
    });

    it('should generate conflict resolutions', async () => {
      const conflicts = [
        {
          id: 'conflict1',
          type: 'time_overlap',
          severity: 'high',
        },
        {
          id: 'conflict2',
          type: 'teacher_overbooked',
          severity: 'high',
        },
      ];

      const resolutions = await (agent as any).generateConflictResolutions(
        conflicts,
        [mockSession]
      );

      expect(resolutions.length).toBe(2);

      const timeResolution = resolutions.find(
        (r: any) => r.type === 'reschedule'
      );
      expect(timeResolution).toBeDefined();
      expect(timeResolution.priority).toBe(8);
      expect(timeResolution.suggestedActions).toContain(
        'Move session to next available slot'
      );

      const resourceResolution = resolutions.find(
        (r: any) => r.type === 'resource_reallocation'
      );
      expect(resourceResolution).toBeDefined();
      expect(resourceResolution.priority).toBe(9);
      expect(resourceResolution.suggestedActions).toContain(
        'Find substitute teacher'
      );
    });

    it('should handle conflict detection execution', async () => {
      const context = {
        ...baseContext,
        eventType: 'conflict_detected',
        sessionData: [
          mockSession,
          {
            ...mockSession,
            id: 'session2',
            scheduledStart: new Date('2024-01-15T11:00:00Z'),
            scheduledEnd: new Date('2024-01-15T13:00:00Z'),
          },
        ],
      };

      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.conflicts).toBeDefined();
      expect(result.data.resolutionSuggestions).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.actions).toBeDefined();
    });
  });

  describe('Timesheet Automation', () => {
    it('should automate timesheet processing', async () => {
      const context = {
        ...baseContext,
        batchMode: true,
        batchData: [mockSession],
      };

      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.timesheetEntries).toBeDefined();
      expect(result.data.billingInfo).toBeDefined();
      expect(result.data.discrepancies).toBeDefined();
      expect(result.data.totalHours).toBeGreaterThan(0);
      expect(result.data.totalAmount).toBeGreaterThan(0);
    });

    it('should detect timesheet discrepancies', async () => {
      const longSession = {
        sessionId: 'long-session',
        hours: 5, // Exceeds max duration
        startTime: new Date(),
        endTime: new Date(),
      };

      const shortSession = {
        sessionId: 'short-session',
        hours: 0.25, // Below min duration
        startTime: new Date(),
        endTime: new Date(),
      };

      const discrepancies = await (agent as any).detectTimesheetDiscrepancies([
        longSession,
        shortSession,
      ]);

      expect(discrepancies.length).toBe(2);

      const longDiscrepancy = discrepancies.find(
        (d: any) => d.type === 'long_session'
      );
      expect(longDiscrepancy).toBeDefined();
      expect(longDiscrepancy.severity).toBe('medium');

      const shortDiscrepancy = discrepancies.find(
        (d: any) => d.type === 'short_session'
      );
      expect(shortDiscrepancy).toBeDefined();
      expect(shortDiscrepancy.severity).toBe('low');
    });
  });

  describe('Scheduling Optimization', () => {
    it('should optimize scheduling with analysis', async () => {
      const context = {
        ...baseContext,
        sessionData: [mockSession],
      };

      const result = await agent.execute(context);

      expect(result.success).toBe(true);
      expect(result.data.schedulingAnalysis).toBeDefined();
      expect(result.data.conflicts).toBeDefined();
      expect(result.data.optimizations).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should analyze scheduling patterns', async () => {
      const sessions = [mockSession];
      const analysis = await (agent as any).analyzeSchedulingPatterns(sessions);

      expect(analysis.peakHours).toBeDefined();
      expect(analysis.averageSessionLength).toBeDefined();
      expect(analysis.preferredDays).toBeDefined();
      expect(analysis.utilizationRate).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      // Mock a method to throw an error
      const originalMethod = (agent as any).determineTaskType;
      (agent as any).determineTaskType = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await agent.execute(baseContext);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Task automation failed');

      // Restore original method
      (agent as any).determineTaskType = originalMethod;
    });

    it('should handle missing session data for session-dependent operations', async () => {
      const context = {
        ...baseContext,
        sessionData: [],
        eventType: 'scheduling_optimization',
      };

      const result = await agent.execute(context);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No session data available');
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const healthContext = { ...baseContext, healthCheck: true };
      const result = await agent.executeWithTracking(healthContext);

      expect(result.success).toBe(true);
      expect(result.data.agentId).toBe('task-automation');
      expect(result.data.status).toBe('healthy');
      expect(result.data.capabilities).toEqual(agent.capabilities);
    });
  });

  describe('Utility Methods', () => {
    it('should calculate overlap duration correctly', () => {
      const session1 = {
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T12:00:00Z'),
      };

      const session2 = {
        scheduledStart: new Date('2024-01-15T11:00:00Z'),
        scheduledEnd: new Date('2024-01-15T13:00:00Z'),
      };

      const overlapDuration = (agent as any).calculateOverlapDuration(
        session1,
        session2
      );

      // 1 hour overlap (11:00-12:00)
      expect(overlapDuration).toBe(60 * 60 * 1000); // 1 hour in milliseconds
    });

    it('should detect session overlap correctly', () => {
      const session1 = {
        scheduledStart: new Date('2024-01-15T10:00:00Z'),
        scheduledEnd: new Date('2024-01-15T12:00:00Z'),
      };

      const session2 = {
        scheduledStart: new Date('2024-01-15T11:00:00Z'),
        scheduledEnd: new Date('2024-01-15T13:00:00Z'),
      };

      const session3 = {
        scheduledStart: new Date('2024-01-15T13:00:00Z'),
        scheduledEnd: new Date('2024-01-15T15:00:00Z'),
      };

      expect((agent as any).sessionsOverlap(session1, session2)).toBe(true);
      expect((agent as any).sessionsOverlap(session1, session3)).toBe(false);
    });
  });
});
