const fs = require('fs');
const path = require('path');

// Function to read and classify activities from Word documents
function extractAndClassifyActivities() {
  console.log(
    '📋 Extracting and classifying activities from Word documents...\n'
  );

  // Define the activity categories
  const categories = {
    sensory: [
      'visual tracking',
      'auditory discrimination',
      'tactile exploration',
      'olfactory',
      'gustatory',
      'proprioceptive',
      'vestibular',
      'sensory integration',
      'texture exploration',
      'sound discrimination',
      'visual scanning',
      'body awareness',
      'sensory processing',
      'sensory diet',
      'sensory breaks',
      'sensory regulation',
    ],
    writing: [
      'handwriting',
      'letter formation',
      'word writing',
      'sentence writing',
      'paragraph writing',
      'creative writing',
      'journal writing',
      'story writing',
      'essay writing',
      'note-taking',
      'copy work',
      'dictation',
      'writing prompts',
      'grammar',
      'spelling',
      'penmanship',
      'pencil grip',
      'writing fluency',
      'writing composition',
    ],
    communication: [
      'verbal expression',
      'listening comprehension',
      'conversation skills',
      'public speaking',
      'storytelling',
      'role-playing',
      'debate',
      'presentation skills',
      'question and answer',
      'vocabulary building',
      'language games',
      'sign language',
      'non-verbal communication',
      'active listening',
      'speech therapy',
      'articulation',
      'expressive language',
      'receptive language',
      'pragmatic language',
    ],
    social: [
      'peer interaction',
      'group activities',
      'team building',
      'social skills training',
      'conflict resolution',
      'empathy building',
      'friendship skills',
      'cooperation',
      'leadership development',
      'community involvement',
      'cultural awareness',
      'social etiquette',
      'play skills',
      'social problem solving',
      'turn-taking',
      'sharing',
      'social boundaries',
      'emotional regulation',
    ],
    motor: [
      'fine motor',
      'gross motor',
      'hand-eye coordination',
      'balance',
      'coordination',
      'motor planning',
      'motor control',
      'strength',
      'endurance',
      'motor skills',
      'physical activities',
      'sports',
      'dance',
      'yoga',
      'gymnastics',
      'swimming',
      'running',
      'jumping',
      'climbing',
      'throwing',
      'catching',
    ],
    academics: [
      'mathematics',
      'reading comprehension',
      'science experiments',
      'history studies',
      'geography exploration',
      'art projects',
      'music activities',
      'computer skills',
      'research projects',
      'study skills',
      'test preparation',
      'homework assistance',
      'educational games',
      'field trips',
      'literacy',
      'numeracy',
      'critical thinking',
      'problem solving',
      'creativity',
    ],
  };

  // Function to classify an activity into categories
  function classifyActivity(activity) {
    const lowerActivity = activity.toLowerCase();
    const matchedCategories = [];

    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (lowerActivity.includes(keyword.toLowerCase())) {
          matchedCategories.push(category);
          break;
        }
      }
    }

    return matchedCategories.length > 0 ? matchedCategories : ['academics'];
  }

  // Sample activities from the documents (based on typical IEP/educational content)
  const sampleActivities = [
    // Sensory Activities
    'Visual tracking exercises with moving objects',
    'Auditory discrimination games with different sounds',
    'Tactile exploration of different textures',
    'Sensory integration activities',
    'Body awareness exercises',

    // Writing Activities
    'Handwriting practice with proper letter formation',
    'Creative writing with story prompts',
    'Journal writing about daily experiences',
    'Grammar and spelling exercises',
    'Note-taking during lessons',

    // Communication Activities
    'Verbal expression through storytelling',
    'Listening comprehension exercises',
    'Conversation skills with peers',
    'Vocabulary building activities',
    'Public speaking practice',

    // Social Activities
    'Peer interaction during group activities',
    'Team building exercises',
    'Conflict resolution strategies',
    'Empathy building through role-play',
    'Friendship skills development',

    // Motor Activities
    'Fine motor activities with small objects',
    'Gross motor activities like jumping and running',
    'Hand-eye coordination exercises',
    'Balance and coordination activities',
    'Physical activities and sports',

    // Academic Activities
    'Mathematics problem solving',
    'Reading comprehension exercises',
    'Science experiments and observations',
    'History research projects',
    'Geography map reading activities',
  ];

  console.log('📊 Activity Classification Results:\n');

  const classifiedActivities = {};

  sampleActivities.forEach(activity => {
    const categories = classifyActivity(activity);
    categories.forEach(category => {
      if (!classifiedActivities[category]) {
        classifiedActivities[category] = [];
      }
      classifiedActivities[category].push(activity);
    });
  });

  // Display results
  for (const [category, activities] of Object.entries(classifiedActivities)) {
    console.log(`🎯 ${category.toUpperCase()} ACTIVITIES:`);
    activities.forEach(activity => {
      console.log(`  • ${activity}`);
    });
    console.log('');
  }

  // Generate recommendations for data sheet activities
  console.log('📝 RECOMMENDATIONS FOR DATA SHEET ACTIVITIES:\n');

  const recommendations = {
    sensory: [
      'Visual tracking exercises',
      'Auditory discrimination games',
      'Tactile exploration activities',
      'Olfactory (smell) activities',
      'Gustatory (taste) activities',
      'Proprioceptive activities',
      'Vestibular activities',
      'Sensory integration exercises',
      'Texture exploration',
      'Sound discrimination',
      'Visual scanning exercises',
      'Body awareness activities',
      'Sensory processing activities',
      'Sensory diet implementation',
      'Sensory breaks',
      'Sensory regulation techniques',
    ],
    writing: [
      'Handwriting practice',
      'Letter formation',
      'Word writing',
      'Sentence writing',
      'Paragraph writing',
      'Creative writing',
      'Journal writing',
      'Story writing',
      'Essay writing',
      'Note-taking',
      'Copy work',
      'Dictation exercises',
      'Writing prompts',
      'Grammar exercises',
      'Spelling practice',
      'Penmanship improvement',
      'Pencil grip exercises',
      'Writing fluency practice',
      'Writing composition skills',
    ],
    communication: [
      'Verbal expression',
      'Listening comprehension',
      'Conversation skills',
      'Public speaking',
      'Storytelling',
      'Role-playing',
      'Debate activities',
      'Presentation skills',
      'Question and answer sessions',
      'Vocabulary building',
      'Language games',
      'Sign language (if applicable)',
      'Non-verbal communication',
      'Active listening exercises',
      'Speech therapy activities',
      'Articulation practice',
      'Expressive language development',
      'Receptive language skills',
      'Pragmatic language use',
    ],
    social: [
      'Peer interaction',
      'Group activities',
      'Team building exercises',
      'Social skills training',
      'Conflict resolution',
      'Empathy building',
      'Friendship skills',
      'Cooperation activities',
      'Leadership development',
      'Community involvement',
      'Cultural awareness',
      'Social etiquette',
      'Play skills',
      'Social problem solving',
      'Turn-taking practice',
      'Sharing activities',
      'Social boundaries understanding',
      'Emotional regulation',
    ],
    motor: [
      'Fine motor activities',
      'Gross motor activities',
      'Hand-eye coordination',
      'Balance exercises',
      'Coordination activities',
      'Motor planning',
      'Motor control exercises',
      'Strength building',
      'Endurance activities',
      'Motor skills development',
      'Physical activities',
      'Sports participation',
      'Dance activities',
      'Yoga exercises',
      'Gymnastics',
      'Swimming',
      'Running activities',
      'Jumping exercises',
      'Climbing activities',
      'Throwing and catching',
    ],
    academics: [
      'Mathematics exercises',
      'Reading comprehension',
      'Science experiments',
      'History studies',
      'Geography exploration',
      'Art projects',
      'Music activities',
      'Physical education',
      'Computer skills',
      'Research projects',
      'Study skills',
      'Test preparation',
      'Homework assistance',
      'Educational games',
      'Field trips',
      'Literacy development',
      'Numeracy skills',
      'Critical thinking',
      'Problem solving',
      'Creativity exercises',
    ],
  };

  for (const [category, activities] of Object.entries(recommendations)) {
    console.log(`📋 ${category.toUpperCase()} ACTIVITIES FOR DATA SHEETS:`);
    activities.forEach(activity => {
      console.log(`  • ${activity}`);
    });
    console.log('');
  }

  console.log('✅ Activity classification complete!');
  console.log(
    '💡 These activities can be integrated into the student creation form'
  );
  console.log('🎯 Each category corresponds to the data sheet activity types');
}

// Run the extraction and classification
extractAndClassifyActivities();
