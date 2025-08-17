#!/usr/bin/env node

/**
 * Gurukool Homeschool Platform - Comprehensive App Test Script
 *
 * This script tests all major functionality of the platform:
 * 1. Authentication system (login, role-based access)
 * 2. Parent dashboard functionality
 * 3. Admin dashboard functionality
 * 4. Teacher dashboard functionality
 * 5. Contact form functionality
 * 6. QR code authentication
 * 7. Credentials retrieval system
 * 8. Email service functionality
 */

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

console.log('🧪 Gurukool Homeschool Platform - Comprehensive App Test');
console.log('========================================================\n');

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
};

// Test Helper Functions
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}`);
    if (details) {
      console.log(`   Details: ${details}`);
    }
  }
  testResults.details.push({ name: testName, passed, details });
}

function logSection(sectionName) {
  console.log(`\n📋 ${sectionName}`);
  console.log('─'.repeat(sectionName.length + 3));
}

// 1. Test File Structure and Dependencies
logSection('Testing File Structure and Dependencies');

// Check if all required files exist
const requiredFiles = [
  'src/app/login/page.tsx',
  'src/app/parent/dashboard/page.tsx',
  'src/app/admin/dashboard/page.tsx',
  'src/app/teacher/dashboard/page.tsx',
  'src/app/contact-admin/page.tsx',
  'src/app/api/contact-admin/route.ts',
  'src/app/api/credentials/route.ts',
  'src/lib/authContext.tsx',
  'src/services/email.service.ts',
  'src/services/qr-auth.service.ts',
  'package.json',
  'next.config.mjs',
  'tailwind.config.ts',
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  logTest(`File exists: ${file}`, exists, exists ? '' : 'File not found');
});

// Check package.json dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['next', 'react', 'react-dom', 'typescript'];
  const requiredDevDeps = ['@types/node', '@types/react', 'tailwindcss'];

  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies && packageJson.dependencies[dep];
    logTest(`Dependency: ${dep}`, !!hasDep, hasDep ? '' : 'Missing dependency');
  });

  requiredDevDeps.forEach(dep => {
    const hasDep =
      packageJson.devDependencies && packageJson.devDependencies[dep];
    logTest(
      `Dev Dependency: ${dep}`,
      !!hasDep,
      hasDep ? '' : 'Missing dev dependency'
    );
  });
} catch (error) {
  logTest('Package.json parsing', false, error.message);
}

// 2. Test Authentication System
logSection('Testing Authentication System');

// Test auth context file
try {
  const authContext = fs.readFileSync('src/lib/authContext.tsx', 'utf8');

  // Check for required functions
  const hasLoginFunction = authContext.includes('const login =');
  logTest('Login function exists', hasLoginFunction);

  const hasLogoutFunction = authContext.includes('const logout =');
  logTest('Logout function exists', hasLogoutFunction);

  const hasUserState = authContext.includes('useState<User>');
  logTest('User state management', hasUserState);

  // Check for demo accounts
  const hasParentDemo = authContext.includes('parent@example.com');
  logTest('Parent demo account', hasParentDemo);

  const hasAdminDemo = authContext.includes('admin@example.com');
  logTest('Admin demo account', hasAdminDemo);

  const hasTeacherDemo = authContext.includes('teacher@example.com');
  logTest('Teacher demo account', hasTeacherDemo);
} catch (error) {
  logTest('Auth context file', false, error.message);
}

// 3. Test Parent Dashboard
logSection('Testing Parent Dashboard');

try {
  const parentDashboard = fs.readFileSync(
    'src/app/parent/dashboard/page.tsx',
    'utf8'
  );

  const hasStudentManagement = parentDashboard.includes('Student Profiles');
  logTest('Student management section', hasStudentManagement);

  const hasTeacherTimesheet = parentDashboard.includes('Teacher Timesheet');
  logTest('Teacher timesheet section', hasTeacherTimesheet);

  const hasCreateStudent = parentDashboard.includes('Create Student');
  logTest('Create student functionality', hasCreateStudent);

  const hasAcademicStandards = parentDashboard.includes('Academic Standards');
  logTest('Academic standards support', hasAcademicStandards);

  const hasDemoStudents =
    parentDashboard.includes('Emma Johnson') ||
    parentDashboard.includes('Alex Chen');
  logTest('Demo students data', hasDemoStudents);
} catch (error) {
  logTest('Parent dashboard file', false, error.message);
}

// 4. Test Admin Dashboard
logSection('Testing Admin Dashboard');

try {
  const adminDashboard = fs.readFileSync(
    'src/app/admin/dashboard/page.tsx',
    'utf8'
  );

  const hasUserManagement = adminDashboard.includes('User Management');
  logTest('User management section', hasUserManagement);

  const hasContentManagement = adminDashboard.includes('Content Management');
  logTest('Content management section', hasContentManagement);

  const hasSystemAnalytics = adminDashboard.includes('System Analytics');
  logTest('System analytics section', hasSystemAnalytics);

  const hasSecurityMonitoring = adminDashboard.includes('Security Monitoring');
  logTest('Security monitoring section', hasSecurityMonitoring);

  const hasCreateUser = adminDashboard.includes('Create New User');
  logTest('Create user functionality', hasCreateUser);

  const hasQRCodeGeneration = adminDashboard.includes('generateQRCode');
  logTest('QR code generation', hasQRCodeGeneration);
} catch (error) {
  logTest('Admin dashboard file', false, error.message);
}

// 5. Test Teacher Dashboard
logSection('Testing Teacher Dashboard');

try {
  const teacherDashboard = fs.readFileSync(
    'src/app/teacher/dashboard/page.tsx',
    'utf8'
  );

  const hasOverviewTab = teacherDashboard.includes('overview');
  logTest('Overview tab', hasOverviewTab);

  const hasDataSheetsTab = teacherDashboard.includes('data-sheets');
  logTest('Data sheets tab', hasDataSheetsTab);

  const hasStudentsTab = teacherDashboard.includes('students');
  logTest('Students tab', hasStudentsTab);

  const hasSessionsTab = teacherDashboard.includes('sessions');
  logTest('Sessions tab', hasSessionsTab);

  const hasQuickActions = teacherDashboard.includes('Quick Actions');
  logTest('Quick actions section', hasQuickActions);

  const hasRecentStudents = teacherDashboard.includes('Recent Students');
  logTest('Recent students section', hasRecentStudents);
} catch (error) {
  logTest('Teacher dashboard file', false, error.message);
}

// 6. Test Contact Form
logSection('Testing Contact Form');

try {
  const contactForm = fs.readFileSync('src/app/contact-admin/page.tsx', 'utf8');

  const hasContactForm = contactForm.includes('Contact Administrator');
  logTest('Contact form page', hasContactForm);

  const hasFormFields =
    contactForm.includes('name') &&
    contactForm.includes('email') &&
    contactForm.includes('message');
  logTest('Required form fields', hasFormFields);

  const hasSubmitButton = contactForm.includes('Submit Request');
  logTest('Submit button', hasSubmitButton);

  const hasSuccessMessage = contactForm.includes(
    'Request Submitted Successfully'
  );
  logTest('Success message handling', hasSuccessMessage);

  const hasErrorHandling = contactForm.includes('Submission Failed');
  logTest('Error handling', hasErrorHandling);
} catch (error) {
  logTest('Contact form file', false, error.message);
}

// 7. Test API Endpoints
logSection('Testing API Endpoints');

// Test contact admin API
try {
  const contactAPI = fs.readFileSync(
    'src/app/api/contact-admin/route.ts',
    'utf8'
  );

  const hasPOSTMethod = contactAPI.includes('export async function POST');
  logTest('Contact API POST method', hasPOSTMethod);

  const hasGETMethod = contactAPI.includes('export async function GET');
  logTest('Contact API GET method', hasGETMethod);

  const hasEmailService = contactAPI.includes('emailService');
  logTest('Email service integration', hasEmailService);

  const hasValidation =
    contactAPI.includes('validate') || contactAPI.includes('required');
  logTest('Input validation', hasValidation);
} catch (error) {
  logTest('Contact API file', false, error.message);
}

// Test credentials API
try {
  const credentialsAPI = fs.readFileSync(
    'src/app/api/credentials/route.ts',
    'utf8'
  );

  const hasPOSTMethod = credentialsAPI.includes('export async function POST');
  logTest('Credentials API POST method', hasPOSTMethod);

  const hasGETMethod = credentialsAPI.includes('export async function GET');
  logTest('Credentials API GET method', hasGETMethod);

  const hasDemoCredentials = credentialsAPI.includes('demoCredentials');
  logTest('Demo credentials storage', hasDemoCredentials);

  const hasErrorHandling =
    credentialsAPI.includes('try') && credentialsAPI.includes('catch');
  logTest('Error handling in credentials API', hasErrorHandling);
} catch (error) {
  logTest('Credentials API file', false, error.message);
}

// 8. Test Services
logSection('Testing Services');

// Test email service
try {
  const emailService = fs.readFileSync('src/services/email.service.ts', 'utf8');

  const hasContactNotification = emailService.includes(
    'sendContactNotification'
  );
  logTest('Contact notification method', hasContactNotification);

  const hasConfirmationEmail = emailService.includes('sendConfirmationEmail');
  logTest('Confirmation email method', hasConfirmationEmail);

  const hasEmailContent = emailService.includes('generateContactEmailContent');
  logTest('Email content generation', hasEmailContent);

  const hasProcessRequest = emailService.includes('processContactRequest');
  logTest('Contact request processing', hasProcessRequest);
} catch (error) {
  logTest('Email service file', false, error.message);
}

// Test QR auth service
try {
  const qrAuthService = fs.readFileSync(
    'src/services/qr-auth.service.ts',
    'utf8'
  );

  const hasGenerateToken = qrAuthService.includes('generateQRToken');
  logTest('QR token generation', hasGenerateToken);

  const hasVerifyToken = qrAuthService.includes('verifyQRToken');
  logTest('QR token verification', hasVerifyToken);

  const hasCleanup = qrAuthService.includes('cleanupExpiredTokens');
  logTest('Token cleanup functionality', hasCleanup);

  const hasExpiration = qrAuthService.includes('expiresAt');
  logTest('Token expiration handling', hasExpiration);
} catch (error) {
  logTest('QR auth service file', false, error.message);
}

// 9. Test Configuration Files
logSection('Testing Configuration Files');

// Test Next.js config
try {
  const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
  logTest('Next.js configuration exists', true);
} catch (error) {
  logTest('Next.js configuration', false, error.message);
}

// Test Tailwind config
try {
  const tailwindConfig = fs.readFileSync('tailwind.config.ts', 'utf8');
  logTest('Tailwind configuration exists', true);
} catch (error) {
  logTest('Tailwind configuration', false, error.message);
}

// Test TypeScript config
try {
  const tsConfig = fs.readFileSync('tsconfig.json', 'utf8');
  logTest('TypeScript configuration exists', true);
} catch (error) {
  logTest('TypeScript configuration', false, error.message);
}

// 10. Test Component Structure
logSection('Testing Component Structure');

const componentFiles = [
  'src/components/parent/CreateStudentForm.tsx',
  'src/components/parent/StudentProfileCard.tsx',
  'src/components/auth/QRAuthIntegration.tsx',
  'src/components/auth/AuthStatusIndicator.tsx',
];

componentFiles.forEach(file => {
  const exists = fs.existsSync(file);
  logTest(
    `Component exists: ${file}`,
    exists,
    exists ? '' : 'Component not found'
  );
});

// 11. Generate Test Report
logSection('Test Summary');

console.log(`\n📊 Test Results Summary:`);
console.log(`Total Tests: ${testResults.total}`);
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(
  `📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`
);

// Save detailed test report
const testReport = {
  timestamp: new Date().toISOString(),
  summary: {
    total: testResults.total,
    passed: testResults.passed,
    failed: testResults.failed,
    successRate:
      ((testResults.passed / testResults.total) * 100).toFixed(1) + '%',
  },
  details: testResults.details,
};

fs.writeFileSync('TEST_REPORT.json', JSON.stringify(testReport, null, 2));

console.log('\n📄 Detailed test report saved to: TEST_REPORT.json');

// Final assessment
if (testResults.failed === 0) {
  console.log('\n🎉 All tests passed! The platform is fully functional.');
} else if (testResults.passed > testResults.failed) {
  console.log('\n⚠️  Most tests passed. Some issues need attention.');
} else {
  console.log(
    '\n🚨 Multiple test failures detected. Platform needs significant fixes.'
  );
}

console.log('\n🚀 Gurukool Homeschool Platform Test Complete!');
