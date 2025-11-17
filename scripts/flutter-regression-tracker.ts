/**
 * Flutter Regression Tracker
 *
 * Maintains a database of past defects and tests.
 * Ensures that once a bug is fixed, a test is created to prevent recurrence.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Bug {
  id: string;
  title: string;
  description: string;
  severity: 'P1' | 'P2' | 'P3' | 'P4';
  status: 'open' | 'fixed' | 'closed';
  fixedAt?: string;
  testId?: string;
  relatedFiles: string[];
}

interface RegressionTest {
  id: string;
  bugId: string;
  testFile: string;
  testDescription: string;
  createdAt: string;
}

interface RegressionDatabase {
  bugs: Bug[];
  tests: RegressionTest[];
  lastUpdated: string;
}

export class FlutterRegressionTracker {
  private dbPath: string;

  constructor(outputPath: string) {
    this.dbPath = join(outputPath, 'test', 'regression_db.json');
    this.ensureDatabaseExists();
  }

  /**
   * Record a new bug
   */
  recordBug(bug: Omit<Bug, 'id' | 'status'>): string {
    const db = this.loadDatabase();
    const bugId = `BUG-${Date.now()}`;

    const newBug: Bug = {
      ...bug,
      id: bugId,
      status: 'open',
    };

    db.bugs.push(newBug);
    db.lastUpdated = new Date().toISOString();
    this.saveDatabase(db);

    console.log(`Bug recorded: ${bugId}`);
    return bugId;
  }

  /**
   * Mark bug as fixed and create regression test
   */
  markBugFixed(bugId: string, testFile: string, testDescription: string): void {
    const db = this.loadDatabase();
    const bug = db.bugs.find(b => b.id === bugId);

    if (!bug) {
      throw new Error(`Bug ${bugId} not found`);
    }

    bug.status = 'fixed';
    bug.fixedAt = new Date().toISOString();

    const testId = `TEST-${Date.now()}`;
    bug.testId = testId;

    const regressionTest: RegressionTest = {
      id: testId,
      bugId,
      testFile,
      testDescription,
      createdAt: new Date().toISOString(),
    };

    db.tests.push(regressionTest);
    db.lastUpdated = new Date().toISOString();
    this.saveDatabase(db);

    console.log(`Bug ${bugId} marked as fixed with test ${testId}`);
  }

  /**
   * Get all bugs without regression tests
   */
  getBugsWithoutTests(): Bug[] {
    const db = this.loadDatabase();
    return db.bugs.filter(bug => bug.status === 'fixed' && !bug.testId);
  }

  /**
   * Get regression tests for a file
   */
  getTestsForFile(filePath: string): RegressionTest[] {
    const db = this.loadDatabase();
    return db.tests.filter(test => test.testFile === filePath);
  }

  /**
   * Check if a bug pattern exists (prevent duplicate bugs)
   */
  findSimilarBug(title: string, relatedFiles: string[]): Bug | null {
    const db = this.loadDatabase();
    return (
      db.bugs.find(bug => {
        const titleMatch = bug.title
          .toLowerCase()
          .includes(title.toLowerCase());
        const fileMatch = relatedFiles.some(file =>
          bug.relatedFiles.includes(file)
        );
        return titleMatch || fileMatch;
      }) || null
    );
  }

  /**
   * Generate regression test template
   */
  generateRegressionTestTemplate(bugId: string): string {
    const db = this.loadDatabase();
    const bug = db.bugs.find(b => b.id === bugId);

    if (!bug) {
      throw new Error(`Bug ${bugId} not found`);
    }

    return `import 'package:flutter_test/flutter_test.dart';

/// Regression test for bug ${bugId}
/// Bug: ${bug.title}
/// Description: ${bug.description}
/// Fixed: ${bug.fixedAt || 'Not fixed yet'}
void main() {
  group('Regression Test: ${bug.title}', () {
    test('should prevent recurrence of bug ${bugId}', () {
      // TODO: Implement test that verifies the bug is fixed
      // This test should fail if the bug is reintroduced
      expect(true, isTrue);
    });
  });
}
`;
  }

  /**
   * Load database from file
   */
  private loadDatabase(): RegressionDatabase {
    if (!existsSync(this.dbPath)) {
      return { bugs: [], tests: [], lastUpdated: new Date().toISOString() };
    }
    const content = readFileSync(this.dbPath, 'utf-8');
    return JSON.parse(content) as RegressionDatabase;
  }

  /**
   * Save database to file
   */
  private saveDatabase(db: RegressionDatabase): void {
    const dir = join(this.dbPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.dbPath, JSON.stringify(db, null, 2), 'utf-8');
  }

  /**
   * Ensure database file exists
   */
  private ensureDatabaseExists(): void {
    if (!existsSync(this.dbPath)) {
      const initialDb: RegressionDatabase = {
        bugs: [],
        tests: [],
        lastUpdated: new Date().toISOString(),
      };
      this.saveDatabase(initialDb);
    }
  }
}

// CLI usage
if (require.main === module) {
  const tracker = new FlutterRegressionTracker('./gurukool_teacher');
  const command = process.argv[2];

  if (command === 'record') {
    const bugId = tracker.recordBug({
      title: process.argv[3] || 'Test Bug',
      description: process.argv[4] || 'Test description',
      severity: (process.argv[5] as Bug['severity']) || 'P3',
      relatedFiles: process.argv.slice(6) || [],
    });
    console.log(`Bug recorded: ${bugId}`);
  } else if (command === 'fix') {
    const bugId = process.argv[3];
    const testFile = process.argv[4] || 'test/regression_test.dart';
    const testDescription = process.argv[5] || 'Regression test';
    tracker.markBugFixed(bugId, testFile, testDescription);
  } else if (command === 'list') {
    const bugs = tracker.getBugsWithoutTests();
    console.log(`Bugs without tests: ${bugs.length}`);
    bugs.forEach(bug => console.log(`- ${bug.id}: ${bug.title}`));
  }
}
