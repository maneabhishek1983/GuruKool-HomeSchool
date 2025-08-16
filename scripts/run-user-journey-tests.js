#!/usr/bin/env node

/**
 * User Journey Testing Framework
 * Comprehensive testing for Phase 2 implementation features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class UserJourneyTestRunner {
  constructor() {
    this.testResults = {
      phase2Features: [],
      dataSheets: [],
      countrySyllabus: [],
      teacherDashboard: [],
      overallScore: 0,
    };
    this.startTime = Date.now();
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async runAllTests() {
    this.log('Starting Phase 2 Implementation Testing...', 'START');

    try {
      // Test 1: Database Integration
      await this.testDatabaseIntegration();

      // Test 2: Country-based Syllabus System
      await this.testCountrySyllabusSystem();

      // Test 3: Data Sheets System
      await this.testDataSheetsSystem();

      // Test 4: Teacher Dashboard
      await this.testTeacherDashboard();

      // Test 5: Progress Tracking
      await this.testProgressTracking();

      // Test 6: Individual User Journeys
      await this.testUserJourneys();

      // Generate comprehensive report
      this.generateReport();
    } catch (error) {
      this.log(`Fatal error during testing: ${error.message}`, 'FATAL');
      process.exit(1);
    }
  }

  async testDatabaseIntegration() {
    this.log('Testing Database Integration...', 'TEST');

    const tests = [
      {
        name: 'Supabase Migration Files',
        test: () => {
          const migrationDir = path.join(__dirname, '../supabase/migrations');
          if (!fs.existsSync(migrationDir)) {
            return false;
          }

          const files = fs.readdirSync(migrationDir);
          const hasMigrations = files.some(f => f.endsWith('.sql'));
          return hasMigrations;
        },
      },
      {
        name: 'Database Schema Validation',
        test: () => {
          const schemaFile = path.join(
            __dirname,
            '../supabase/migrations/002_data_sheets_and_extended_features.sql'
          );
          if (!fs.existsSync(schemaFile)) {
            return false;
          }

          const content = fs.readFileSync(schemaFile, 'utf8');
          const requiredTables = [
            'students',
            'academic_standards',
            'data_sheets',
            'data_sheet_activities',
            'progress_tracking',
          ];

          return requiredTables.every(table =>
            content.includes(`CREATE TABLE ${table}`)
          );
        },
      },
      {
        name: 'Types Definition',
        test: () => {
          const typesFile = path.join(
            __dirname,
            '../src/types/syllabus.types.ts'
          );
          if (!fs.existsSync(typesFile)) {
            return false;
          }

          const content = fs.readFileSync(typesFile, 'utf8');
          const requiredTypes = [
            'CountryCode',
            'ActivityType',
            'DataSheet',
            'Student',
            'ProgressTracking',
          ];

          return requiredTypes.every(type =>
            content.includes(`export.*${type}`)
          );
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = test.test();
        this.testResults.phase2Features.push({
          name: test.name,
          status: result ? 'PASS' : 'FAIL',
          category: 'Database',
        });
        this.log(
          `${result ? '✓' : '✗'} ${test.name}`,
          result ? 'PASS' : 'FAIL'
        );
      } catch (error) {
        this.testResults.phase2Features.push({
          name: test.name,
          status: 'ERROR',
          error: error.message,
          category: 'Database',
        });
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  async testCountrySyllabusSystem() {
    this.log('Testing Country-based Syllabus System...', 'TEST');

    const tests = [
      {
        name: 'Syllabus Service Implementation',
        test: () => {
          const serviceFile = path.join(
            __dirname,
            '../src/services/syllabus.service.ts'
          );
          if (!fs.existsSync(serviceFile)) {
            return false;
          }

          const content = fs.readFileSync(serviceFile, 'utf8');
          const requiredMethods = [
            'getAvailableCountries',
            'getGradesByCountry',
            'getGradeForAge',
            'getAcademicStandards',
            'createStudent',
          ];

          return requiredMethods.every(method => content.includes(method));
        },
      },
      {
        name: 'Country Configurations (UK, US, India)',
        test: () => {
          const typesFile = path.join(
            __dirname,
            '../src/types/syllabus.types.ts'
          );
          if (!fs.existsSync(typesFile)) {
            return false;
          }

          const content = fs.readFileSync(typesFile, 'utf8');
          const countries = ['UK', 'US', 'INDIA'];
          const gradeTerms = [
            'Reception',
            'Year 1',
            'Kindergarten',
            'Grade 1',
            'Class 1',
          ];

          return (
            countries.every(country => content.includes(`'${country}'`)) &&
            gradeTerms.some(term => content.includes(term))
          );
        },
      },
      {
        name: 'Academic Standards Data',
        test: () => {
          const migrationFile = path.join(
            __dirname,
            '../supabase/migrations/002_data_sheets_and_extended_features.sql'
          );
          if (!fs.existsSync(migrationFile)) {
            return false;
          }

          const content = fs.readFileSync(migrationFile, 'utf8');
          const standardsInserts = [
            'UK.*Reception',
            'US.*Kindergarten',
            'INDIA.*Class 1',
          ];

          return standardsInserts.every(pattern =>
            new RegExp(pattern).test(content)
          );
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = test.test();
        this.testResults.countrySyllabus.push({
          name: test.name,
          status: result ? 'PASS' : 'FAIL',
          category: 'Syllabus',
        });
        this.log(
          `${result ? '✓' : '✗'} ${test.name}`,
          result ? 'PASS' : 'FAIL'
        );
      } catch (error) {
        this.testResults.countrySyllabus.push({
          name: test.name,
          status: 'ERROR',
          error: error.message,
          category: 'Syllabus',
        });
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  async testDataSheetsSystem() {
    this.log('Testing Data Sheets System...', 'TEST');

    const tests = [
      {
        name: 'Data Sheets Service Implementation',
        test: () => {
          const serviceFile = path.join(
            __dirname,
            '../src/services/data-sheets.service.ts'
          );
          if (!fs.existsSync(serviceFile)) {
            return false;
          }

          const content = fs.readFileSync(serviceFile, 'utf8');
          const requiredMethods = [
            'createDataSheet',
            'createActivity',
            'updateActivity',
            'generateProgressSummary',
            'getActivitiesByType',
          ];

          return requiredMethods.every(method => content.includes(method));
        },
      },
      {
        name: 'Activity Types (Sensory, Writing, Communication, Social, Academics)',
        test: () => {
          const typesFile = path.join(
            __dirname,
            '../src/types/syllabus.types.ts'
          );
          if (!fs.existsSync(typesFile)) {
            return false;
          }

          const content = fs.readFileSync(typesFile, 'utf8');
          const activityTypes = [
            'sensory',
            'writing',
            'communication',
            'social',
            'academics',
          ];

          return activityTypes.every(type => content.includes(`'${type}'`));
        },
      },
      {
        name: 'Data Sheets Manager Component',
        test: () => {
          const componentFile = path.join(
            __dirname,
            '../src/components/teacher/DataSheetsManager.tsx'
          );
          if (!fs.existsSync(componentFile)) {
            return false;
          }

          const content = fs.readFileSync(componentFile, 'utf8');
          const requiredFeatures = [
            'DataSheetsManager',
            'createNewDataSheet',
            'updateActivity',
            'getActivityStatusColor',
            'getRatingStars',
          ];

          return requiredFeatures.every(feature => content.includes(feature));
        },
      },
      {
        name: 'Progress Tracking Integration',
        test: () => {
          const serviceFile = path.join(
            __dirname,
            '../src/services/data-sheets.service.ts'
          );
          if (!fs.existsSync(serviceFile)) {
            return false;
          }

          const content = fs.readFileSync(serviceFile, 'utf8');
          return (
            content.includes('generateProgressSummary') &&
            content.includes('createProgressTracking')
          );
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = test.test();
        this.testResults.dataSheets.push({
          name: test.name,
          status: result ? 'PASS' : 'FAIL',
          category: 'DataSheets',
        });
        this.log(
          `${result ? '✓' : '✗'} ${test.name}`,
          result ? 'PASS' : 'FAIL'
        );
      } catch (error) {
        this.testResults.dataSheets.push({
          name: test.name,
          status: 'ERROR',
          error: error.message,
          category: 'DataSheets',
        });
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  async testTeacherDashboard() {
    this.log('Testing Teacher Dashboard Enhancement...', 'TEST');

    const tests = [
      {
        name: 'Enhanced Teacher Dashboard',
        test: () => {
          const dashboardFile = path.join(
            __dirname,
            '../src/app/teacher/dashboard/page.tsx'
          );
          if (!fs.existsSync(dashboardFile)) {
            return false;
          }

          const content = fs.readFileSync(dashboardFile, 'utf8');
          const requiredFeatures = [
            'DataSheetsManager',
            'activeTab',
            'data-sheets',
            'useState',
            'useEffect',
          ];

          return requiredFeatures.every(feature => content.includes(feature));
        },
      },
      {
        name: 'Tab-based Navigation',
        test: () => {
          const dashboardFile = path.join(
            __dirname,
            '../src/app/teacher/dashboard/page.tsx'
          );
          if (!fs.existsSync(dashboardFile)) {
            return false;
          }

          const content = fs.readFileSync(dashboardFile, 'utf8');
          const tabs = ['overview', 'data-sheets', 'students', 'sessions'];

          return tabs.every(tab => content.includes(tab));
        },
      },
      {
        name: 'Real Data Integration',
        test: () => {
          const dashboardFile = path.join(
            __dirname,
            '../src/app/teacher/dashboard/page.tsx'
          );
          if (!fs.existsSync(dashboardFile)) {
            return false;
          }

          const content = fs.readFileSync(dashboardFile, 'utf8');
          return (
            content.includes('loadDashboardStats') &&
            content.includes('dashboardStats')
          );
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = test.test();
        this.testResults.teacherDashboard.push({
          name: test.name,
          status: result ? 'PASS' : 'FAIL',
          category: 'TeacherDashboard',
        });
        this.log(
          `${result ? '✓' : '✗'} ${test.name}`,
          result ? 'PASS' : 'FAIL'
        );
      } catch (error) {
        this.testResults.teacherDashboard.push({
          name: test.name,
          status: 'ERROR',
          error: error.message,
          category: 'TeacherDashboard',
        });
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  async testProgressTracking() {
    this.log('Testing Progress Tracking System...', 'TEST');

    const tests = [
      {
        name: 'Progress Tracking Database Schema',
        test: () => {
          const migrationFile = path.join(
            __dirname,
            '../supabase/migrations/002_data_sheets_and_extended_features.sql'
          );
          if (!fs.existsSync(migrationFile)) {
            return false;
          }

          const content = fs.readFileSync(migrationFile, 'utf8');
          return (
            content.includes('CREATE TABLE progress_tracking') &&
            content.includes('progress_data JSONB') &&
            content.includes('skill_area VARCHAR')
          );
        },
      },
      {
        name: 'Progress Summary Function',
        test: () => {
          const migrationFile = path.join(
            __dirname,
            '../supabase/migrations/002_data_sheets_and_extended_features.sql'
          );
          if (!fs.existsSync(migrationFile)) {
            return false;
          }

          const content = fs.readFileSync(migrationFile, 'utf8');
          return content.includes('get_student_progress_summary');
        },
      },
      {
        name: 'Progress Tracking Service Methods',
        test: () => {
          const serviceFile = path.join(
            __dirname,
            '../src/services/data-sheets.service.ts'
          );
          if (!fs.existsSync(serviceFile)) {
            return false;
          }

          const content = fs.readFileSync(serviceFile, 'utf8');
          return (
            content.includes('getProgressTracking') &&
            content.includes('createProgressTracking')
          );
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = test.test();
        this.testResults.phase2Features.push({
          name: test.name,
          status: result ? 'PASS' : 'FAIL',
          category: 'ProgressTracking',
        });
        this.log(
          `${result ? '✓' : '✗'} ${test.name}`,
          result ? 'PASS' : 'FAIL'
        );
      } catch (error) {
        this.testResults.phase2Features.push({
          name: test.name,
          status: 'ERROR',
          error: error.message,
          category: 'ProgressTracking',
        });
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  async testUserJourneys() {
    this.log('Testing Individual User Journeys...', 'TEST');

    const tests = [
      {
        name: 'User Journey Testing Service',
        test: () => {
          const serviceFile = path.join(
            __dirname,
            '../src/services/user-journey-testing.service.ts'
          );
          if (!fs.existsSync(serviceFile)) {
            return false;
          }

          const content = fs.readFileSync(serviceFile, 'utf8');
          const journeys = [
            'testParentStudentCreation',
            'testTeacherDataSheetManagement',
            'testCountrySpecificFeatures',
            'testProgressTracking',
          ];

          return journeys.every(journey => content.includes(journey));
        },
      },
      {
        name: 'Test Step Validation',
        test: () => {
          const serviceFile = path.join(
            __dirname,
            '../src/services/user-journey-testing.service.ts'
          );
          if (!fs.existsSync(serviceFile)) {
            return false;
          }

          const content = fs.readFileSync(serviceFile, 'utf8');
          return (
            content.includes('TestStep') &&
            content.includes('expectedResult') &&
            content.includes('actualResult')
          );
        },
      },
      {
        name: 'Comprehensive Journey Coverage',
        test: () => {
          const serviceFile = path.join(
            __dirname,
            '../src/services/user-journey-testing.service.ts'
          );
          if (!fs.existsSync(serviceFile)) {
            return false;
          }

          const content = fs.readFileSync(serviceFile, 'utf8');
          const userTypes = ['parent', 'teacher', 'admin'];

          return userTypes.every(type =>
            content.includes(`userType: '${type}'`)
          );
        },
      },
    ];

    for (const test of tests) {
      try {
        const result = test.test();
        this.testResults.phase2Features.push({
          name: test.name,
          status: result ? 'PASS' : 'FAIL',
          category: 'UserJourneys',
        });
        this.log(
          `${result ? '✓' : '✗'} ${test.name}`,
          result ? 'PASS' : 'FAIL'
        );
      } catch (error) {
        this.testResults.phase2Features.push({
          name: test.name,
          status: 'ERROR',
          error: error.message,
          category: 'UserJourneys',
        });
        this.log(`✗ ${test.name} - Error: ${error.message}`, 'ERROR');
      }
    }
  }

  calculateOverallScore() {
    const allTests = [
      ...this.testResults.phase2Features,
      ...this.testResults.dataSheets,
      ...this.testResults.countrySyllabus,
      ...this.testResults.teacherDashboard,
    ];

    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => test.status === 'PASS').length;

    return totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    this.testResults.overallScore = this.calculateOverallScore();

    const report = {
      summary: {
        title: 'Phase 2 Implementation Testing Report',
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        overallScore: `${this.testResults.overallScore}%`,
        status:
          this.testResults.overallScore >= 80
            ? 'EXCELLENT'
            : this.testResults.overallScore >= 60
              ? 'GOOD'
              : this.testResults.overallScore >= 40
                ? 'NEEDS_IMPROVEMENT'
                : 'CRITICAL',
      },
      features: {
        database: this.getFeatureScore('Database'),
        syllabus: this.getFeatureScore('Syllabus'),
        dataSheets: this.getFeatureScore('DataSheets'),
        teacherDashboard: this.getFeatureScore('TeacherDashboard'),
        progressTracking: this.getFeatureScore('ProgressTracking'),
        userJourneys: this.getFeatureScore('UserJourneys'),
      },
      detailedResults: this.testResults,
      recommendations: this.generateRecommendations(),
    };

    // Save report
    const reportPath = path.join(
      __dirname,
      '../test-results/phase2-implementation-report.json'
    );
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    this.printSummary(report);

    this.log(
      `Phase 2 implementation testing completed. Report saved to: ${reportPath}`,
      'COMPLETE'
    );

    // Exit with appropriate code
    process.exit(this.testResults.overallScore >= 60 ? 0 : 1);
  }

  getFeatureScore(category) {
    const allTests = [
      ...this.testResults.phase2Features,
      ...this.testResults.dataSheets,
      ...this.testResults.countrySyllabus,
      ...this.testResults.teacherDashboard,
    ];

    const categoryTests = allTests.filter(test => test.category === category);
    const passed = categoryTests.filter(test => test.status === 'PASS').length;

    return {
      score:
        categoryTests.length > 0
          ? Math.round((passed / categoryTests.length) * 100)
          : 0,
      passed: passed,
      total: categoryTests.length,
      status:
        categoryTests.length > 0
          ? passed === categoryTests.length
            ? 'COMPLETE'
            : 'PARTIAL'
          : 'NOT_TESTED',
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.testResults.overallScore < 80) {
      recommendations.push(
        'Overall implementation needs improvement to reach production readiness'
      );
    }

    const featureScores = {
      database: this.getFeatureScore('Database'),
      syllabus: this.getFeatureScore('Syllabus'),
      dataSheets: this.getFeatureScore('DataSheets'),
      teacherDashboard: this.getFeatureScore('TeacherDashboard'),
      progressTracking: this.getFeatureScore('ProgressTracking'),
      userJourneys: this.getFeatureScore('UserJourneys'),
    };

    Object.entries(featureScores).forEach(([feature, score]) => {
      if (score.score < 70) {
        recommendations.push(
          `${feature} implementation needs attention (${score.score}% complete)`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push(
        'Excellent implementation! Ready for Phase 3 development'
      );
    }

    return recommendations;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('                PHASE 2 IMPLEMENTATION TEST SUMMARY');
    console.log('='.repeat(80));

    console.log(
      `\nOverall Score: ${report.summary.overallScore} (${report.summary.status})`
    );
    console.log(`Duration: ${report.summary.duration}`);
    console.log(`Timestamp: ${report.summary.timestamp}`);

    console.log('\n' + '-'.repeat(60));
    console.log('FEATURE IMPLEMENTATION STATUS:');
    console.log('-'.repeat(60));

    Object.entries(report.features).forEach(([feature, score]) => {
      const status = score.score >= 90 ? '🟢' : score.score >= 70 ? '🟡' : '🔴';
      console.log(
        `${status} ${feature.padEnd(20)} ${score.score}% (${score.passed}/${score.total})`
      );
    });

    if (report.recommendations.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('RECOMMENDATIONS:');
      console.log('-'.repeat(60));
      report.recommendations.forEach(rec => console.log(`• ${rec}`));
    }

    console.log('\n' + '='.repeat(80));
  }
}

// Run the testing framework
if (require.main === module) {
  const runner = new UserJourneyTestRunner();
  runner.runAllTests();
}

module.exports = UserJourneyTestRunner;
