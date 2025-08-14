import { supabase, supabaseAdmin, Database } from '@/lib/supabase';
import { User, Session, AIInsight, LearningAnalytics } from '@/types';

type Tables = Database['public']['Tables'];

export class DatabaseService {
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // User Management
  async createUser(userData: Omit<Tables['users']['Insert'], 'id'>): Promise<User | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async updateUser(id: string, updates: Tables['users']['Update']): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseUserToUser(data);
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  // Session Management
  async createSession(sessionData: Omit<Tables['sessions']['Insert'], 'id'>): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseSessionToSession(data);
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  async getSessionById(id: string): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseSessionToSession(data);
    } catch (error) {
      console.error('Error fetching session:', error);
      return null;
    }
  }

  async getSessionsByUserId(userId: string, role: 'teacher' | 'parent'): Promise<Session[]> {
    try {
      const column = role === 'teacher' ? 'teacher_id' : 'parent_id';
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq(column, userId)
        .order('scheduled_start', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(this.mapDatabaseSessionToSession);
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }
  }

  async updateSession(id: string, updates: Tables['sessions']['Update']): Promise<Session | null> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseSessionToSession(data);
    } catch (error) {
      console.error('Error updating session:', error);
      return null;
    }
  }

  // Authentication Session Management
  async createAuthSession(authData: Omit<Tables['auth_sessions']['Insert'], 'id'>): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('auth_sessions')
        .insert(authData)
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    } catch (error) {
      console.error('Error creating auth session:', error);
      return null;
    }
  }

  async getAuthSession(sessionId: string): Promise<Tables['auth_sessions']['Row'] | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('auth_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching auth session:', error);
      return null;
    }
  }

  async updateAuthSession(
    sessionId: string, 
    updates: Tables['auth_sessions']['Update']
  ): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('auth_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('session_id', sessionId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating auth session:', error);
      return false;
    }
  }

  async cleanupExpiredAuthSessions(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin
        .from('auth_sessions')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      return data.length;
    } catch (error) {
      console.error('Error cleaning up expired auth sessions:', error);
      return 0;
    }
  }

  // AI Insights Management
  async createAIInsight(insightData: Omit<Tables['ai_insights']['Insert'], 'id'>): Promise<AIInsight | null> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .insert(insightData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseInsightToInsight(data);
    } catch (error) {
      console.error('Error creating AI insight:', error);
      return null;
    }
  }

  async getAIInsightsBySessionId(sessionId: string): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(this.mapDatabaseInsightToInsight);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      return [];
    }
  }

  async getAIInsightsByUserId(userId: string): Promise<AIInsight[]> {
    try {
      const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return data.map(this.mapDatabaseInsightToInsight);
    } catch (error) {
      console.error('Error fetching user AI insights:', error);
      return [];
    }
  }

  // Learning Analytics Management
  async createOrUpdateLearningAnalytics(
    analyticsData: Omit<Tables['learning_analytics']['Insert'], 'id'>
  ): Promise<LearningAnalytics | null> {
    try {
      const { data, error } = await supabase
        .from('learning_analytics')
        .upsert(analyticsData, { 
          onConflict: 'student_id,subject',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapDatabaseAnalyticsToAnalytics(data);
    } catch (error) {
      console.error('Error creating/updating learning analytics:', error);
      return null;
    }
  }

  async getLearningAnalyticsByStudentId(studentId: string): Promise<LearningAnalytics[]> {
    try {
      const { data, error } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('student_id', studentId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data.map(this.mapDatabaseAnalyticsToAnalytics);
    } catch (error) {
      console.error('Error fetching learning analytics:', error);
      return [];
    }
  }

  // Database Health Check
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const latency = Date.now() - startTime;

      return {
        healthy: !error,
        latency,
      };
    } catch (error) {
      return {
        healthy: false,
        latency: Date.now() - startTime,
      };
    }
  }

  // Mapping functions
  private mapDatabaseUserToUser(dbUser: Tables['users']['Row']): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      preferences: dbUser.preferences || {
        notifications: { email: true, push: true, sms: false, inApp: true, frequency: 'immediate' },
        dashboard: { layout: 'detailed', theme: 'light', widgets: [] },
        privacy: { dataSharing: false, analytics: true, aiTraining: true },
        accessibility: { fontSize: 'medium', highContrast: false, reducedMotion: false, screenReader: false }
      },
      createdAt: new Date(dbUser.created_at),
      lastActive: new Date(dbUser.last_active),
    };
  }

  private mapDatabaseSessionToSession(dbSession: Tables['sessions']['Row']): Session {
    return {
      id: dbSession.id,
      studentId: dbSession.student_id,
      teacherId: dbSession.teacher_id,
      parentId: dbSession.parent_id,
      subject: dbSession.subject,
      scheduledStart: new Date(dbSession.scheduled_start),
      scheduledEnd: new Date(dbSession.scheduled_end),
      actualStart: dbSession.actual_start ? new Date(dbSession.actual_start) : undefined,
      actualEnd: dbSession.actual_end ? new Date(dbSession.actual_end) : undefined,
      location: dbSession.location,
      status: dbSession.status,
      notes: dbSession.notes || undefined,
      aiInsights: [], // Would be populated separately
      attachments: [], // Would be populated separately
    };
  }

  private mapDatabaseInsightToInsight(dbInsight: Tables['ai_insights']['Row']): AIInsight {
    return {
      id: dbInsight.id,
      sessionId: dbInsight.session_id || '',
      type: dbInsight.type,
      content: dbInsight.content,
      confidence: dbInsight.confidence,
      metadata: dbInsight.metadata || {},
      createdAt: new Date(dbInsight.created_at),
    };
  }

  private mapDatabaseAnalyticsToAnalytics(dbAnalytics: Tables['learning_analytics']['Row']): LearningAnalytics {
    return {
      studentId: dbAnalytics.student_id,
      subject: dbAnalytics.subject,
      progressMetrics: dbAnalytics.progress_metrics || [],
      learningPatterns: dbAnalytics.learning_patterns || [],
      recommendations: dbAnalytics.recommendations || [],
      lastUpdated: new Date(dbAnalytics.updated_at),
    };
  }
}