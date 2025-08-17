#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class UIImplementationValidator {
  constructor() {
    this.results = {
      parentDashboard: { implemented: [], missing: [], score: 0 },
      teacherDashboard: { implemented: [], missing: [], score: 0 },
      dataSheets: { implemented: [], missing: [], score: 0 },
      timesheet: { implemented: [], missing: [], score: 0 },
      database: { implemented: [], missing: [], score: 0 },
      overall: { score: 0, issues: [] },
    };
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix =
      type === 'ERROR'
        ? '❌'
        : type === 'WARN'
          ? '⚠️'
          : type === 'SUCCESS'
            ? '✅'
            : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async validateParentDashboard() {
    this.log('Validating Parent Dashboard Implementation...', 'INFO');

    const parentDashboardFile = path.join(
      __dirname,
      '../src/app/parent/dashboard/page.tsx'
    );
    const content = fs.readFileSync(parentDashboardFile, 'utf8');

    // Check implemented features
    const implementedFeatures = [
      {
        feature: 'Student Profile Management',
        pattern: 'CreateStudentForm|StudentProfileCard',
      },
      { feature: 'Teacher Assignment', pattern: 'teachers.*status.*assigned' },
      {
        feature: 'Basic Progress Tracking',
        pattern: 'Average Progress|progress',
      },
      {
        feature: 'Academic Standards Display',
        pattern: 'UK Curriculum|US Standards|India NEP',
      },
      {
        feature: 'Timesheet Summary',
        pattern: 'Teacher Timesheet|This Month.*Hours',
      },
    ];

    // Check missing features
    const missingFeatures = [
      {
        feature: 'Data Sheets Access',
        pattern: 'DataSheets|data.*sheets',
        critical: true,
      },
      {
        feature: 'Real-time Progress Charts',
        pattern: 'ProgressTracker|InteractiveProgressCharts',
        critical: true,
      },
      {
        feature: 'Teacher Communication',
        pattern: 'Contact.*Teacher|Message.*Teacher',
        critical: false,
      },
      {
        feature: 'Advanced Analytics',
        pattern: 'AnalyticsDashboard|InsightCard',
        critical: false,
      },
      {
        feature: 'Session Scheduling',
        pattern: 'Schedule.*Session|Book.*Teacher',
        critical: false,
      },
    ];

    implementedFeatures.forEach(({ feature, pattern }) => {
      if (content.match(new RegExp(pattern, 'i'))) {
        this.results.parentDashboard.implemented.push(feature);
      }
    });

    missingFeatures.forEach(({ feature, pattern, critical }) => {
      if (!content.match(new RegExp(pattern, 'i'))) {
        this.results.parentDashboard.missing.push({ feature, critical });
      }
    });

    this.results.parentDashboard.score = Math.round(
      (this.results.parentDashboard.implemented.length /
        (this.results.parentDashboard.implemented.length +
          this.results.parentDashboard.missing.length)) *
        100
    );
  }

  async validateTeacherDashboard() {
    this.log('Validating Teacher Dashboard Implementation...', 'INFO');

    const teacherDashboardFile = path.join(
      __dirname,
      '../src/app/teacher/dashboard/page.tsx'
    );
    const content = fs.readFileSync(teacherDashboardFile, 'utf8');

    // Check implemented features
    const implementedFeatures = [
      {
        feature: 'Basic Dashboard Stats',
        pattern: 'Assigned Students|Active Lessons|Average Progress',
      },
      {
        feature: 'Tab Navigation',
        pattern: 'overview.*data-sheets.*students.*sessions',
      },
      {
        feature: 'Academic Standards Info',
        pattern: 'UK Curriculum|US Standards|India NEP',
      },
      {
        feature: 'Quick Actions',
        pattern: 'Create Lesson Plan|Track Progress|Send Feedback',
      },
    ];

    // Check missing features
    const missingFeatures = [
      {
        feature: 'Data Sheets Management',
        pattern: 'DataSheetsManager|createDataSheet|updateActivity',
        critical: true,
      },
      {
        feature: 'Student Management',
        pattern: 'StudentList|assignStudent|viewStudent',
        critical: true,
      },
      {
        feature: 'Session Management',
        pattern: 'SessionManager|startSession|endSession',
        critical: true,
      },
      {
        feature: 'Timesheet Tracking',
        pattern: 'TimesheetManager|trackTime|billing',
        critical: true,
      },
      {
        feature: 'Progress Reports',
        pattern: 'ProgressReport|generateReport|exportData',
        critical: false,
      },
    ];

    implementedFeatures.forEach(({ feature, pattern }) => {
      if (content.match(new RegExp(pattern, 'i'))) {
        this.results.teacherDashboard.implemented.push(feature);
      }
    });

    missingFeatures.forEach(({ feature, pattern, critical }) => {
      if (!content.match(new RegExp(pattern, 'i'))) {
        this.results.teacherDashboard.missing.push({ feature, critical });
      }
    });

    this.results.teacherDashboard.score = Math.round(
      (this.results.teacherDashboard.implemented.length /
        (this.results.teacherDashboard.implemented.length +
          this.results.teacherDashboard.missing.length)) *
        100
    );
  }

  async validateDataSheetsSystem() {
    this.log('Validating Data Sheets System Implementation...', 'INFO');

    const dataSheetsServiceFile = path.join(
      __dirname,
      '../src/services/data-sheets.service.ts'
    );
    const dataSheetsManagerFile = path.join(
      __dirname,
      '../src/components/teacher/DataSheetsManager.tsx'
    );

    const serviceContent = fs.existsSync(dataSheetsServiceFile)
      ? fs.readFileSync(dataSheetsServiceFile, 'utf8')
      : '';
    const managerContent = fs.existsSync(dataSheetsManagerFile)
      ? fs.readFileSync(dataSheetsManagerFile, 'utf8')
      : '';

    // Check implemented features
    const implementedFeatures = [
      {
        feature: 'Data Sheets Service',
        pattern: 'DataSheetsService|createDataSheet|getDataSheetsByStudent',
        file: serviceContent,
      },
      {
        feature: 'Activity Types Support',
        pattern: 'sensory.*writing.*communication.*social.*academics',
        file: serviceContent,
      },
      {
        feature: 'Progress Tracking',
        pattern: 'progress.*summary|rating.*system',
        file: serviceContent,
      },
      {
        feature: 'Data Sheets Manager Component',
        pattern: 'DataSheetsManager|loadDataSheets|createNewDataSheet',
        file: managerContent,
      },
    ];

    // Check missing features
    const missingFeatures = [
      {
        feature: 'UI Integration in Teacher Dashboard',
        pattern: 'DataSheetsManager.*import|DataSheetsManager.*component',
        critical: true,
      },
      {
        feature: 'Parent Dashboard Data Sheets Access',
        pattern: 'DataSheets.*parent|viewDataSheets',
        critical: true,
      },
      {
        feature: 'Real-time Updates',
        pattern: 'WebSocket.*data.*sheets|real.*time.*updates',
        critical: false,
      },
      {
        feature: 'Data Export',
        pattern: 'exportDataSheet|download.*report',
        critical: false,
      },
    ];

    implementedFeatures.forEach(({ feature, pattern, file }) => {
      if (file && file.match(new RegExp(pattern, 'i'))) {
        this.results.dataSheets.implemented.push(feature);
      }
    });

    missingFeatures.forEach(({ feature, pattern, critical }) => {
      const foundInService = serviceContent.match(new RegExp(pattern, 'i'));
      const foundInManager = managerContent.match(new RegExp(pattern, 'i'));
      if (!foundInService && !foundInManager) {
        this.results.dataSheets.missing.push({ feature, critical });
      }
    });

    this.results.dataSheets.score = Math.round(
      (this.results.dataSheets.implemented.length /
        (this.results.dataSheets.implemented.length +
          this.results.dataSheets.missing.length)) *
        100
    );
  }

  async validateTimesheetSystem() {
    this.log('Validating Timesheet System Implementation...', 'INFO');

    const timesheetServiceFile = path.join(
      __dirname,
      '../src/services/timesheet-automation.service.ts'
    );
    const timesheetContent = fs.existsSync(timesheetServiceFile)
      ? fs.readFileSync(timesheetServiceFile, 'utf8')
      : '';

    // Check implemented features
    const implementedFeatures = [
      {
        feature: 'Timesheet Service',
        pattern: 'TimesheetAutomationService|startSession|endSession',
      },
      {
        feature: 'GPS Location Tracking',
        pattern: 'GPS.*coordinates|location.*verification',
      },
      {
        feature: 'Billing Integration',
        pattern: 'billing.*rate|totalAmount|currency',
      },
      {
        feature: 'Session Management',
        pattern: 'session.*management|active.*timer',
      },
    ];

    // Check missing features
    const missingFeatures = [
      {
        feature: 'Timesheet UI in Teacher Dashboard',
        pattern: 'TimesheetManager|trackTime|viewTimesheet',
        critical: true,
      },
      {
        feature: 'Timesheet UI in Parent Dashboard',
        pattern: 'viewTeacherTimesheet|timesheet.*summary',
        critical: true,
      },
      {
        feature: 'Database Schema for Timesheets',
        pattern: 'CREATE TABLE.*timesheet|timesheet.*table',
        critical: true,
      },
      {
        feature: 'Timesheet Reports',
        pattern: 'generateTimesheetReport|exportTimesheet',
        critical: false,
      },
    ];

    implementedFeatures.forEach(({ feature, pattern }) => {
      if (timesheetContent.match(new RegExp(pattern, 'i'))) {
        this.results.timesheet.implemented.push(feature);
      }
    });

    missingFeatures.forEach(({ feature, pattern, critical }) => {
      if (!timesheetContent.match(new RegExp(pattern, 'i'))) {
        this.results.timesheet.missing.push({ feature, critical });
      }
    });

    this.results.timesheet.score = Math.round(
      (this.results.timesheet.implemented.length /
        (this.results.timesheet.implemented.length +
          this.results.timesheet.missing.length)) *
        100
    );
  }

  async validateDatabaseSchema() {
    this.log('Validating Database Schema Implementation...', 'INFO');

    const migrationFile = path.join(
      __dirname,
      '../supabase/migrations/002_data_sheets_and_extended_features.sql'
    );
    const content = fs.existsSync(migrationFile)
      ? fs.readFileSync(migrationFile, 'utf8')
      : '';

    // Check implemented features
    const implementedFeatures = [
      { feature: 'Students Table', pattern: 'CREATE TABLE students' },
      { feature: 'Data Sheets Table', pattern: 'CREATE TABLE data_sheets' },
      {
        feature: 'Data Sheet Activities Table',
        pattern: 'CREATE TABLE data_sheet_activities',
      },
      {
        feature: 'Teacher Assignments Table',
        pattern: 'CREATE TABLE teacher_assignments',
      },
      {
        feature: 'Progress Tracking Table',
        pattern: 'CREATE TABLE progress_tracking',
      },
      {
        feature: 'Academic Standards Table',
        pattern: 'CREATE TABLE academic_standards',
      },
    ];

    // Check missing features
    const missingFeatures = [
      {
        feature: 'Timesheets Table',
        pattern: 'CREATE TABLE.*timesheet|timesheet.*table',
        critical: true,
      },
      {
        feature: 'Sessions Table',
        pattern: 'CREATE TABLE.*session|session.*table',
        critical: true,
      },
      {
        feature: 'Billing Table',
        pattern: 'CREATE TABLE.*billing|billing.*table',
        critical: true,
      },
      {
        feature: 'Payments Table',
        pattern: 'CREATE TABLE.*payment|payment.*table',
        critical: false,
      },
    ];

    implementedFeatures.forEach(({ feature, pattern }) => {
      if (content.match(new RegExp(pattern, 'i'))) {
        this.results.database.implemented.push(feature);
      }
    });

    missingFeatures.forEach(({ feature, pattern, critical }) => {
      if (!content.match(new RegExp(pattern, 'i'))) {
        this.results.database.missing.push({ feature, critical });
      }
    });

    this.results.database.score = Math.round(
      (this.results.database.implemented.length /
        (this.results.database.implemented.length +
          this.results.database.missing.length)) *
        100
    );
  }

  generateReport() {
    this.log('Generating Implementation Report...', 'INFO');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        parentDashboard: this.results.parentDashboard.score,
        teacherDashboard: this.results.teacherDashboard.score,
        dataSheets: this.results.dataSheets.score,
        timesheet: this.results.timesheet.score,
        database: this.results.database.score,
      },
      details: this.results,
      criticalIssues: [],
      recommendations: [],
    };

    // Calculate overall score
    const scores = Object.values(report.summary);
    report.overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    );

    // Identify critical issues
    Object.entries(this.results).forEach(([area, result]) => {
      if (result.missing && Array.isArray(result.missing)) {
        result.missing.forEach(item => {
          if (item.critical) {
            report.criticalIssues.push(`${area}: ${item.feature}`);
          }
        });
      }
    });

    // Generate recommendations
    if (
      this.results.parentDashboard.missing &&
      this.results.parentDashboard.missing.length > 0
    ) {
      report.recommendations.push('Add Data Sheets access to Parent Dashboard');
    }
    if (
      this.results.teacherDashboard.missing &&
      this.results.teacherDashboard.missing.length > 0
    ) {
      report.recommendations.push(
        'Integrate DataSheetsManager component into Teacher Dashboard'
      );
    }
    if (
      this.results.timesheet.missing &&
      this.results.timesheet.missing.some(item => item.critical)
    ) {
      report.recommendations.push(
        'Create timesheet database schema and UI components'
      );
    }

    return report;
  }

  async run() {
    this.log('Starting UI Implementation Validation...', 'INFO');

    try {
      await this.validateParentDashboard();
      await this.validateTeacherDashboard();
      await this.validateDataSheetsSystem();
      await this.validateTimesheetSystem();
      await this.validateDatabaseSchema();

      const report = this.generateReport();

      // Print summary
      console.log('\n' + '='.repeat(80));
      console.log('📊 UI IMPLEMENTATION VALIDATION REPORT');
      console.log('='.repeat(80));

      console.log(`\n🎯 Overall Implementation Score: ${report.overallScore}%`);

      console.log('\n📈 Area Scores:');
      console.log(`   Parent Dashboard: ${report.summary.parentDashboard}%`);
      console.log(`   Teacher Dashboard: ${report.summary.teacherDashboard}%`);
      console.log(`   Data Sheets System: ${report.summary.dataSheets}%`);
      console.log(`   Timesheet System: ${report.summary.timesheet}%`);
      console.log(`   Database Schema: ${report.summary.database}%`);

      if (report.criticalIssues.length > 0) {
        console.log('\n🚨 CRITICAL ISSUES:');
        report.criticalIssues.forEach(issue => {
          console.log(`   • ${issue}`);
        });
      }

      if (report.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });
      }

      // Save detailed report
      fs.writeFileSync(
        path.join(__dirname, '../ui-implementation-report.json'),
        JSON.stringify(report, null, 2)
      );

      this.log(
        'Detailed report saved to ui-implementation-report.json',
        'SUCCESS'
      );

      return report;
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new UIImplementationValidator();
  validator
    .run()
    .then(report => {
      process.exit(report.criticalIssues.length > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = UIImplementationValidator;
