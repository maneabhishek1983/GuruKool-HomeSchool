// Data Sheets service for managing student activities and progress

import {
  DataSheet,
  DataSheetActivity,
  ActivityType,
  ActivityStatus,
  ProgressSummary,
  Challenge,
  Prompt,
  ProgressTracking,
  ACTIVITY_TYPES,
} from '@/types/syllabus.types';
import { supabase } from '@/lib/supabase';

export class DataSheetsService {
  /**
   * Create a new data sheet for a student
   */
  static async createDataSheet(
    data: Omit<DataSheet, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataSheet | null> {
    try {
      const { data: result, error } = await supabase
        .from('data_sheets')
        .insert([
          {
            student_id: data.studentId,
            teacher_id: data.teacherId,
            parent_id: data.parentId,
            date: data.date,
            title: data.title,
            description: data.description,
            activities: data.activities,
            progress_summary: data.progressSummary,
            challenges: data.challenges,
            prompts: data.prompts,
            notes: data.notes,
            is_template: data.isTemplate,
            template_name: data.templateName,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating data sheet:', error);
        return null;
      }

      return this.formatDataSheetData(result);
    } catch (error) {
      console.error('Error in createDataSheet:', error);
      return null;
    }
  }

  /**
   * Get data sheets for a student
   */
  static async getDataSheetsByStudent(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DataSheet[]> {
    try {
      let query = supabase
        .from('data_sheets')
        .select('*')
        .eq('student_id', studentId);

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching data sheets:', error);
        return [];
      }

      return data?.map(this.formatDataSheetData) || [];
    } catch (error) {
      console.error('Error in getDataSheetsByStudent:', error);
      return [];
    }
  }

  /**
   * Get data sheets by teacher
   */
  static async getDataSheetsByTeacher(
    teacherId: string,
    date?: string
  ): Promise<DataSheet[]> {
    try {
      let query = supabase
        .from('data_sheets')
        .select(
          `
          *,
          students!inner(name, age, country, grade_level)
        `
        )
        .eq('teacher_id', teacherId);

      if (date) {
        query = query.eq('date', date);
      }

      query = query.order('date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching teacher data sheets:', error);
        return [];
      }

      return data?.map(this.formatDataSheetData) || [];
    } catch (error) {
      console.error('Error in getDataSheetsByTeacher:', error);
      return [];
    }
  }

  /**
   * Create an activity in a data sheet
   */
  static async createActivity(
    dataSheetId: string,
    activity: Omit<
      DataSheetActivity,
      'id' | 'dataSheetId' | 'createdAt' | 'updatedAt'
    >
  ): Promise<DataSheetActivity | null> {
    try {
      const { data, error } = await supabase
        .from('data_sheet_activities')
        .insert([
          {
            data_sheet_id: dataSheetId,
            activity_type: activity.activityType,
            activity_name: activity.activityName,
            description: activity.description,
            scheduled_time: activity.scheduledTime,
            actual_start: activity.actualStart,
            actual_end: activity.actualEnd,
            status: activity.status,
            progress_notes: activity.progressNotes,
            prompts_used: activity.promptsUsed,
            challenges_encountered: activity.challengesEncountered,
            success_indicators: activity.successIndicators,
            rating: activity.rating,
            observations: activity.observations,
            next_steps: activity.nextSteps,
            attachments: activity.attachments,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating activity:', error);
        return null;
      }

      return this.formatActivityData(data);
    } catch (error) {
      console.error('Error in createActivity:', error);
      return null;
    }
  }

  /**
   * Update an activity
   */
  static async updateActivity(
    activityId: string,
    updates: Partial<DataSheetActivity>
  ): Promise<DataSheetActivity | null> {
    try {
      const updateData: any = {};

      if (updates.status) {
        updateData.status = updates.status;
      }
      if (updates.actualStart) {
        updateData.actual_start = updates.actualStart;
      }
      if (updates.actualEnd) {
        updateData.actual_end = updates.actualEnd;
      }
      if (updates.progressNotes) {
        updateData.progress_notes = updates.progressNotes;
      }
      if (updates.rating) {
        updateData.rating = updates.rating;
      }
      if (updates.observations) {
        updateData.observations = updates.observations;
      }
      if (updates.nextSteps) {
        updateData.next_steps = updates.nextSteps;
      }
      if (updates.challengesEncountered) {
        updateData.challenges_encountered = updates.challengesEncountered;
      }
      if (updates.promptsUsed) {
        updateData.prompts_used = updates.promptsUsed;
      }
      if (updates.attachments) {
        updateData.attachments = updates.attachments;
      }

      const { data, error } = await supabase
        .from('data_sheet_activities')
        .update(updateData)
        .eq('id', activityId)
        .select()
        .single();

      if (error) {
        console.error('Error updating activity:', error);
        return null;
      }

      return this.formatActivityData(data);
    } catch (error) {
      console.error('Error in updateActivity:', error);
      return null;
    }
  }

  /**
   * Get activities for a data sheet
   */
  static async getActivitiesByDataSheet(
    dataSheetId: string
  ): Promise<DataSheetActivity[]> {
    try {
      const { data, error } = await supabase
        .from('data_sheet_activities')
        .select('*')
        .eq('data_sheet_id', dataSheetId)
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('Error fetching activities:', error);
        return [];
      }

      return data?.map(this.formatActivityData) || [];
    } catch (error) {
      console.error('Error in getActivitiesByDataSheet:', error);
      return [];
    }
  }

  /**
   * Get activities by type for a student
   */
  static async getActivitiesByType(
    studentId: string,
    activityType: ActivityType,
    days: number = 30
  ): Promise<DataSheetActivity[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('data_sheet_activities')
        .select(
          `
          *,
          data_sheets!inner(student_id)
        `
        )
        .eq('data_sheets.student_id', studentId)
        .eq('activity_type', activityType)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities by type:', error);
        return [];
      }

      return data?.map(this.formatActivityData) || [];
    } catch (error) {
      console.error('Error in getActivitiesByType:', error);
      return [];
    }
  }

  /**
   * Generate progress summary for a student
   */
  static async generateProgressSummary(
    studentId: string,
    days: number = 30
  ): Promise<ProgressSummary> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all activities for the period
      const { data: activities, error } = await supabase
        .from('data_sheet_activities')
        .select(
          `
          *,
          data_sheets!inner(student_id)
        `
        )
        .eq('data_sheets.student_id', studentId)
        .gte('created_at', startDate.toISOString());

      if (error || !activities) {
        console.error('Error fetching activities for summary:', error);
        return {
          overallProgress: 0,
          areasOfStrength: [],
          areasForImprovement: [],
        };
      }

      // Calculate progress by activity type
      const progressByType: Record<ActivityType, number[]> = {
        sensory: [],
        writing: [],
        communication: [],
        social: [],
        academics: [],
      };

      activities.forEach((activity: any) => {
        if (activity.rating && activity.status === 'completed') {
          progressByType[activity.activity_type as ActivityType].push(
            activity.rating
          );
        }
      });

      // Calculate averages and identify strengths/improvements
      const averages: Record<ActivityType, number> = {} as any;
      const areasOfStrength: string[] = [];
      const areasForImprovement: string[] = [];

      Object.entries(progressByType).forEach(([type, ratings]) => {
        if (ratings.length > 0) {
          const average =
            ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
          averages[type as ActivityType] = average;

          if (average >= 4) {
            areasOfStrength.push(ACTIVITY_TYPES[type as ActivityType].name);
          } else if (average < 3) {
            areasForImprovement.push(ACTIVITY_TYPES[type as ActivityType].name);
          }
        }
      });

      // Calculate overall progress
      const allRatings = Object.values(progressByType).flat();
      const overallProgress =
        allRatings.length > 0
          ? Math.round(
              (allRatings.reduce((sum, rating) => sum + rating, 0) /
                allRatings.length) *
                20
            )
          : 0;

      return {
        overallProgress,
        areasOfStrength,
        areasForImprovement,
      };
    } catch (error) {
      console.error('Error in generateProgressSummary:', error);
      return {
        overallProgress: 0,
        areasOfStrength: [],
        areasForImprovement: [],
      };
    }
  }

  /**
   * Create data sheet from template
   */
  static async createFromTemplate(
    templateId: string,
    studentId: string,
    teacherId: string,
    parentId: string,
    scheduledDate: string
  ): Promise<DataSheet | null> {
    try {
      const { data, error } = await supabase.rpc(
        'create_data_sheet_from_template',
        {
          template_id: templateId,
          student_id_param: studentId,
          teacher_id_param: teacherId,
          parent_id_param: parentId,
          scheduled_date: scheduledDate,
        }
      );

      if (error) {
        console.error('Error creating from template:', error);
        return null;
      }

      return await this.getDataSheetById(data);
    } catch (error) {
      console.error('Error in createFromTemplate:', error);
      return null;
    }
  }

  /**
   * Get data sheet templates
   */
  static async getTemplates(): Promise<DataSheet[]> {
    try {
      const { data, error } = await supabase
        .from('data_sheets')
        .select('*')
        .eq('is_template', true)
        .order('template_name');

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data?.map(this.formatDataSheetData) || [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  }

  /**
   * Get student progress tracking data
   */
  static async getProgressTracking(
    studentId: string,
    subject?: string,
    skillArea?: string
  ): Promise<ProgressTracking[]> {
    try {
      let query = supabase
        .from('progress_tracking')
        .select('*')
        .eq('student_id', studentId);

      if (subject) {
        query = query.eq('subject', subject);
      }
      if (skillArea) {
        query = query.eq('skill_area', skillArea);
      }

      query = query.order('measurement_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching progress tracking:', error);
        return [];
      }

      return data?.map(this.formatProgressTrackingData) || [];
    } catch (error) {
      console.error('Error in getProgressTracking:', error);
      return [];
    }
  }

  /**
   * Create progress tracking entry
   */
  static async createProgressTracking(
    data: Omit<ProgressTracking, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProgressTracking | null> {
    try {
      const { data: result, error } = await supabase
        .from('progress_tracking')
        .insert([
          {
            student_id: data.studentId,
            data_sheet_id: data.dataSheetId,
            activity_id: data.activityId,
            subject: data.subject,
            skill_area: data.skillArea,
            progress_data: data.progressData,
            measurement_date: data.measurementDate,
            measured_by: data.measuredBy,
            notes: data.notes,
            attachments: data.attachments,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating progress tracking:', error);
        return null;
      }

      return this.formatProgressTrackingData(result);
    } catch (error) {
      console.error('Error in createProgressTracking:', error);
      return null;
    }
  }

  /**
   * Get data sheet by ID
   */
  static async getDataSheetById(id: string): Promise<DataSheet | null> {
    try {
      const { data, error } = await supabase
        .from('data_sheets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching data sheet:', error);
        return null;
      }

      return this.formatDataSheetData(data);
    } catch (error) {
      console.error('Error in getDataSheetById:', error);
      return null;
    }
  }

  /**
   * Get activity types with descriptions
   */
  static getActivityTypes(): typeof ACTIVITY_TYPES {
    return ACTIVITY_TYPES;
  }

  /**
   * Create default activities for a data sheet
   */
  static async createDefaultActivities(
    dataSheetId: string,
    baseDate: string = new Date().toISOString()
  ): Promise<DataSheetActivity[]> {
    const defaultActivities = [
      {
        activityType: 'academics' as ActivityType,
        activityName: 'Morning Learning Session',
        description: 'Core academic subjects focusing on literacy and numeracy',
        scheduledTime: new Date(baseDate).toISOString(),
        status: 'scheduled' as ActivityStatus,
        successIndicators: [
          'completes_tasks',
          'follows_instructions',
          'asks_questions',
        ],
        promptsUsed: [],
        challengesEncountered: [],
        attachments: [],
      },
      {
        activityType: 'writing' as ActivityType,
        activityName: 'Fine Motor Practice',
        description: 'Handwriting and fine motor skill development',
        scheduledTime: new Date(
          new Date(baseDate).getTime() + 60 * 60 * 1000
        ).toISOString(),
        status: 'scheduled' as ActivityStatus,
        successIndicators: [
          'proper_grip',
          'letter_formation',
          'stays_within_lines',
        ],
        promptsUsed: [],
        challengesEncountered: [],
        attachments: [],
      },
      {
        activityType: 'social' as ActivityType,
        activityName: 'Collaborative Activity',
        description: 'Social interaction and cooperation skills',
        scheduledTime: new Date(
          new Date(baseDate).getTime() + 2 * 60 * 60 * 1000
        ).toISOString(),
        status: 'scheduled' as ActivityStatus,
        successIndicators: [
          'shares_materials',
          'takes_turns',
          'communicates_needs',
        ],
        promptsUsed: [],
        challengesEncountered: [],
        attachments: [],
      },
      {
        activityType: 'sensory' as ActivityType,
        activityName: 'Sensory Exploration',
        description: 'Sensory processing and integration activities',
        scheduledTime: new Date(
          new Date(baseDate).getTime() + 3 * 60 * 60 * 1000
        ).toISOString(),
        status: 'scheduled' as ActivityStatus,
        successIndicators: [
          'explores_textures',
          'tolerates_sensory_input',
          'describes_experiences',
        ],
        promptsUsed: [],
        challengesEncountered: [],
        attachments: [],
      },
      {
        activityType: 'communication' as ActivityType,
        activityName: 'Language Development',
        description: 'Verbal and non-verbal communication skills',
        scheduledTime: new Date(
          new Date(baseDate).getTime() + 4 * 60 * 60 * 1000
        ).toISOString(),
        status: 'scheduled' as ActivityStatus,
        successIndicators: [
          'expresses_ideas',
          'listens_actively',
          'follows_directions',
        ],
        promptsUsed: [],
        challengesEncountered: [],
        attachments: [],
      },
    ];

    const createdActivities: DataSheetActivity[] = [];

    for (const activity of defaultActivities) {
      const created = await this.createActivity(dataSheetId, activity);
      if (created) {
        createdActivities.push(created);
      }
    }

    return createdActivities;
  }

  // Helper methods for data formatting
  private static formatDataSheetData(data: any): DataSheet {
    return {
      id: data.id,
      studentId: data.student_id,
      teacherId: data.teacher_id,
      parentId: data.parent_id,
      date: data.date,
      title: data.title,
      description: data.description,
      activities: data.activities || [],
      progressSummary: data.progress_summary || {
        overallProgress: 0,
        areasOfStrength: [],
        areasForImprovement: [],
      },
      challenges: data.challenges || [],
      prompts: data.prompts || [],
      notes: data.notes,
      isTemplate: data.is_template,
      templateName: data.template_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static formatActivityData(data: any): DataSheetActivity {
    return {
      id: data.id,
      dataSheetId: data.data_sheet_id,
      activityType: data.activity_type,
      activityName: data.activity_name,
      description: data.description,
      scheduledTime: data.scheduled_time,
      actualStart: data.actual_start,
      actualEnd: data.actual_end,
      status: data.status,
      progressNotes: data.progress_notes,
      promptsUsed: data.prompts_used || [],
      challengesEncountered: data.challenges_encountered || [],
      successIndicators: data.success_indicators || [],
      rating: data.rating,
      observations: data.observations,
      nextSteps: data.next_steps,
      attachments: data.attachments || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static formatProgressTrackingData(data: any): ProgressTracking {
    return {
      id: data.id,
      studentId: data.student_id,
      dataSheetId: data.data_sheet_id,
      activityId: data.activity_id,
      subject: data.subject,
      skillArea: data.skill_area,
      progressData: data.progress_data,
      measurementDate: data.measurement_date,
      measuredBy: data.measured_by,
      notes: data.notes,
      attachments: data.attachments || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
