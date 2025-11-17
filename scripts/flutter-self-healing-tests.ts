/**
 * Flutter Self-Healing Tests
 *
 * When backend schema or UI structure changes, adapt test selectors
 * and data mocks autonomously.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';

interface TestSelector {
  type: 'key' | 'text' | 'icon' | 'type' | 'semantic';
  value: string;
  fallbacks: string[];
}

interface SchemaChange {
  field: string;
  oldType?: string;
  newType: string;
  action: 'added' | 'removed' | 'modified';
}

export class FlutterSelfHealingTests {
  /**
   * Adapt test selectors when UI structure changes
   */
  adaptTestSelectors(testFile: string, currentCode: string): string {
    const testContent = readFileSync(testFile, 'utf-8');
    let adaptedContent = testContent;

    // Find all find.* calls in test
    const findPatterns = testContent.matchAll(
      /find\.(\w+)\(['"]([^'"]+)['"]\)/g
    );

    for (const match of findPatterns) {
      const findType = match[1];
      const selector = match[2];

      // Check if selector still exists in current code
      if (!currentCode.includes(selector)) {
        // Try fallback selectors
        const fallback = this.findFallbackSelector(
          currentCode,
          selector,
          findType
        );
        if (fallback) {
          adaptedContent = adaptedContent.replace(
            `find.${findType}('${selector}')`,
            `find.${findType}('${fallback}')`
          );
          console.log(`Adapted selector: ${selector} -> ${fallback}`);
        }
      }
    }

    return adaptedContent;
  }

  /**
   * Adapt data mocks when schema changes
   */
  adaptDataMocks(mockFile: string, schemaChanges: SchemaChange[]): string {
    const mockContent = readFileSync(mockFile, 'utf-8');
    let adaptedContent = mockContent;

    for (const change of schemaChanges) {
      if (change.action === 'added') {
        // Add new field with default value
        const defaultValue = this.getDefaultValue(change.newType);
        adaptedContent = this.addFieldToMock(
          adaptedContent,
          change.field,
          defaultValue
        );
      } else if (change.action === 'removed') {
        // Remove field from mock
        adaptedContent = this.removeFieldFromMock(adaptedContent, change.field);
      } else if (change.action === 'modified') {
        // Update field type
        adaptedContent = this.updateFieldType(
          adaptedContent,
          change.field,
          change.newType
        );
      }
    }

    return adaptedContent;
  }

  /**
   * Find fallback selector in current code
   */
  private findFallbackSelector(
    code: string,
    originalSelector: string,
    findType: string
  ): string | null {
    // Try semantic label
    if (findType === 'text') {
      const semanticMatch = code.match(
        new RegExp(`semanticLabel:\\s*['"]([^'"]+)['"]`)
      );
      if (semanticMatch) {
        return semanticMatch[1];
      }
    }

    // Try key
    const keyMatch = code.match(
      new RegExp(`key:\\s*Key\\(['"]([^'"]+)['"]\\)`)
    );
    if (keyMatch) {
      return keyMatch[1];
    }

    // Try tooltip
    const tooltipMatch = code.match(new RegExp(`tooltip:\\s*['"]([^'"]+)['"]`));
    if (tooltipMatch) {
      return tooltipMatch[1];
    }

    return null;
  }

  /**
   * Get default value for a type
   */
  private getDefaultValue(type: string): string {
    const defaults: Record<string, string> = {
      String: "''",
      int: '0',
      double: '0.0',
      bool: 'false',
      DateTime: 'DateTime.now()',
    };
    return defaults[type] || 'null';
  }

  /**
   * Add field to mock data
   */
  private addFieldToMock(
    content: string,
    field: string,
    defaultValue: string
  ): string {
    // Find the last field in the object and add new field
    const lastFieldMatch = content.match(/(\w+):\s*[^,}]+(,|\n\s*\})/);
    if (lastFieldMatch) {
      const insertPos = lastFieldMatch.index! + lastFieldMatch[0].length;
      const newField = `\n    ${field}: ${defaultValue},`;
      return (
        content.slice(0, insertPos - 1) +
        newField +
        content.slice(insertPos - 1)
      );
    }
    return content;
  }

  /**
   * Remove field from mock data
   */
  private removeFieldFromMock(content: string, field: string): string {
    const fieldPattern = new RegExp(`\\s*${field}:\\s*[^,}\\n]+(,|\\n)`, 'g');
    return content.replace(fieldPattern, '');
  }

  /**
   * Update field type in mock data
   */
  private updateFieldType(
    content: string,
    field: string,
    newType: string
  ): string {
    // This would need more sophisticated parsing
    // For now, just log the change
    console.log(`Field ${field} type changed to ${newType}`);
    return content;
  }

  /**
   * Detect schema changes by comparing model files
   */
  detectSchemaChanges(oldModel: string, newModel: string): SchemaChange[] {
    const changes: SchemaChange[] = [];

    // Extract fields from old model
    const oldFields = this.extractFields(oldModel);
    const newFields = this.extractFields(newModel);

    // Find added fields
    for (const [field, type] of Object.entries(newFields)) {
      if (!oldFields[field]) {
        changes.push({ field, newType: type, action: 'added' });
      } else if (oldFields[field] !== type) {
        changes.push({
          field,
          oldType: oldFields[field],
          newType: type,
          action: 'modified',
        });
      }
    }

    // Find removed fields
    for (const [field] of Object.entries(oldFields)) {
      if (!newFields[field]) {
        changes.push({ field, newType: '', action: 'removed' });
      }
    }

    return changes;
  }

  /**
   * Extract fields from model file
   */
  private extractFields(modelContent: string): Record<string, string> {
    const fields: Record<string, string> = {};
    const fieldPattern = /final\s+(\w+)\s+(\w+);/g;
    let match;

    while ((match = fieldPattern.exec(modelContent)) !== null) {
      fields[match[2]] = match[1];
    }

    return fields;
  }
}

// CLI usage
if (require.main === module) {
  const healer = new FlutterSelfHealingTests();
  const command = process.argv[2];

  if (command === 'adapt-selectors') {
    const testFile = process.argv[3];
    const codeFile = process.argv[4];
    const code = readFileSync(codeFile, 'utf-8');
    const adapted = healer.adaptTestSelectors(testFile, code);
    writeFileSync(testFile, adapted, 'utf-8');
    console.log(`Adapted test: ${testFile}`);
  } else if (command === 'detect-schema') {
    const oldModel = process.argv[3];
    const newModel = process.argv[4];
    const changes = healer.detectSchemaChanges(
      readFileSync(oldModel, 'utf-8'),
      readFileSync(newModel, 'utf-8')
    );
    console.log('Schema changes detected:');
    changes.forEach(change => {
      console.log(`- ${change.action}: ${change.field} (${change.newType})`);
    });
  }
}
