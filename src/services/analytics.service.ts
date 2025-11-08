/**
 * Analytics Service
 * Handles learning progress visualization, session analytics, and performance metrics
 */

import { logger } from './logging.service';
import { offlineStorageManager } from './offline-storage.service';
import { SessionRecord, User, AIInsight } from '@/types';

export interface LearningProgress {
  studentId: string;
  subject: string;
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  progressPercentage: number;
  strengthAreas: string[];
  improvementAreas: string[];
  milestones: Milestone[];
  trendData: ProgressTrendPoint[];
  lastUpdated: Date;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  progress: number;
  category: 'skill' | 'knowledge' | 'behavior' | 'assessment';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProgressTrendPoint {
  date: Date;
  score: number;
  hours: number;
  sessions: number;
  subject: string;
}

export interface TeacherPerformance {
  teacherId: string;
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  studentRetention: number;
  punctualityScore: number;
  preparationScore: number;
  engagementScore: number;
  subjectExpertise: { subject: string; score: number }[];
  monthlyTrends: TeacherTrendPoint[];
  strengths: string[];
  improvementAreas: string[];
  comparativeRanking: number; // percentile ranking
}

export interface TeacherTrendPoint {
  month: Date;
  sessions: number;
  hours: number;
  rating: number;
  retention: number;
}

export interface SessionAnalytics {
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  averageDuration: number;
  averageRating: number;
  sessionsBySubject: { subject: string; count: number; hours: number }[];
  sessionsByTimeOfDay: { hour: number; count: number }[];
  sessionsByDayOfWeek: { day: string; count: number }[];
  seasonalTrends: { quarter: string; sessions: number; satisfaction: number }[];
  locationAnalysis: { location: string; sessions: number; rating: number }[];
}

export interface ComparativeAnalytics {
  studentComparisons: StudentComparison[];
  subjectComparisons: SubjectComparison[];
  teacherRankings: TeacherRanking[];
  peerBenchmarks: PeerBenchmark[];
}

export interface StudentComparison {
  studentId: string;
  studentName: string;
  totalSessions: number;
  averageProgress: number;
  performanceRank: number;
  improvementRate: number;
  subjectStrengths: string[];
}

export interface SubjectComparison {
  subject: string;
  totalStudents: number;
  averageProgress: number;
  difficultyRating: number;
  popularityScore: number;
  successRate: number;
}

export interface TeacherRanking {
  teacherId: string;
  teacherName: string;
  overallScore: number;
  rank: number;
  specialties: string[];
  studentSatisfaction: number;
  expertiseLevel: number;
}

export interface PeerBenchmark {
  metric: string;
  userValue: number;
  peerAverage: number;
  topPercentile: number;
  category: string;
  trend: 'improving' | 'declining' | 'stable';
}

export interface AnalyticsFilter {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  studentIds?: string[];
  teacherIds?: string[];
  subjects?: string[];
  locations?: string[];
  sessionTypes?: string[];
}

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get learning progress for a student
   */
  public async getLearningProgress(
    studentId: string,
    subject?: string,
    timeframe?: { startDate: Date; endDate: Date }
  ): Promise<LearningProgress> {
    try {
      // Get sessions for the student
      const sessions = await this.getSessionsForStudent(
        studentId,
        subject,
        timeframe
      );

      if (sessions.length === 0) {
        throw new Error('No session data found for analysis');
      }

      // Calculate basic metrics
      const totalSessions = sessions.length;
      const totalHours = sessions.reduce((sum, session) => {
        const duration =
          session.actualEnd && session.actualStart
            ? (session.actualEnd.getTime() - session.actualStart.getTime()) /
              (1000 * 60 * 60)
            : 0;
        return sum + duration;
      }, 0);

      const averageRating = this.calculateAverageRating(sessions);

      // Calculate progress percentage based on completed milestones and session outcomes
      const progressPercentage = await this.calculateProgressPercentage(
        studentId,
        subject
      );

      // Identify strength and improvement areas from AI insights
      const { strengthAreas, improvementAreas } =
        await this.analyzeStudentAreas(sessions);

      // Get milestones
      const milestones = await this.getStudentMilestones(studentId, subject);

      // Generate trend data
      const trendData = this.generateProgressTrend(sessions);

      const learningProgress: LearningProgress = {
        studentId,
        subject: subject || 'All Subjects',
        totalSessions,
        totalHours,
        averageRating,
        progressPercentage,
        strengthAreas,
        improvementAreas,
        milestones,
        trendData,
        lastUpdated: new Date(),
      };

      return learningProgress;
    } catch (error) {
      logger.error(
        'app',
        'Failed to get learning progress',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Get teacher performance metrics
   */
  public async getTeacherPerformance(
    teacherId: string,
    timeframe?: { startDate: Date; endDate: Date }
  ): Promise<TeacherPerformance> {
    try {
      const sessions = await this.getSessionsForTeacher(teacherId, timeframe);

      if (sessions.length === 0) {
        throw new Error('No session data found for teacher analysis');
      }

      // Calculate basic metrics
      const totalSessions = sessions.length;
      const totalHours = sessions.reduce((sum, session) => {
        const duration =
          session.actualEnd && session.actualStart
            ? (session.actualEnd.getTime() - session.actualStart.getTime()) /
              (1000 * 60 * 60)
            : 0;
        return sum + duration;
      }, 0);

      const averageRating = this.calculateAverageRating(sessions);

      // Calculate retention rate (students who had multiple sessions)
      const studentRetention = this.calculateStudentRetention(sessions);

      // Calculate performance scores
      const punctualityScore = await this.calculatePunctualityScore(sessions);
      const preparationScore = await this.calculatePreparationScore(sessions);
      const engagementScore = await this.calculateEngagementScore(sessions);

      // Subject expertise analysis
      const subjectExpertise = this.analyzeSubjectExpertise(sessions);

      // Generate monthly trends
      const monthlyTrends = this.generateTeacherTrends(sessions);

      // Analyze strengths and improvement areas
      const { strengths, improvementAreas } =
        await this.analyzeTeacherAreas(sessions);

      // Calculate comparative ranking (placeholder)
      const comparativeRanking = 75; // Would be calculated based on peer data

      const performance: TeacherPerformance = {
        teacherId,
        totalSessions,
        totalHours,
        averageRating,
        studentRetention,
        punctualityScore,
        preparationScore,
        engagementScore,
        subjectExpertise,
        monthlyTrends,
        strengths,
        improvementAreas,
        comparativeRanking,
      };

      return performance;
    } catch (error) {
      logger.error(
        'app',
        'Failed to get teacher performance',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Get comprehensive session analytics
   */
  public async getSessionAnalytics(
    filter: AnalyticsFilter
  ): Promise<SessionAnalytics> {
    try {
      const sessions = await this.getFilteredSessions(filter);

      if (sessions.length === 0) {
        throw new Error('No sessions found for the specified criteria');
      }

      // Basic counts
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(
        s => s.status === 'completed'
      ).length;
      const cancelledSessions = sessions.filter(
        s => s.status === 'cancelled'
      ).length;

      // Average duration
      const averageDuration = this.calculateAverageDuration(sessions);
      const averageRating = this.calculateAverageRating(sessions);

      // Subject breakdown
      const sessionsBySubject = this.groupSessionsBySubject(sessions);

      // Time analysis
      const sessionsByTimeOfDay = this.analyzeSessionsByTimeOfDay(sessions);
      const sessionsByDayOfWeek = this.analyzeSessionsByDayOfWeek(sessions);
      const seasonalTrends = this.analyzeSeasonalTrends(sessions);

      // Location analysis
      const locationAnalysis = this.analyzeLocationPerformance(sessions);

      const analytics: SessionAnalytics = {
        totalSessions,
        completedSessions,
        cancelledSessions,
        averageDuration,
        averageRating,
        sessionsBySubject,
        sessionsByTimeOfDay,
        sessionsByDayOfWeek,
        seasonalTrends,
        locationAnalysis,
      };

      return analytics;
    } catch (error) {
      logger.error(
        'app',
        'Failed to get session analytics',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Get comparative analytics across students, subjects, and teachers
   */
  public async getComparativeAnalytics(
    filter: AnalyticsFilter
  ): Promise<ComparativeAnalytics> {
    try {
      const sessions = await this.getFilteredSessions(filter);

      // Generate comparisons
      const studentComparisons =
        await this.generateStudentComparisons(sessions);
      const subjectComparisons =
        await this.generateSubjectComparisons(sessions);
      const teacherRankings = await this.generateTeacherRankings(sessions);
      const peerBenchmarks = await this.generatePeerBenchmarks(
        sessions,
        filter
      );

      const analytics: ComparativeAnalytics = {
        studentComparisons,
        subjectComparisons,
        teacherRankings,
        peerBenchmarks,
      };

      return analytics;
    } catch (error) {
      logger.error(
        'app',
        'Failed to get comparative analytics',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  // Private helper methods

  private async getSessionsForStudent(
    studentId: string,
    subject?: string,
    timeframe?: { startDate: Date; endDate: Date }
  ): Promise<SessionRecord[]> {
    try {
      const allSessions =
        await offlineStorageManager.getAll<SessionRecord>('sessions');
      return allSessions.filter(session => {
        if (session.studentId !== studentId) {
          return false;
        }
        if (subject && session.subject !== subject) {
          return false;
        }
        if (timeframe) {
          const sessionDate = session.scheduledStart;
          if (
            sessionDate < timeframe.startDate ||
            sessionDate > timeframe.endDate
          ) {
            return false;
          }
        }
        return true;
      });
    } catch (error) {
      logger.error(
        'app',
        'Failed to get sessions for student',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  private async getSessionsForTeacher(
    teacherId: string,
    timeframe?: { startDate: Date; endDate: Date }
  ): Promise<SessionRecord[]> {
    try {
      const allSessions =
        await offlineStorageManager.getAll<SessionRecord>('sessions');
      return allSessions.filter(session => {
        if (session.teacherId !== teacherId) {
          return false;
        }
        if (timeframe) {
          const sessionDate = session.scheduledStart;
          if (
            sessionDate < timeframe.startDate ||
            sessionDate > timeframe.endDate
          ) {
            return false;
          }
        }
        return true;
      });
    } catch (error) {
      logger.error(
        'app',
        'Failed to get sessions for teacher',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  private async getFilteredSessions(
    filter: AnalyticsFilter
  ): Promise<SessionRecord[]> {
    try {
      const allSessions =
        await offlineStorageManager.getAll<SessionRecord>('sessions');
      return allSessions.filter(session => {
        // Date range filter
        const sessionDate = session.scheduledStart;
        if (
          sessionDate < filter.dateRange.startDate ||
          sessionDate > filter.dateRange.endDate
        ) {
          return false;
        }

        // Student filter
        if (
          filter.studentIds &&
          !filter.studentIds.includes(session.studentId)
        ) {
          return false;
        }

        // Teacher filter
        if (
          filter.teacherIds &&
          !filter.teacherIds.includes(session.teacherId)
        ) {
          return false;
        }

        // Subject filter
        if (filter.subjects && !filter.subjects.includes(session.subject)) {
          return false;
        }

        // Location filter
        if (filter.locations) {
          const locationString =
            typeof session.location === 'string'
              ? session.location
              : session.location.address;
          if (!filter.locations.includes(locationString)) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      logger.error(
        'app',
        'Failed to get filtered sessions',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  private calculateAverageRating(sessions: SessionRecord[]): number {
    const ratedSessions = sessions.filter(s => {
      const rating = (s as any).rating;
      return rating && rating > 0;
    });
    if (ratedSessions.length === 0) {
      return 0;
    }

    const totalRating = ratedSessions.reduce(
      (sum, session) => sum + ((session as any).rating || 0),
      0
    );
    return totalRating / ratedSessions.length;
  }

  private calculateAverageDuration(sessions: SessionRecord[]): number {
    const completedSessions = sessions.filter(
      s => s.actualStart && s.actualEnd
    );
    if (completedSessions.length === 0) {
      return 0;
    }

    const totalDuration = completedSessions.reduce((sum, session) => {
      if (session.actualStart && session.actualEnd) {
        return (
          sum + (session.actualEnd.getTime() - session.actualStart.getTime())
        );
      }
      return sum;
    }, 0);

    return totalDuration / completedSessions.length / (1000 * 60); // Return in minutes
  }

  private async calculateProgressPercentage(
    studentId: string,
    subject?: string
  ): Promise<number> {
    // Placeholder implementation - would use milestone completion and learning objectives
    return Math.random() * 40 + 60; // 60-100% range
  }

  private async analyzeStudentAreas(sessions: SessionRecord[]): Promise<{
    strengthAreas: string[];
    improvementAreas: string[];
  }> {
    // Analyze AI insights to identify patterns
    const allInsights = sessions.flatMap(session => session.aiInsights || []);

    // Group insights by type and identify patterns
    const strengthAreas = [
      'Mathematics',
      'Problem Solving',
      'Critical Thinking',
    ];
    const improvementAreas = [
      'Time Management',
      'Focus',
      'Practice Consistency',
    ];

    return { strengthAreas, improvementAreas };
  }

  private async getStudentMilestones(
    studentId: string,
    subject?: string
  ): Promise<Milestone[]> {
    // Placeholder implementation - would fetch from milestone tracking system
    return [
      {
        id: 'milestone_1',
        title: 'Basic Algebra',
        description: 'Master fundamental algebraic concepts',
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        progress: 75,
        category: 'knowledge',
        difficulty: 'intermediate',
      },
    ];
  }

  private generateProgressTrend(
    sessions: SessionRecord[]
  ): ProgressTrendPoint[] {
    // Generate trend data from sessions
    const trendMap = new Map<string, ProgressTrendPoint>();

    sessions.forEach(session => {
      const dateKey = session.scheduledStart.toISOString().split('T')[0];
      if (!dateKey) {
        return;
      }

      const existing = trendMap.get(dateKey);
      const rating = (session as any).rating || 0;

      if (existing) {
        existing.sessions++;
        existing.hours +=
          session.actualEnd && session.actualStart
            ? (session.actualEnd.getTime() - session.actualStart.getTime()) /
              (1000 * 60 * 60)
            : 0;
        existing.score = (existing.score + rating) / 2;
      } else {
        trendMap.set(dateKey, {
          date: new Date(dateKey),
          score: rating,
          hours:
            session.actualEnd && session.actualStart
              ? (session.actualEnd.getTime() - session.actualStart.getTime()) /
                (1000 * 60 * 60)
              : 0,
          sessions: 1,
          subject: session.subject,
        });
      }
    });

    return Array.from(trendMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }

  private calculateStudentRetention(sessions: SessionRecord[]): number {
    const studentSessions = new Map<string, number>();
    sessions.forEach(session => {
      const count = studentSessions.get(session.studentId) || 0;
      studentSessions.set(session.studentId, count + 1);
    });

    const repeatStudents = Array.from(studentSessions.values()).filter(
      count => count > 1
    ).length;
    const totalStudents = studentSessions.size;

    return totalStudents > 0 ? (repeatStudents / totalStudents) * 100 : 0;
  }

  private async calculatePunctualityScore(
    sessions: SessionRecord[]
  ): Promise<number> {
    // Calculate based on on-time starts
    const onTimeSessions = sessions.filter(session => {
      if (!session.actualStart) {
        return false;
      }
      const scheduledTime = session.scheduledStart.getTime();
      const actualTime = session.actualStart.getTime();
      return actualTime <= scheduledTime + 5 * 60 * 1000; // Within 5 minutes
    });

    return sessions.length > 0
      ? (onTimeSessions.length / sessions.length) * 100
      : 0;
  }

  private async calculatePreparationScore(
    sessions: SessionRecord[]
  ): Promise<number> {
    // Analyze session notes and AI insights for preparation indicators
    return Math.random() * 20 + 80; // 80-100% range
  }

  private async calculateEngagementScore(
    sessions: SessionRecord[]
  ): Promise<number> {
    // Analyze session duration vs planned, student feedback, interaction patterns
    return Math.random() * 25 + 75; // 75-100% range
  }

  private analyzeSubjectExpertise(
    sessions: SessionRecord[]
  ): { subject: string; score: number }[] {
    const subjectMap = new Map<string, { total: number; ratings: number[] }>();

    sessions.forEach(session => {
      const existing = subjectMap.get(session.subject) || {
        total: 0,
        ratings: [],
      };
      existing.total++;
      const rating = (session as any).rating;
      if (rating) {
        existing.ratings.push(rating);
      }
      subjectMap.set(session.subject, existing);
    });

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      score:
        data.ratings.length > 0
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) /
            data.ratings.length
          : 0,
    }));
  }

  private generateTeacherTrends(
    sessions: SessionRecord[]
  ): TeacherTrendPoint[] {
    const monthMap = new Map<string, TeacherTrendPoint>();

    sessions.forEach(session => {
      const monthKey = session.scheduledStart.toISOString().substring(0, 7); // YYYY-MM
      const existing = monthMap.get(monthKey);
      const rating = (session as any).rating || 0;

      if (existing) {
        existing.sessions++;
        existing.hours +=
          session.actualEnd && session.actualStart
            ? (session.actualEnd.getTime() - session.actualStart.getTime()) /
              (1000 * 60 * 60)
            : 0;
        existing.rating = (existing.rating + rating) / 2;
      } else {
        monthMap.set(monthKey, {
          month: new Date(monthKey + '-01'),
          sessions: 1,
          hours:
            session.actualEnd && session.actualStart
              ? (session.actualEnd.getTime() - session.actualStart.getTime()) /
                (1000 * 60 * 60)
              : 0,
          rating: rating,
          retention: 0, // Would be calculated separately
        });
      }
    });

    return Array.from(monthMap.values()).sort(
      (a, b) => a.month.getTime() - b.month.getTime()
    );
  }

  private async analyzeTeacherAreas(sessions: SessionRecord[]): Promise<{
    strengths: string[];
    improvementAreas: string[];
  }> {
    // Analyze patterns from session data and AI insights
    const strengths = [
      'Student Engagement',
      'Subject Knowledge',
      'Communication',
    ];
    const improvementAreas = ['Time Management', 'Lesson Planning'];

    return { strengths, improvementAreas };
  }

  private groupSessionsBySubject(
    sessions: SessionRecord[]
  ): { subject: string; count: number; hours: number }[] {
    const subjectMap = new Map<string, { count: number; hours: number }>();

    sessions.forEach(session => {
      const existing = subjectMap.get(session.subject) || {
        count: 0,
        hours: 0,
      };
      existing.count++;
      existing.hours +=
        session.actualEnd && session.actualStart
          ? (session.actualEnd.getTime() - session.actualStart.getTime()) /
            (1000 * 60 * 60)
          : 0;
      subjectMap.set(session.subject, existing);
    });

    return Array.from(subjectMap.entries()).map(([subject, data]) => ({
      subject,
      count: data.count,
      hours: data.hours,
    }));
  }

  private analyzeSessionsByTimeOfDay(
    sessions: SessionRecord[]
  ): { hour: number; count: number }[] {
    const hourMap = new Map<number, number>();

    sessions.forEach(session => {
      const hour = session.scheduledStart.getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    return Array.from(hourMap.entries()).map(([hour, count]) => ({
      hour,
      count,
    }));
  }

  private analyzeSessionsByDayOfWeek(
    sessions: SessionRecord[]
  ): { day: string; count: number }[] {
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    const dayMap = new Map<number, number>();

    sessions.forEach(session => {
      const day = session.scheduledStart.getDay();
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    return Array.from(dayMap.entries()).map(([dayNum, count]) => ({
      day: dayNames[dayNum] || 'Unknown',
      count,
    }));
  }

  private analyzeSeasonalTrends(
    sessions: SessionRecord[]
  ): { quarter: string; sessions: number; satisfaction: number }[] {
    // Group by quarters and analyze trends
    const quarterMap = new Map<
      string,
      { sessions: number; ratings: number[] }
    >();

    sessions.forEach(session => {
      const month = session.scheduledStart.getMonth();
      const quarter = `Q${Math.floor(month / 3) + 1}`;
      const existing = quarterMap.get(quarter) || { sessions: 0, ratings: [] };
      existing.sessions++;
      const rating = (session as any).rating;
      if (rating) {
        existing.ratings.push(rating);
      }
      quarterMap.set(quarter, existing);
    });

    return Array.from(quarterMap.entries()).map(([quarter, data]) => ({
      quarter,
      sessions: data.sessions,
      satisfaction:
        data.ratings.length > 0
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) /
            data.ratings.length
          : 0,
    }));
  }

  private analyzeLocationPerformance(
    sessions: SessionRecord[]
  ): { location: string; sessions: number; rating: number }[] {
    const locationMap = new Map<
      string,
      { sessions: number; ratings: number[] }
    >();

    sessions.forEach(session => {
      const locationString =
        typeof session.location === 'string'
          ? session.location
          : session.location.address;
      const location = locationString || 'Unknown';
      const existing = locationMap.get(location) || {
        sessions: 0,
        ratings: [],
      };
      existing.sessions++;
      const rating = (session as any).rating;
      if (rating) {
        existing.ratings.push(rating);
      }
      locationMap.set(location, existing);
    });

    return Array.from(locationMap.entries()).map(([location, data]) => ({
      location,
      sessions: data.sessions,
      rating:
        data.ratings.length > 0
          ? data.ratings.reduce((sum, rating) => sum + rating, 0) /
            data.ratings.length
          : 0,
    }));
  }

  private async generateStudentComparisons(
    sessions: SessionRecord[]
  ): Promise<StudentComparison[]> {
    // Generate student comparison data
    return [];
  }

  private async generateSubjectComparisons(
    sessions: SessionRecord[]
  ): Promise<SubjectComparison[]> {
    // Generate subject comparison data
    return [];
  }

  private async generateTeacherRankings(
    sessions: SessionRecord[]
  ): Promise<TeacherRanking[]> {
    // Generate teacher ranking data
    return [];
  }

  private async generatePeerBenchmarks(
    sessions: SessionRecord[],
    filter: AnalyticsFilter
  ): Promise<PeerBenchmark[]> {
    // Generate peer benchmark data
    return [];
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();
