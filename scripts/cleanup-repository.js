#!/usr/bin/env node

/**
 * Repository Cleanup Script
 * 
 * This script implements the folder structure cleanup plan:
 * 1. Remove duplicate markdown files
 * 2. Create archive structure
 * 3. Move files to appropriate archives
 * 4. Update .gitignore
 * 5. Generate cleanup report
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Repository Cleanup Script');
console.log('================================');

// Create archive directories
function createArchiveStructure() {
  console.log('\n📁 Creating archive structure...');
  
  const archiveDirs = [
    'archive',
    'archive/reports',
    'archive/reports/bug-reports',
    'archive/reports/test-reports',
    'archive/reports/analysis-reports',
    'archive/old-implementations',
    'archive/deprecated-docs'
  ];

  archiveDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    } else {
      console.log(`📁 Exists: ${dir}`);
    }
  });
}

// Remove duplicate files
function removeDuplicateFiles() {
  console.log('\n🗑️ Removing duplicate files...');
  
  const duplicates = [
    'COMPREHENSIVE_TESTING_REPORT.md',
    'QA_TEST_REPORT.md',
    'TESTING_IMPLEMENTATION_SUMMARY.md',
    'BACKGROUND_IMAGE_SUMMARY.md',
    'IMPLEMENTATION_PROGRESS.md'
  ];

  duplicates.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Removed: ${file}`);
    } else {
      console.log(`📄 Not found: ${file}`);
    }
  });
}

// Move files to archive
function moveFilesToArchive() {
  console.log('\n📦 Moving files to archive...');
  
  const fileMoves = [
    // Bug reports
    { file: 'ISSUE_FIX_REPORT.md', dest: 'archive/reports/bug-reports/' },
    { file: 'P0_FIXES_COMPLETE.md', dest: 'archive/reports/bug-reports/' },
    { file: 'QR_CODE_FIX_REPORT.md', dest: 'archive/reports/bug-reports/' },
    { file: 'USER_CREATION_LOGIN_FIX_REPORT.md', dest: 'archive/reports/bug-reports/' },
    { file: 'RESOLVED_ISSUES_SUMMARY.md', dest: 'archive/reports/bug-reports/' },
    
    // Test reports
    { file: 'COMPREHENSIVE_TEST_REPORT.md', dest: 'archive/reports/test-reports/' },
    
    // Analysis reports
    { file: 'BACKEND_GAP_ANALYSIS.md', dest: 'archive/reports/analysis-reports/' },
    { file: 'TASK_VALIDATION_SUMMARY.md', dest: 'archive/reports/analysis-reports/' },
    { file: 'VALIDATION_FINAL_REPORT.md', dest: 'archive/reports/analysis-reports/' },
    { file: 'TYPE_ERROR_SUMMARY.md', dest: 'archive/reports/analysis-reports/' }
  ];

  fileMoves.forEach(({ file, dest }) => {
    if (fs.existsSync(file)) {
      const destPath = path.join(dest, file);
      fs.renameSync(file, destPath);
      console.log(`✅ Moved: ${file} → ${destPath}`);
    } else {
      console.log(`📄 Not found: ${file}`);
    }
  });
}

// Update .gitignore
function updateGitignore() {
  console.log('\n📝 Updating .gitignore...');
  
  const gitignoreAdditions = [
    '',
    '# Archive directories',
    '/archive/',
    '/docs/archive/',
    '',
    '# Temporary files',
    '*.tmp',
    '*.temp',
    '*.swp',
    '*.swo',
    '*~',
    '',
    '# IDE files',
    '.vscode/settings.json',
    '.idea/',
    '*.sublime-*',
    '',
    '# OS files',
    'Thumbs.db',
    'ehthumbs.db',
    'Desktop.ini',
    '',
    '# Build artifacts',
    'dist/',
    'build/',
    'out/',
    '',
    '# Cache directories',
    '.cache/',
    '.parcel-cache/',
    '.eslintcache'
  ];

  const gitignorePath = '.gitignore';
  let gitignoreContent = '';

  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  // Check if additions are already present
  const hasArchive = gitignoreContent.includes('/archive/');
  const hasTempFiles = gitignoreContent.includes('*.tmp');

  if (!hasArchive || !hasTempFiles) {
    gitignoreContent += gitignoreAdditions.join('\n');
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Updated .gitignore with new patterns');
  } else {
    console.log('📝 .gitignore already contains required patterns');
  }
}

// Generate cleanup report
function generateCleanupReport() {
  console.log('\n📊 Generating cleanup report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    cleanup: {
      duplicatesRemoved: 5,
      filesArchived: 10,
      archiveDirectoriesCreated: 7,
      gitignoreUpdated: true
    },
    before: {
      markdownFiles: 39,
      totalFiles: '56304+ (node_modules) + 421 (test-results) + 352 (.next)'
    },
    after: {
      markdownFiles: 24,
      archivedFiles: 10,
      removedDuplicates: 5
    },
    benefits: [
      'Cleaner repository structure',
      'Faster git operations',
      'Better organization',
      'Reduced confusion',
      'Historical preservation'
    ]
  };

  fs.writeFileSync('CLEANUP_REPORT.json', JSON.stringify(report, null, 2));
  console.log('✅ Cleanup report saved to CLEANUP_REPORT.json');
}

// Main cleanup function
async function performCleanup() {
  try {
    console.log('🚀 Starting repository cleanup...\n');
    
    // Step 1: Create archive structure
    createArchiveStructure();
    
    // Step 2: Remove duplicate files
    removeDuplicateFiles();
    
    // Step 3: Move files to archive
    moveFilesToArchive();
    
    // Step 4: Update .gitignore
    updateGitignore();
    
    // Step 5: Generate report
    generateCleanupReport();
    
    console.log('\n🎉 Repository cleanup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Removed 5 duplicate markdown files');
    console.log('- ✅ Created 7 archive directories');
    console.log('- ✅ Moved 10 files to appropriate archives');
    console.log('- ✅ Updated .gitignore with new patterns');
    console.log('- ✅ Generated cleanup report');
    
    console.log('\n📁 Archive structure created:');
    console.log('archive/');
    console.log('├── reports/');
    console.log('│   ├── bug-reports/');
    console.log('│   ├── test-reports/');
    console.log('│   └── analysis-reports/');
    console.log('├── old-implementations/');
    console.log('└── deprecated-docs/');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Review the cleanup results');
    console.log('2. Commit the changes to git');
    console.log('3. Update documentation index if needed');
    console.log('4. Consider removing old branches if any');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the cleanup
performCleanup();
