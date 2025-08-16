import {
  AcademicStandard,
  Country,
  Subject,
  GradeLevel,
  Topic,
  LearningOutcome,
  HomeschoolingOptions,
  SocializationOption,
  PhysicalEducationOption,
  ExtracurricularOption,
  CommunityInvolvementOption,
} from '@/types';

/**
 * Academic Standards Service
 * Provides comprehensive academic standards data for UK, US, and India
 * along with homeschooling options for socialization and physical education
 */

// UK Academic Standards
const ukAcademicStandard: AcademicStandard = {
  country: 'UK',
  name: 'National Curriculum for England',
  description:
    'The National Curriculum for England sets out the subjects and standards that primary and secondary schools must follow.',
  gradeLevels: [
    {
      id: 'uk-reception',
      name: 'Reception',
      ageRange: '4-5 years',
      description: 'Foundation stage focusing on early learning goals',
      subjects: [],
      keySkills: [
        'Communication',
        'Physical Development',
        'Personal Development',
      ],
      assessmentCriteria: ['Early Learning Goals', 'Foundation Stage Profile'],
    },
    {
      id: 'uk-year1',
      name: 'Year 1',
      ageRange: '5-6 years',
      description: 'Key Stage 1 - Primary education begins',
      subjects: [],
      keySkills: ['Reading', 'Writing', 'Mathematics', 'Science'],
      assessmentCriteria: ['Phonics Screening Check', 'Teacher Assessment'],
    },
    {
      id: 'uk-year2',
      name: 'Year 2',
      ageRange: '6-7 years',
      description: 'Key Stage 1 - End of primary foundation',
      subjects: [],
      keySkills: ['Reading', 'Writing', 'Mathematics', 'Science'],
      assessmentCriteria: ['SATs', 'Teacher Assessment'],
    },
    {
      id: 'uk-year3',
      name: 'Year 3',
      ageRange: '7-8 years',
      description: 'Key Stage 2 - Lower primary',
      subjects: [],
      keySkills: [
        'Core Subjects',
        'Foundation Subjects',
        'Religious Education',
      ],
      assessmentCriteria: ['Teacher Assessment', 'Progress Tracking'],
    },
    {
      id: 'uk-year4',
      name: 'Year 4',
      ageRange: '8-9 years',
      description: 'Key Stage 2 - Lower primary',
      subjects: [],
      keySkills: [
        'Core Subjects',
        'Foundation Subjects',
        'Religious Education',
      ],
      assessmentCriteria: ['Teacher Assessment', 'Progress Tracking'],
    },
    {
      id: 'uk-year5',
      name: 'Year 5',
      ageRange: '9-10 years',
      description: 'Key Stage 2 - Upper primary',
      subjects: [],
      keySkills: [
        'Core Subjects',
        'Foundation Subjects',
        'Religious Education',
      ],
      assessmentCriteria: ['Teacher Assessment', 'Progress Tracking'],
    },
    {
      id: 'uk-year6',
      name: 'Year 6',
      ageRange: '10-11 years',
      description: 'Key Stage 2 - End of primary',
      subjects: [],
      keySkills: [
        'Core Subjects',
        'Foundation Subjects',
        'Religious Education',
      ],
      assessmentCriteria: ['SATs', 'Teacher Assessment'],
    },
    {
      id: 'uk-year7',
      name: 'Year 7',
      ageRange: '11-12 years',
      description: 'Key Stage 3 - Secondary education begins',
      subjects: [],
      keySkills: [
        'Core Subjects',
        'Foundation Subjects',
        'Religious Education',
      ],
      assessmentCriteria: ['Teacher Assessment', 'Progress Tracking'],
    },
    {
      id: 'uk-year8',
      name: 'Year 8',
      ageRange: '12-13 years',
      description: 'Key Stage 3 - Middle secondary',
      subjects: [],
      keySkills: [
        'Core Subjects',
        'Foundation Subjects',
        'Religious Education',
      ],
      assessmentCriteria: ['Teacher Assessment', 'Progress Tracking'],
    },
    {
      id: 'uk-year9',
      name: 'Year 9',
      ageRange: '13-14 years',
      description: 'Key Stage 3 - End of lower secondary',
      subjects: [],
      keySkills: [
        'Core Subjects',
        'Foundation Subjects',
        'Religious Education',
      ],
      assessmentCriteria: ['Teacher Assessment', 'Progress Tracking'],
    },
    {
      id: 'uk-year10',
      name: 'Year 10',
      ageRange: '14-15 years',
      description: 'Key Stage 4 - GCSE preparation',
      subjects: [],
      keySkills: ['Core Subjects', 'Optional Subjects', 'GCSE Preparation'],
      assessmentCriteria: ['Coursework', 'Mock Exams', 'Progress Tracking'],
    },
    {
      id: 'uk-year11',
      name: 'Year 11',
      ageRange: '15-16 years',
      description: 'Key Stage 4 - GCSE completion',
      subjects: [],
      keySkills: ['Core Subjects', 'Optional Subjects', 'GCSE Completion'],
      assessmentCriteria: ['GCSE Exams', 'Coursework', 'Final Assessment'],
    },
  ],
  subjects: [
    {
      id: 'uk-english',
      name: 'English',
      description:
        'Core subject focusing on language, literature, and communication skills',
      topics: [
        {
          id: 'uk-english-reading',
          name: 'Reading',
          description: 'Comprehension, analysis, and interpretation of texts',
          learningObjectives: [
            'Understand and respond to texts',
            'Analyze language and structure',
            "Evaluate writers' methods",
          ],
          activities: [
            'Reading comprehension exercises',
            'Text analysis',
            'Book reviews',
          ],
          resources: [
            'Classic literature',
            'Modern texts',
            'Poetry anthologies',
          ],
          assessmentCriteria: [
            'Reading comprehension tests',
            'Text analysis essays',
            'Book reviews',
          ],
          difficulty: 'intermediate',
        },
        {
          id: 'uk-english-writing',
          name: 'Writing',
          description: 'Creative and analytical writing skills',
          learningObjectives: [
            'Write clearly and effectively',
            'Use appropriate language and style',
            'Structure writing coherently',
          ],
          activities: ['Creative writing', 'Essay writing', 'Report writing'],
          resources: ['Writing prompts', 'Grammar guides', 'Style manuals'],
          assessmentCriteria: [
            'Writing assignments',
            'Portfolio assessment',
            'Writing tests',
          ],
          difficulty: 'intermediate',
        },
      ],
      skills: [
        'Reading comprehension',
        'Writing skills',
        'Speaking and listening',
        'Grammar and punctuation',
      ],
      assessmentMethods: [
        'Written exams',
        'Coursework',
        'Speaking assessments',
        'Portfolio',
      ],
      resources: [
        'Textbooks',
        'Literature',
        'Online resources',
        'Writing guides',
      ],
    },
    {
      id: 'uk-mathematics',
      name: 'Mathematics',
      description:
        'Core subject covering number, algebra, geometry, and statistics',
      topics: [
        {
          id: 'uk-math-number',
          name: 'Number',
          description:
            'Number operations, fractions, decimals, and percentages',
          learningObjectives: [
            'Perform calculations with confidence',
            'Understand number relationships',
            'Solve problems involving numbers',
          ],
          activities: ['Mental arithmetic', 'Problem solving', 'Number games'],
          resources: ['Math textbooks', 'Online calculators', 'Math games'],
          assessmentCriteria: [
            'Mental arithmetic tests',
            'Problem solving tasks',
            'Number operations tests',
          ],
          difficulty: 'intermediate',
        },
        {
          id: 'uk-math-algebra',
          name: 'Algebra',
          description: 'Algebraic expressions, equations, and functions',
          learningObjectives: [
            'Use algebraic notation',
            'Solve equations',
            'Understand functions',
          ],
          activities: [
            'Equation solving',
            'Pattern recognition',
            'Function graphing',
          ],
          resources: [
            'Algebra textbooks',
            'Graphing software',
            'Algebra manipulatives',
          ],
          assessmentCriteria: [
            'Algebra tests',
            'Problem solving',
            'Function analysis',
          ],
          difficulty: 'advanced',
        },
      ],
      skills: [
        'Number operations',
        'Algebra',
        'Geometry',
        'Statistics',
        'Problem solving',
      ],
      assessmentMethods: [
        'Written exams',
        'Problem solving tasks',
        'Mental arithmetic tests',
      ],
      resources: [
        'Textbooks',
        'Online resources',
        'Math manipulatives',
        'Calculators',
      ],
    },
    {
      id: 'uk-science',
      name: 'Science',
      description: 'Core subject covering biology, chemistry, and physics',
      topics: [
        {
          id: 'uk-science-biology',
          name: 'Biology',
          description: 'Study of living organisms and life processes',
          learningObjectives: [
            'Understand life processes',
            'Explore living things',
            'Investigate biological systems',
          ],
          activities: ['Practical experiments', 'Field studies', 'Microscopy'],
          resources: [
            'Biology textbooks',
            'Laboratory equipment',
            'Microscopes',
          ],
          assessmentCriteria: [
            'Practical assessments',
            'Written tests',
            'Investigations',
          ],
          difficulty: 'intermediate',
        },
      ],
      skills: [
        'Scientific inquiry',
        'Practical skills',
        'Data analysis',
        'Scientific communication',
      ],
      assessmentMethods: [
        'Practical assessments',
        'Written exams',
        'Investigations',
        'Coursework',
      ],
      resources: [
        'Textbooks',
        'Laboratory equipment',
        'Online simulations',
        'Field guides',
      ],
    },
  ],
  assessmentMethods: [
    'Written exams',
    'Coursework',
    'Practical assessments',
    'Teacher assessment',
    'Portfolio',
  ],
  learningOutcomes: [
    {
      id: 'uk-literacy',
      category: 'Literacy',
      outcomes: [
        'Read fluently and with understanding',
        'Write clearly and effectively',
        'Communicate orally with confidence',
      ],
      assessmentMethods: [
        'Reading tests',
        'Writing assignments',
        'Speaking assessments',
      ],
      gradeLevel: 'All levels',
    },
    {
      id: 'uk-numeracy',
      category: 'Numeracy',
      outcomes: [
        'Use numbers confidently',
        'Solve mathematical problems',
        'Apply mathematical concepts',
      ],
      assessmentMethods: [
        'Math tests',
        'Problem solving tasks',
        'Practical applications',
      ],
      gradeLevel: 'All levels',
    },
  ],
};

// US Academic Standards
const usAcademicStandard: AcademicStandard = {
  country: 'US',
  name: 'Common Core State Standards',
  description:
    'Academic standards in mathematics and English language arts/literacy that outline what students should know and be able to do at the end of each grade.',
  gradeLevels: [
    {
      id: 'us-kindergarten',
      name: 'Kindergarten',
      ageRange: '5-6 years',
      description:
        'Foundation year focusing on basic skills and social development',
      subjects: [],
      keySkills: ['Reading readiness', 'Basic math', 'Social skills'],
      assessmentCriteria: [
        'Teacher observation',
        'Portfolio assessment',
        'Readiness tests',
      ],
    },
    {
      id: 'us-grade1',
      name: 'Grade 1',
      ageRange: '6-7 years',
      description: 'Elementary education begins with core subjects',
      subjects: [],
      keySkills: ['Reading', 'Writing', 'Mathematics', 'Science'],
      assessmentCriteria: [
        'Standardized tests',
        'Teacher assessment',
        'Portfolio',
      ],
    },
    {
      id: 'us-grade2',
      name: 'Grade 2',
      ageRange: '7-8 years',
      description: 'Building on foundational skills',
      subjects: [],
      keySkills: [
        'Reading fluency',
        'Writing skills',
        'Math operations',
        'Science inquiry',
      ],
      assessmentCriteria: [
        'Standardized tests',
        'Teacher assessment',
        'Portfolio',
      ],
    },
    {
      id: 'us-grade3',
      name: 'Grade 3',
      ageRange: '8-9 years',
      description: 'Transition to more complex learning',
      subjects: [],
      keySkills: [
        'Reading comprehension',
        'Writing composition',
        'Math problem solving',
        'Science concepts',
      ],
      assessmentCriteria: [
        'Standardized tests',
        'Teacher assessment',
        'Portfolio',
      ],
    },
    {
      id: 'us-grade4',
      name: 'Grade 4',
      ageRange: '9-10 years',
      description: 'Upper elementary with increased complexity',
      subjects: [],
      keySkills: [
        'Advanced reading',
        'Complex writing',
        'Math applications',
        'Science experiments',
      ],
      assessmentCriteria: [
        'Standardized tests',
        'Teacher assessment',
        'Portfolio',
      ],
    },
    {
      id: 'us-grade5',
      name: 'Grade 5',
      ageRange: '10-11 years',
      description: 'End of elementary preparation for middle school',
      subjects: [],
      keySkills: [
        'Critical reading',
        'Analytical writing',
        'Advanced math',
        'Scientific method',
      ],
      assessmentCriteria: [
        'Standardized tests',
        'Teacher assessment',
        'Portfolio',
      ],
    },
    {
      id: 'us-grade6',
      name: 'Grade 6',
      ageRange: '11-12 years',
      description: 'Middle school begins with subject specialization',
      subjects: [],
      keySkills: [
        'Subject-specific skills',
        'Research methods',
        'Critical thinking',
        'Independent learning',
      ],
      assessmentCriteria: ['Subject tests', 'Projects', 'Teacher assessment'],
    },
    {
      id: 'us-grade7',
      name: 'Grade 7',
      ageRange: '12-13 years',
      description: 'Middle school with increased academic rigor',
      subjects: [],
      keySkills: [
        'Advanced subject skills',
        'Research and analysis',
        'Critical thinking',
        'Study skills',
      ],
      assessmentCriteria: ['Subject tests', 'Projects', 'Teacher assessment'],
    },
    {
      id: 'us-grade8',
      name: 'Grade 8',
      ageRange: '13-14 years',
      description: 'End of middle school preparation for high school',
      subjects: [],
      keySkills: [
        'High school preparation',
        'Advanced skills',
        'Independent research',
        'Critical analysis',
      ],
      assessmentCriteria: ['Subject tests', 'Projects', 'Teacher assessment'],
    },
    {
      id: 'us-grade9',
      name: 'Grade 9',
      ageRange: '14-15 years',
      description: 'High school freshman year',
      subjects: [],
      keySkills: [
        'High school level skills',
        'Career exploration',
        'Advanced coursework',
        'College preparation',
      ],
      assessmentCriteria: ['Course grades', 'Standardized tests', 'Portfolio'],
    },
    {
      id: 'us-grade10',
      name: 'Grade 10',
      ageRange: '15-16 years',
      description: 'High school sophomore year',
      subjects: [],
      keySkills: [
        'Advanced coursework',
        'Career planning',
        'College preparation',
        'Leadership skills',
      ],
      assessmentCriteria: ['Course grades', 'Standardized tests', 'Portfolio'],
    },
    {
      id: 'us-grade11',
      name: 'Grade 11',
      ageRange: '16-17 years',
      description: 'High school junior year',
      subjects: [],
      keySkills: [
        'Advanced placement',
        'College applications',
        'Career development',
        'Leadership',
      ],
      assessmentCriteria: ['Course grades', 'SAT/ACT', 'AP exams', 'Portfolio'],
    },
    {
      id: 'us-grade12',
      name: 'Grade 12',
      ageRange: '17-18 years',
      description: 'High school senior year',
      subjects: [],
      keySkills: [
        'College preparation',
        'Career readiness',
        'Advanced studies',
        'Graduation requirements',
      ],
      assessmentCriteria: [
        'Course grades',
        'SAT/ACT',
        'AP exams',
        'Graduation portfolio',
      ],
    },
  ],
  subjects: [
    {
      id: 'us-english',
      name: 'English Language Arts',
      description:
        'Core subject covering reading, writing, speaking, and listening',
      topics: [
        {
          id: 'us-english-reading',
          name: 'Reading Literature and Informational Text',
          description: 'Comprehension and analysis of various text types',
          learningObjectives: [
            'Read and comprehend complex texts',
            'Analyze text structure',
            'Evaluate arguments',
          ],
          activities: ['Close reading', 'Text analysis', 'Literature circles'],
          resources: [
            'Literature anthologies',
            'Informational texts',
            'Online databases',
          ],
          assessmentCriteria: [
            'Reading comprehension tests',
            'Text analysis essays',
            'Book reports',
          ],
          difficulty: 'intermediate',
        },
      ],
      skills: [
        'Reading comprehension',
        'Writing skills',
        'Speaking and listening',
        'Language conventions',
      ],
      assessmentMethods: [
        'Standardized tests',
        'Writing assignments',
        'Oral presentations',
        'Portfolio',
      ],
      resources: [
        'Textbooks',
        'Literature',
        'Online resources',
        'Writing guides',
      ],
    },
    {
      id: 'us-mathematics',
      name: 'Mathematics',
      description:
        'Core subject covering number operations, algebra, geometry, and statistics',
      topics: [
        {
          id: 'us-math-operations',
          name: 'Operations and Algebraic Thinking',
          description: 'Number operations and algebraic concepts',
          learningObjectives: [
            'Perform operations with numbers',
            'Understand patterns',
            'Solve problems',
          ],
          activities: [
            'Problem solving',
            'Pattern recognition',
            'Mathematical games',
          ],
          resources: ['Math textbooks', 'Manipulatives', 'Online tools'],
          assessmentCriteria: [
            'Math tests',
            'Problem solving tasks',
            'Performance assessments',
          ],
          difficulty: 'intermediate',
        },
      ],
      skills: [
        'Number operations',
        'Algebra',
        'Geometry',
        'Statistics',
        'Problem solving',
      ],
      assessmentMethods: [
        'Standardized tests',
        'Problem solving tasks',
        'Performance assessments',
      ],
      resources: [
        'Textbooks',
        'Online resources',
        'Math manipulatives',
        'Calculators',
      ],
    },
  ],
  assessmentMethods: [
    'Standardized tests',
    'Teacher assessment',
    'Portfolio',
    'Performance tasks',
    'Projects',
  ],
  learningOutcomes: [
    {
      id: 'us-college-readiness',
      category: 'College and Career Readiness',
      outcomes: [
        'Demonstrate independence',
        'Build strong content knowledge',
        'Respond to varying demands',
      ],
      assessmentMethods: [
        'Standardized tests',
        'Portfolio assessment',
        'Performance tasks',
      ],
      gradeLevel: 'High school',
    },
  ],
};

// India Academic Standards
const indiaAcademicStandard: AcademicStandard = {
  country: 'India',
  name: 'National Education Policy (NEP) 2020',
  description:
    'Comprehensive framework for education in India focusing on holistic development and skill-based learning.',
  gradeLevels: [
    {
      id: 'india-foundation',
      name: 'Foundation Stage (Pre-Primary)',
      ageRange: '3-6 years',
      description: 'Early childhood care and education',
      subjects: [],
      keySkills: [
        'Early literacy',
        'Numeracy',
        'Social skills',
        'Physical development',
      ],
      assessmentCriteria: [
        'Continuous assessment',
        'Portfolio',
        'Teacher observation',
      ],
    },
    {
      id: 'india-preparatory',
      name: 'Preparatory Stage (Grades 1-2)',
      ageRange: '6-8 years',
      description: 'Basic literacy and numeracy',
      subjects: [],
      keySkills: [
        'Reading',
        'Writing',
        'Mathematics',
        'Environmental awareness',
      ],
      assessmentCriteria: [
        'Continuous assessment',
        'Portfolio',
        'Teacher observation',
      ],
    },
    {
      id: 'india-middle',
      name: 'Middle Stage (Grades 3-5)',
      ageRange: '8-11 years',
      description: 'Core subjects and experiential learning',
      subjects: [],
      keySkills: [
        'Core subjects',
        'Experiential learning',
        'Critical thinking',
        'Creativity',
      ],
      assessmentCriteria: [
        'Continuous assessment',
        'Portfolio',
        'Subject-specific tests',
      ],
    },
    {
      id: 'india-secondary',
      name: 'Secondary Stage (Grades 6-8)',
      ageRange: '11-14 years',
      description: 'Subject specialization and skill development',
      subjects: [],
      keySkills: [
        'Subject knowledge',
        'Critical thinking',
        'Problem solving',
        'Life skills',
      ],
      assessmentCriteria: [
        'Continuous assessment',
        'Portfolio',
        'Subject tests',
      ],
    },
    {
      id: 'india-higher-secondary',
      name: 'Higher Secondary (Grades 9-12)',
      ageRange: '14-18 years',
      description: 'Specialized streams and career preparation',
      subjects: [],
      keySkills: [
        'Specialized knowledge',
        'Career preparation',
        'Higher order thinking',
        'Life skills',
      ],
      assessmentCriteria: ['Board exams', 'Continuous assessment', 'Portfolio'],
    },
  ],
  subjects: [
    {
      id: 'india-english',
      name: 'English',
      description:
        'Core language subject with focus on communication and literature',
      topics: [
        {
          id: 'india-english-communication',
          name: 'Communication Skills',
          description: 'Speaking, listening, reading, and writing in English',
          learningObjectives: [
            'Communicate effectively',
            'Understand texts',
            'Express ideas clearly',
          ],
          activities: [
            'Conversation practice',
            'Reading comprehension',
            'Writing exercises',
          ],
          resources: [
            'English textbooks',
            'Literature',
            'Audio-visual materials',
          ],
          assessmentCriteria: [
            'Speaking tests',
            'Reading tests',
            'Writing assignments',
          ],
          difficulty: 'intermediate',
        },
      ],
      skills: [
        'Communication',
        'Reading comprehension',
        'Writing skills',
        'Grammar',
      ],
      assessmentMethods: [
        'Continuous assessment',
        'Portfolio',
        'Speaking tests',
        'Written tests',
      ],
      resources: [
        'Textbooks',
        'Literature',
        'Online resources',
        'Audio-visual materials',
      ],
    },
    {
      id: 'india-mathematics',
      name: 'Mathematics',
      description:
        'Core subject with focus on logical thinking and problem solving',
      topics: [
        {
          id: 'india-math-logical',
          name: 'Logical Thinking and Problem Solving',
          description: 'Mathematical reasoning and problem-solving strategies',
          learningObjectives: [
            'Develop logical thinking',
            'Solve mathematical problems',
            'Apply concepts',
          ],
          activities: [
            'Problem solving',
            'Mathematical games',
            'Real-world applications',
          ],
          resources: ['Math textbooks', 'Manipulatives', 'Online tools'],
          assessmentCriteria: [
            'Problem solving tests',
            'Logical reasoning tests',
            'Performance tasks',
          ],
          difficulty: 'intermediate',
        },
      ],
      skills: [
        'Number operations',
        'Algebra',
        'Geometry',
        'Logical thinking',
        'Problem solving',
      ],
      assessmentMethods: [
        'Continuous assessment',
        'Problem solving tests',
        'Performance tasks',
      ],
      resources: [
        'Textbooks',
        'Online resources',
        'Math manipulatives',
        'Real-world examples',
      ],
    },
  ],
  assessmentMethods: [
    'Continuous assessment',
    'Portfolio',
    'Board exams',
    'Performance tasks',
    'Project work',
  ],
  learningOutcomes: [
    {
      id: 'india-holistic',
      category: 'Holistic Development',
      outcomes: [
        'Academic excellence',
        'Life skills',
        'Values',
        'Physical development',
      ],
      assessmentMethods: [
        'Continuous assessment',
        'Portfolio',
        'Performance tasks',
      ],
      gradeLevel: 'All levels',
    },
  ],
};

// Homeschooling Options Data
const homeschoolingOptions: HomeschoolingOptions = {
  socialization: [
    {
      id: 'homeschool-coop',
      name: 'Homeschool Co-op',
      description:
        'Regular meetups with other homeschooling families for group learning and social interaction',
      frequency: 'weekly',
      groupSize: 'medium',
      ageGroups: ['5-8', '9-12', '13-16'],
      activities: [
        'Group projects',
        'Field trips',
        'Sports activities',
        'Art classes',
      ],
      benefits: [
        'Social interaction',
        'Group learning',
        'Shared resources',
        'Parent support',
      ],
      requirements: [
        'Regular attendance',
        'Parent involvement',
        'Contribution to activities',
      ],
      cost: 'low',
      location: 'local',
    },
    {
      id: 'online-communities',
      name: 'Online Homeschool Communities',
      description:
        'Virtual communities for homeschoolers to connect, share resources, and participate in online activities',
      frequency: 'daily',
      groupSize: 'large',
      ageGroups: ['All ages'],
      activities: [
        'Online discussions',
        'Virtual field trips',
        'Webinars',
        'Resource sharing',
      ],
      benefits: [
        'Global connections',
        '24/7 access',
        'Diverse perspectives',
        'Resource sharing',
      ],
      requirements: [
        'Internet access',
        'Parent supervision',
        'Online safety awareness',
      ],
      cost: 'free',
      location: 'online',
    },
    {
      id: 'local-clubs',
      name: 'Local Clubs and Organizations',
      description:
        'Participation in local clubs like Scouts, 4-H, sports teams, or community organizations',
      frequency: 'weekly',
      groupSize: 'medium',
      ageGroups: ['6-18'],
      activities: [
        'Scouting activities',
        '4-H projects',
        'Sports',
        'Community service',
      ],
      benefits: [
        'Leadership skills',
        'Community involvement',
        'Skill development',
        'Social interaction',
      ],
      requirements: [
        'Membership fees',
        'Regular attendance',
        'Parent involvement',
      ],
      cost: 'low',
      location: 'local',
    },
    {
      id: 'library-programs',
      name: 'Library Programs',
      description:
        'Regular participation in library reading programs, book clubs, and educational events',
      frequency: 'weekly',
      groupSize: 'small',
      ageGroups: ['3-18'],
      activities: [
        'Reading programs',
        'Book clubs',
        'Educational workshops',
        'Story time',
      ],
      benefits: [
        'Love of reading',
        'Social interaction',
        'Educational enrichment',
        'Free resources',
      ],
      requirements: ['Library membership', 'Regular attendance'],
      cost: 'free',
      location: 'local',
    },
  ],
  physicalEducation: [
    {
      id: 'home-fitness',
      name: 'Home Fitness Program',
      description:
        'Structured fitness activities that can be done at home with minimal equipment',
      frequency: 'daily',
      duration: '30-60 minutes',
      ageGroups: ['5-18'],
      skills: [
        'Cardiovascular fitness',
        'Strength training',
        'Flexibility',
        'Coordination',
      ],
      equipment: [
        'Exercise mat',
        'Resistance bands',
        'Jump rope',
        'Weights (optional)',
      ],
      benefits: [
        'Physical fitness',
        'Mental health',
        'Discipline',
        'Cost-effective',
      ],
      requirements: [
        'Space for exercise',
        'Basic equipment',
        'Parent guidance',
      ],
      cost: 'low',
      location: 'home',
    },
    {
      id: 'local-sports',
      name: 'Local Sports Programs',
      description:
        'Participation in community sports programs, leagues, or classes',
      frequency: 'weekly',
      duration: '1-2 hours',
      ageGroups: ['5-18'],
      skills: [
        'Team sports',
        'Individual sports',
        'Coordination',
        'Sportsmanship',
      ],
      equipment: [
        'Sport-specific equipment',
        'Appropriate clothing',
        'Safety gear',
      ],
      benefits: [
        'Physical fitness',
        'Teamwork',
        'Social skills',
        'Competition',
      ],
      requirements: ['Registration fees', 'Equipment', 'Regular attendance'],
      cost: 'medium',
      location: 'local',
    },
    {
      id: 'outdoor-activities',
      name: 'Outdoor Activities',
      description:
        'Regular outdoor activities like hiking, biking, swimming, or nature exploration',
      frequency: 'weekly',
      duration: '1-3 hours',
      ageGroups: ['3-18'],
      skills: [
        'Outdoor skills',
        'Environmental awareness',
        'Physical fitness',
        'Navigation',
      ],
      equipment: ['Appropriate clothing', 'Safety gear', 'Navigation tools'],
      benefits: [
        'Physical fitness',
        'Nature connection',
        'Adventure skills',
        'Family bonding',
      ],
      requirements: [
        'Access to outdoor spaces',
        'Weather-appropriate clothing',
        'Safety awareness',
      ],
      cost: 'low',
      location: 'outdoor',
    },
    {
      id: 'dance-classes',
      name: 'Dance Classes',
      description:
        'Structured dance instruction in various styles like ballet, jazz, hip-hop, or cultural dance',
      frequency: 'weekly',
      duration: '45-90 minutes',
      ageGroups: ['3-18'],
      skills: ['Rhythm', 'Coordination', 'Expression', 'Cultural awareness'],
      equipment: ['Dance shoes', 'Appropriate clothing', 'Space for practice'],
      benefits: [
        'Physical fitness',
        'Artistic expression',
        'Cultural appreciation',
        'Confidence',
      ],
      requirements: ['Class fees', 'Equipment', 'Regular attendance'],
      cost: 'medium',
      location: 'local',
    },
  ],
  extracurricular: [
    {
      id: 'art-classes',
      name: 'Art Classes',
      description:
        'Structured art instruction in various mediums like drawing, painting, sculpture, or digital art',
      frequency: 'weekly',
      category: 'arts',
      ageGroups: ['5-18'],
      activities: [
        'Drawing',
        'Painting',
        'Sculpture',
        'Digital art',
        'Art history',
      ],
      skills: [
        'Creativity',
        'Fine motor skills',
        'Artistic expression',
        'Art appreciation',
      ],
      benefits: [
        'Creativity',
        'Self-expression',
        'Fine motor skills',
        'Cultural appreciation',
      ],
      requirements: ['Art supplies', 'Class fees', 'Space for projects'],
      cost: 'medium',
      location: 'local',
    },
    {
      id: 'music-lessons',
      name: 'Music Lessons',
      description:
        'Individual or group music instruction in instruments, voice, or music theory',
      frequency: 'weekly',
      category: 'music',
      ageGroups: ['5-18'],
      activities: [
        'Instrument lessons',
        'Voice training',
        'Music theory',
        'Ensemble playing',
      ],
      skills: [
        'Musical skills',
        'Rhythm',
        'Coordination',
        'Musical appreciation',
      ],
      benefits: [
        'Musical skills',
        'Cognitive development',
        'Discipline',
        'Cultural appreciation',
      ],
      requirements: ['Instrument', 'Lesson fees', 'Practice time'],
      cost: 'medium',
      location: 'local',
    },
    {
      id: 'coding-club',
      name: 'Coding and Technology Club',
      description:
        'Learning programming, robotics, and technology skills through structured activities',
      frequency: 'weekly',
      category: 'technology',
      ageGroups: ['8-18'],
      activities: ['Programming', 'Robotics', 'Web development', 'Game design'],
      skills: [
        'Programming',
        'Problem solving',
        'Logical thinking',
        'Creativity',
      ],
      benefits: [
        'Technology skills',
        'Problem solving',
        'Future career preparation',
        'Creativity',
      ],
      requirements: ['Computer access', 'Software', 'Class fees'],
      cost: 'medium',
      location: 'hybrid',
    },
  ],
  communityInvolvement: [
    {
      id: 'volunteering',
      name: 'Community Volunteering',
      description:
        'Regular volunteer work at local organizations, charities, or community events',
      frequency: 'monthly',
      category: 'volunteering',
      ageGroups: ['10-18'],
      activities: [
        'Food bank assistance',
        'Animal shelter help',
        'Community clean-up',
        'Event support',
      ],
      benefits: [
        'Community service',
        'Empathy',
        'Leadership skills',
        'Social responsibility',
      ],
      requirements: [
        'Parent supervision',
        'Age-appropriate activities',
        'Regular commitment',
      ],
      cost: 'free',
      location: 'local',
    },
    {
      id: 'religious-education',
      name: 'Religious Education',
      description:
        'Participation in religious education programs, youth groups, or faith-based activities',
      frequency: 'weekly',
      category: 'religious',
      ageGroups: ['5-18'],
      activities: [
        'Religious education',
        'Youth groups',
        'Community service',
        'Cultural events',
      ],
      benefits: [
        'Spiritual development',
        'Community connection',
        'Values education',
        'Social interaction',
      ],
      requirements: [
        'Religious affiliation',
        'Regular attendance',
        'Parent involvement',
      ],
      cost: 'low',
      location: 'local',
    },
  ],
};

class AcademicStandardsService {
  private static instance: AcademicStandardsService;

  private constructor() {}

  static getInstance(): AcademicStandardsService {
    if (!AcademicStandardsService.instance) {
      AcademicStandardsService.instance = new AcademicStandardsService();
    }
    return AcademicStandardsService.instance;
  }

  /**
   * Get academic standard for a specific country
   */
  getAcademicStandard(country: Country): AcademicStandard {
    switch (country) {
      case 'UK':
        return ukAcademicStandard;
      case 'US':
        return usAcademicStandard;
      case 'India':
        return indiaAcademicStandard;
      default:
        throw new Error(`Academic standard not found for country: ${country}`);
    }
  }

  /**
   * Get all available countries
   */
  getAvailableCountries(): Country[] {
    return ['UK', 'US', 'India'];
  }

  /**
   * Get grade levels for a specific country
   */
  getGradeLevels(country: Country): GradeLevel[] {
    const standard = this.getAcademicStandard(country);
    return standard.gradeLevels;
  }

  /**
   * Get subjects for a specific country
   */
  getSubjects(country: Country): Subject[] {
    const standard = this.getAcademicStandard(country);
    return standard.subjects;
  }

  /**
   * Get subjects for a specific grade level and country
   */
  getSubjectsForGrade(country: Country, gradeId: string): Subject[] {
    const standard = this.getAcademicStandard(country);
    const gradeLevel = standard.gradeLevels.find(grade => grade.id === gradeId);
    return gradeLevel ? gradeLevel.subjects : standard.subjects;
  }

  /**
   * Get all homeschooling options
   */
  getHomeschoolingOptions(): HomeschoolingOptions {
    return homeschoolingOptions;
  }

  /**
   * Get socialization options
   */
  getSocializationOptions(): SocializationOption[] {
    return homeschoolingOptions.socialization;
  }

  /**
   * Get physical education options
   */
  getPhysicalEducationOptions(): PhysicalEducationOption[] {
    return homeschoolingOptions.physicalEducation;
  }

  /**
   * Get extracurricular options
   */
  getExtracurricularOptions(): ExtracurricularOption[] {
    return homeschoolingOptions.extracurricular;
  }

  /**
   * Get community involvement options
   */
  getCommunityInvolvementOptions(): CommunityInvolvementOption[] {
    return homeschoolingOptions.communityInvolvement;
  }

  /**
   * Get options filtered by age group
   */
  getOptionsByAgeGroup(
    age: number,
    category: keyof HomeschoolingOptions
  ): any[] {
    const options = homeschoolingOptions[category];
    return options.filter(option =>
      option.ageGroups.some(ageGroup => {
        const [min, max] = ageGroup.split('-').map(Number);
        return age >= min && age <= max;
      })
    );
  }

  /**
   * Get options filtered by cost
   */
  getOptionsByCost(
    cost: 'free' | 'low' | 'medium' | 'high',
    category: keyof HomeschoolingOptions
  ): any[] {
    const options = homeschoolingOptions[category];
    return options.filter(option => option.cost === cost);
  }

  /**
   * Get recommended options based on student profile
   */
  getRecommendedOptions(
    studentAge: number,
    country: Country,
    interests: string[]
  ): {
    socialization: SocializationOption[];
    physicalEducation: PhysicalEducationOption[];
    extracurricular: ExtracurricularOption[];
    communityInvolvement: CommunityInvolvementOption[];
  } {
    return {
      socialization: this.getOptionsByAgeGroup(studentAge, 'socialization'),
      physicalEducation: this.getOptionsByAgeGroup(
        studentAge,
        'physicalEducation'
      ),
      extracurricular: this.getOptionsByAgeGroup(studentAge, 'extracurricular'),
      communityInvolvement: this.getOptionsByAgeGroup(
        studentAge,
        'communityInvolvement'
      ),
    };
  }
}

// Export singleton instance
export const academicStandardsService = AcademicStandardsService.getInstance();
export default AcademicStandardsService;
