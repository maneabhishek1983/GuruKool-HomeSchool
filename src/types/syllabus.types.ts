// Country-based syllabus system types

export type CountryCode = 'UK' | 'US' | 'INDIA';
export type GradeSystem = 'uk_year' | 'us_grade' | 'india_class';
export type ActivityType =
  | 'sensory'
  | 'writing'
  | 'communication'
  | 'social'
  | 'academics';
export type ActivityStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'skipped';
export type AccountStatus = 'pending' | 'active' | 'suspended' | 'deleted';

export interface Country {
  code: CountryCode;
  name: string;
  gradeSystem: GradeSystem;
  grades: Grade[];
}

export interface Grade {
  level: string;
  displayName: string;
  ageRange: {
    min: number;
    max: number;
  };
  subjects: string[];
}

export interface AcademicStandard {
  id: string;
  country: CountryCode;
  gradeLevel: string;
  gradeSystem: GradeSystem;
  subject: string;
  standards: LearningObjective[];
  assessmentCriteria: AssessmentCriteria;
  ageRange: {
    minAge: number;
    maxAge: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LearningObjective {
  code: string;
  title: string;
  description: string;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
}

export interface AssessmentCriteria {
  formative: string[];
  summative: string[];
  rubric?: RubricLevel[];
}

export interface RubricLevel {
  level: number;
  description: string;
  indicators: string[];
}

export interface Student {
  id: string;
  parentId: string;
  name: string;
  age: number;
  country: CountryCode;
  gradeLevel: string;
  gradeSystem: GradeSystem;
  birthDate?: string;
  learningPreferences: LearningPreferences;
  specialNeeds: SpecialNeed[];
  academicStandards: Record<string, string[]>;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  interests: string[];
  attentionSpan: 'short' | 'medium' | 'long';
  preferredTime: 'morning' | 'afternoon' | 'evening';
  motivationFactors?: string[];
}

export interface SpecialNeed {
  type: string;
  description: string;
  accommodations: string[];
  supportStrategies: string[];
}

export interface DataSheet {
  id: string;
  studentId: string;
  teacherId?: string;
  parentId: string;
  date: string;
  title: string;
  description?: string;
  activities: DataSheetActivity[];
  progressSummary: ProgressSummary;
  challenges: Challenge[];
  prompts: Prompt[];
  notes?: string;
  isTemplate: boolean;
  templateName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSheetActivity {
  id: string;
  dataSheetId: string;
  activityType: ActivityType;
  activityName: string;
  description?: string;
  scheduledTime?: string;
  actualStart?: string;
  actualEnd?: string;
  status: ActivityStatus;
  progressNotes?: string;
  promptsUsed: Prompt[];
  challengesEncountered: Challenge[];
  successIndicators: string[];
  rating?: number; // 1-5 scale
  observations?: string;
  nextSteps?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressSummary {
  overallProgress: number; // 0-100
  areasOfStrength: string[];
  areasForImprovement: string[];
  weeklyGoals?: Goal[];
  monthlyGoals?: Goal[];
}

export interface Challenge {
  id: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  strategies: string[];
  resolved: boolean;
  resolvedDate?: string;
}

export interface Prompt {
  id: string;
  type: 'verbal' | 'visual' | 'physical' | 'gestural';
  description: string;
  effectiveness: number; // 1-5 scale
  frequency: number;
  context: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number; // 0-100
  priority: 'low' | 'medium' | 'high';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
}

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  filename: string;
  url: string;
  description?: string;
  timestamp: string;
}

export interface ProgressTracking {
  id: string;
  studentId: string;
  dataSheetId?: string;
  activityId?: string;
  subject: string;
  skillArea: string;
  progressData: ProgressData;
  measurementDate: string;
  measuredBy: string;
  notes?: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressData {
  currentLevel: number;
  targetLevel: number;
  improvementRate: number;
  consistencyScore: number;
  confidenceLevel: number;
  independenceLevel: number;
  metrics: ProgressMetric[];
}

export interface ProgressMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'improving' | 'stable' | 'declining';
  lastMeasured: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  studentId: string;
  parentId: string;
  subjects: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Country-specific grade configurations
export const COUNTRIES: Record<CountryCode, Country> = {
  UK: {
    code: 'UK',
    name: 'United Kingdom',
    gradeSystem: 'uk_year',
    grades: [
      {
        level: 'Reception',
        displayName: 'Reception (Age 4-5)',
        ageRange: { min: 4, max: 5 },
        subjects: [
          'Mathematics',
          'English',
          'Science',
          'Physical Development',
          'Creative Arts',
        ],
      },
      {
        level: 'Year 1',
        displayName: 'Year 1 (Age 5-6)',
        ageRange: { min: 5, max: 6 },
        subjects: [
          'Mathematics',
          'English',
          'Science',
          'History',
          'Geography',
          'Art',
          'Music',
          'PE',
        ],
      },
      {
        level: 'Year 2',
        displayName: 'Year 2 (Age 6-7)',
        ageRange: { min: 6, max: 7 },
        subjects: [
          'Mathematics',
          'English',
          'Science',
          'History',
          'Geography',
          'Art',
          'Music',
          'PE',
          'Computing',
        ],
      },
      {
        level: 'Year 3',
        displayName: 'Year 3 (Age 7-8)',
        ageRange: { min: 7, max: 8 },
        subjects: [
          'Mathematics',
          'English',
          'Science',
          'History',
          'Geography',
          'Art',
          'Music',
          'PE',
          'Computing',
          'Languages',
        ],
      },
    ],
  },
  US: {
    code: 'US',
    name: 'United States',
    gradeSystem: 'us_grade',
    grades: [
      {
        level: 'Pre-K',
        displayName: 'Pre-Kindergarten (Age 4-5)',
        ageRange: { min: 4, max: 5 },
        subjects: [
          'Mathematics',
          'English Language Arts',
          'Science',
          'Social Studies',
          'Physical Education',
          'Arts',
        ],
      },
      {
        level: 'Kindergarten',
        displayName: 'Kindergarten (Age 5-6)',
        ageRange: { min: 5, max: 6 },
        subjects: [
          'Mathematics',
          'English Language Arts',
          'Science',
          'Social Studies',
          'Physical Education',
          'Arts',
        ],
      },
      {
        level: 'Grade 1',
        displayName: '1st Grade (Age 6-7)',
        ageRange: { min: 6, max: 7 },
        subjects: [
          'Mathematics',
          'English Language Arts',
          'Science',
          'Social Studies',
          'Physical Education',
          'Arts',
          'Technology',
        ],
      },
      {
        level: 'Grade 2',
        displayName: '2nd Grade (Age 7-8)',
        ageRange: { min: 7, max: 8 },
        subjects: [
          'Mathematics',
          'English Language Arts',
          'Science',
          'Social Studies',
          'Physical Education',
          'Arts',
          'Technology',
        ],
      },
    ],
  },
  INDIA: {
    code: 'INDIA',
    name: 'India',
    gradeSystem: 'india_class',
    grades: [
      {
        level: 'LKG',
        displayName: 'Lower Kindergarten (Age 4-5)',
        ageRange: { min: 4, max: 5 },
        subjects: [
          'Mathematics',
          'English',
          'Hindi',
          'Environmental Studies',
          'Arts & Crafts',
          'Physical Education',
        ],
      },
      {
        level: 'UKG',
        displayName: 'Upper Kindergarten (Age 5-6)',
        ageRange: { min: 5, max: 6 },
        subjects: [
          'Mathematics',
          'English',
          'Hindi',
          'Environmental Studies',
          'Arts & Crafts',
          'Physical Education',
        ],
      },
      {
        level: 'Class 1',
        displayName: 'Class 1 (Age 6-7)',
        ageRange: { min: 6, max: 7 },
        subjects: [
          'Mathematics',
          'English',
          'Hindi',
          'Environmental Studies',
          'Arts & Crafts',
          'Physical Education',
          'Moral Science',
        ],
      },
      {
        level: 'Class 2',
        displayName: 'Class 2 (Age 7-8)',
        ageRange: { min: 7, max: 8 },
        subjects: [
          'Mathematics',
          'English',
          'Hindi',
          'Environmental Studies',
          'Arts & Crafts',
          'Physical Education',
          'Moral Science',
          'Computer Science',
        ],
      },
    ],
  },
};

// Activity type configurations
export const ACTIVITY_TYPES: Record<
  ActivityType,
  {
    name: string;
    description: string;
    icon: string;
    defaultDuration: number; // minutes
    skillAreas: string[];
  }
> = {
  sensory: {
    name: 'Sensory',
    description: 'Activities that engage the senses and sensory processing',
    icon: '👁️',
    defaultDuration: 15,
    skillAreas: [
      'tactile_processing',
      'auditory_processing',
      'visual_processing',
      'proprioception',
      'vestibular',
    ],
  },
  writing: {
    name: 'Writing',
    description: 'Fine motor skills and written communication activities',
    icon: '✍️',
    defaultDuration: 20,
    skillAreas: [
      'fine_motor',
      'letter_formation',
      'pencil_grip',
      'handwriting',
      'composition',
    ],
  },
  communication: {
    name: 'Communication',
    description: 'Verbal and non-verbal communication skill development',
    icon: '💬',
    defaultDuration: 25,
    skillAreas: [
      'verbal_expression',
      'listening',
      'conversation',
      'non_verbal_communication',
      'language_comprehension',
    ],
  },
  social: {
    name: 'Social',
    description: 'Social interaction and relationship building activities',
    icon: '👥',
    defaultDuration: 30,
    skillAreas: [
      'cooperation',
      'sharing',
      'empathy',
      'conflict_resolution',
      'friendship_skills',
    ],
  },
  academics: {
    name: 'Academics',
    description: 'Subject-specific learning and cognitive skill development',
    icon: '📚',
    defaultDuration: 45,
    skillAreas: [
      'literacy',
      'numeracy',
      'problem_solving',
      'critical_thinking',
      'memory',
    ],
  },
};
