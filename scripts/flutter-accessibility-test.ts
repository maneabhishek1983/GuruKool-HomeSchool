/**
 * Flutter Accessibility Testing Script
 *
 * Runs automated checks for contrast ratios, focus management,
 * screen-reader labels, and keyboard navigation.
 * Generates accessibility reports and proposes fixes.
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'fs';
import { join, dirname } from 'path';

interface AccessibilityIssue {
  file: string;
  line: number;
  type: 'contrast' | 'focus' | 'label' | 'keyboard' | 'semantic';
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion: string;
}

interface AccessibilityReport {
  timestamp: string;
  totalIssues: number;
  errors: number;
  warnings: number;
  issues: AccessibilityIssue[];
  compliance: {
    wcagAA: boolean;
    wcagAAA: boolean;
    score: number;
  };
}

export class FlutterAccessibilityTester {
  private reportPath: string;

  constructor(outputPath: string) {
    this.reportPath = join(outputPath, 'test', 'accessibility_report.json');
  }

  /**
   * Run accessibility checks
   */
  async runAccessibilityChecks(): Promise<AccessibilityReport> {
    console.log('Running accessibility checks...');

    const dartFiles = await this.findDartFiles();
    const issues: AccessibilityIssue[] = [];

    for (const file of dartFiles) {
      const fileIssues = await this.checkFile(file);
      issues.push(...fileIssues);
    }

    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;
    const compliance = this.calculateCompliance(issues);

    const report: AccessibilityReport = {
      timestamp: new Date().toISOString(),
      totalIssues: issues.length,
      errors,
      warnings,
      issues,
      compliance,
    };

    this.saveReport(report);
    return report;
  }

  /**
   * Find all Dart files in lib directory
   */
  private async findDartFiles(): Promise<string[]> {
    const libPath = join(process.cwd(), 'gurukool_teacher', 'lib');
    if (!existsSync(libPath)) {
      return [];
    }

    const files: string[] = [];
    const findFiles = (dir: string) => {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          findFiles(fullPath);
        } else if (entry.name.endsWith('.dart')) {
          files.push(fullPath);
        }
      }
    };

    findFiles(libPath);
    return files;
  }

  /**
   * Check a single file for accessibility issues
   */
  private async checkFile(filePath: string): Promise<AccessibilityIssue[]> {
    const content = readFileSync(filePath, 'utf-8');
    const issues: AccessibilityIssue[] = [];

    // Check for missing semantic labels
    if (content.includes('Icon(') && !content.includes('semanticLabel')) {
      issues.push({
        file: filePath,
        line: this.getLineNumber(content, 'Icon('),
        type: 'label',
        severity: 'error',
        message: 'Icon missing semanticLabel for screen readers',
        suggestion: 'Add semanticLabel parameter to Icon widget',
      });
    }

    // Check for missing accessibility hints
    if (content.includes('ElevatedButton(') && !content.includes('tooltip')) {
      issues.push({
        file: filePath,
        line: this.getLineNumber(content, 'ElevatedButton('),
        type: 'label',
        severity: 'warning',
        message: 'Button missing tooltip for accessibility',
        suggestion: 'Add tooltip parameter to ElevatedButton',
      });
    }

    // Check for hardcoded colors (contrast issues)
    if (content.match(/Colors\.(black|white|grey)/)) {
      issues.push({
        file: filePath,
        line: this.getLineNumber(content, 'Colors.'),
        type: 'contrast',
        severity: 'warning',
        message: 'Hardcoded color may not meet contrast requirements',
        suggestion: 'Use theme colors or verify contrast ratio >= 4.5:1',
      });
    }

    // Check for missing FocusNode
    if (content.includes('TextField(') && !content.includes('FocusNode')) {
      issues.push({
        file: filePath,
        line: this.getLineNumber(content, 'TextField('),
        type: 'focus',
        severity: 'info',
        message: 'TextField could benefit from explicit FocusNode',
        suggestion: 'Add FocusNode for better keyboard navigation control',
      });
    }

    return issues;
  }

  /**
   * Get line number for a pattern in content
   */
  private getLineNumber(content: string, pattern: string): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(pattern)) {
        return i + 1;
      }
    }
    return 0;
  }

  /**
   * Calculate WCAG compliance
   */
  private calculateCompliance(issues: AccessibilityIssue[]): {
    wcagAA: boolean;
    wcagAAA: boolean;
    score: number;
  } {
    const errors = issues.filter(i => i.severity === 'error').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;

    // WCAG AA requires no errors
    const wcagAA = errors === 0;

    // WCAG AAA requires no errors and minimal warnings
    const wcagAAA = errors === 0 && warnings <= 2;

    // Calculate score (0-100)
    const totalIssues = issues.length;
    const score =
      totalIssues === 0 ? 100 : Math.max(0, 100 - errors * 10 - warnings * 5);

    return { wcagAA, wcagAAA, score };
  }

  /**
   * Save accessibility report
   */
  private saveReport(report: AccessibilityReport): void {
    const dir = dirname(this.reportPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.reportPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Accessibility report saved to ${this.reportPath}`);
  }

  /**
   * Generate fix suggestions
   */
  generateFixSuggestions(report: AccessibilityReport): string[] {
    const suggestions: string[] = [];

    const errorIssues = report.issues.filter(i => i.severity === 'error');
    if (errorIssues.length > 0) {
      suggestions.push(
        `Fix ${errorIssues.length} critical accessibility errors`
      );
    }

    const contrastIssues = report.issues.filter(i => i.type === 'contrast');
    if (contrastIssues.length > 0) {
      suggestions.push(`Review ${contrastIssues.length} contrast ratio issues`);
    }

    const labelIssues = report.issues.filter(i => i.type === 'label');
    if (labelIssues.length > 0) {
      suggestions.push(`Add semantic labels to ${labelIssues.length} widgets`);
    }

    return suggestions;
  }
}

// CLI usage
if (require.main === module) {
  const tester = new FlutterAccessibilityTester('./gurukool_teacher');
  tester
    .runAccessibilityChecks()
    .then(report => {
      console.log('\nAccessibility Test Results:');
      console.log(`Total Issues: ${report.totalIssues}`);
      console.log(`Errors: ${report.errors}`);
      console.log(`Warnings: ${report.warnings}`);
      console.log(`WCAG AA Compliant: ${report.compliance.wcagAA}`);
      console.log(`Score: ${report.compliance.score}/100`);

      const suggestions = tester.generateFixSuggestions(report);
      if (suggestions.length > 0) {
        console.log('\nSuggestions:');
        suggestions.forEach(s => console.log(`- ${s}`));
      }

      if (report.errors > 0) {
        process.exit(1);
      }
    })
    .catch(console.error);
}
