/**
 * Interface Validation Script
 * Task 38: Interface completeness and type safety validation
 * 
 * This script validates TypeScript interface definitions and type safety
 * without requiring WebAssembly compilation.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationIssue {
  file: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
}

class InterfaceValidator {
  private issues: ValidationIssue[] = [];
  private typesContent: string = '';

  constructor() {
    const typesPath = path.join(__dirname, 'types.ts');
    try {
      this.typesContent = fs.readFileSync(typesPath, 'utf-8');
    } catch (error) {
      this.addIssue('types.ts', 0, 'error', 'File Access', `Could not read types.ts: ${error}`);
    }
  }

  /**
   * Run all interface validation tests
   */
  async validateInterfaces(): Promise<void> {
    console.log('🔍 Validating TypeScript Interface Completeness');
    console.log('='.repeat(60));

    // REQ-OBJ-001: Type Safety and Interface Completion
    this.validateObjectClassInterfaces();
    this.validateMethodSignatures();
    this.validateJSDocCompleteness();
    this.validateTypeAnnotations();
    this.validateErrorHandlingTypes();

    // REQ-OBJ-005: Android Compatibility
    this.validateAndroidCompatibility();

    this.printResults();
  }

  private validateObjectClassInterfaces(): void {
    console.log('\n📋 Validating Object Class Interfaces...');

    const requiredInterfaces = [
      'RouteItemWrapper',
      'RouteFlagWrapper', 
      'RouteListWrapper',
      'RouteWrapper',
      'CalcRouteWrapper',
      'FareInfoData'
    ];

    for (const interfaceName of requiredInterfaces) {
      if (!this.typesContent.includes(`interface ${interfaceName}`)) {
        this.addIssue('types.ts', 0, 'error', 'Missing Interface', 
          `Required interface ${interfaceName} not found`);
      } else {
        console.log(`  ✅ ${interfaceName} interface found`);
        this.validateInterfaceProperties(interfaceName);
      }
    }
  }

  private validateInterfaceProperties(interfaceName: string): void {
    const interfaceMatch = this.typesContent.match(
      new RegExp(`interface ${interfaceName}\\s*{([^}]+)}`, 's')
    );

    if (!interfaceMatch) {
      this.addIssue('types.ts', 0, 'warning', 'Interface Structure', 
        `Could not parse ${interfaceName} interface structure`);
      return;
    }

    const interfaceBody = interfaceMatch[1];
    
    // Check for required properties based on interface type
    switch (interfaceName) {
      case 'RouteItemWrapper':
        this.checkRequiredProperties(interfaceName, interfaceBody, [
          'stationId', 'lineId', 'flag', 'isValid', 'getDisplayName'
        ]);
        break;
      case 'RouteFlagWrapper':
        this.checkRequiredProperties(interfaceName, interfaceBody, [
          'no_rule', 'rule88', 'rule69', 'setLongRoute', 'clear'
        ]);
        break;
      case 'FareInfoData':
        this.checkRequiredProperties(interfaceName, interfaceBody, [
          'fare', 'isRule114Applied', 'availCountForFareOfStockDiscount'
        ]);
        break;
      case 'RouteWrapper':
        this.checkRequiredProperties(interfaceName, interfaceBody, [
          'setupRoute', 'addRoute', 'getRouteCount', 'getRouteItem'
        ]);
        break;
      case 'CalcRouteWrapper':
        this.checkRequiredProperties(interfaceName, interfaceBody, [
          'calcFare', 'setLongRoute', 'showFare'
        ]);
        break;
    }
  }

  private checkRequiredProperties(interfaceName: string, body: string, required: string[]): void {
    for (const prop of required) {
      if (!body.includes(prop)) {
        this.addIssue('types.ts', 0, 'warning', 'Missing Property', 
          `${interfaceName} missing property/method: ${prop}`);
      } else {
        console.log(`    ✅ ${prop} found in ${interfaceName}`);
      }
    }
  }

  private validateMethodSignatures(): void {
    console.log('\n🔧 Validating Method Signatures...');

    // Check for proper TypeScript method signatures
    const methodPatterns = [
      { pattern: /setupRoute\s*\([^)]*\)\s*:\s*number/, name: 'setupRoute return type' },
      { pattern: /getRouteItem\s*\([^)]*\)\s*:\s*RouteItemWrapper/, name: 'getRouteItem return type' },
      { pattern: /calcFare\s*\([^)]*\)\s*:\s*FareInfoData/, name: 'calcFare return type' },
      { pattern: /addRoute\s*\([^)]*lineId\s*:\s*number[^)]*stationId\s*:\s*number[^)]*\)\s*:\s*number/, name: 'addRoute parameter types' }
    ];

    for (const { pattern, name } of methodPatterns) {
      if (pattern.test(this.typesContent)) {
        console.log(`  ✅ ${name} signature valid`);
      } else {
        this.addIssue('types.ts', 0, 'warning', 'Method Signature', 
          `${name} signature may be incomplete or missing`);
      }
    }
  }

  private validateJSDocCompleteness(): void {
    console.log('\n📚 Validating JSDoc Documentation...');

    // Count interfaces and their JSDoc coverage
    const interfaceMatches = this.typesContent.match(/export interface \w+/g) || [];
    const jsDocMatches = this.typesContent.match(/\/\*\*[^*]*\*\//g) || [];

    console.log(`  📊 Found ${interfaceMatches.length} interfaces`);
    console.log(`  📊 Found ${jsDocMatches.length} JSDoc blocks`);

    if (jsDocMatches.length < interfaceMatches.length) {
      this.addIssue('types.ts', 0, 'info', 'Documentation', 
        `Some interfaces may lack JSDoc documentation (${jsDocMatches.length}/${interfaceMatches.length})`);
    } else {
      console.log('  ✅ JSDoc coverage appears adequate');
    }

    // Check for @param and @returns in method documentation
    const methodsWithJSDoc = this.typesContent.match(/\/\*\*[^*]*\*\/\s*\w+\s*\([^)]*\)/g) || [];
    console.log(`  📊 Found ${methodsWithJSDoc.length} documented methods`);
  }

  private validateTypeAnnotations(): void {
    console.log('\n🏷️  Validating Type Annotations...');

    // Check for proper type annotations
    const issues: string[] = [];

    // Check for 'any' types (should be avoided)
    const anyTypeMatches = this.typesContent.match(/:\s*any\b/g);
    if (anyTypeMatches && anyTypeMatches.length > 0) {
      this.addIssue('types.ts', 0, 'warning', 'Type Safety', 
        `Found ${anyTypeMatches.length} 'any' type annotations (should be avoided)`);
    } else {
      console.log('  ✅ No problematic "any" type annotations found');
    }

    // Check for proper return type annotations
    const methodsWithoutReturnType = this.typesContent.match(/\w+\s*\([^)]*\)\s*;/g);
    if (methodsWithoutReturnType) {
      console.log(`  ⚠️  Found ${methodsWithoutReturnType.length} methods that may lack explicit return types`);
    }

    // Check for optional parameter indicators
    const optionalParams = this.typesContent.match(/\w+\?\s*:/g) || [];
    console.log(`  📊 Found ${optionalParams.length} optional parameters`);
  }

  private validateErrorHandlingTypes(): void {
    console.log('\n🚨 Validating Error Handling Types...');

    const requiredErrorTypes = [
      'RouteErrorCode',
      'ValidationResult',
      'CLIError',
      'WebAssemblyLoadError'
    ];

    for (const errorType of requiredErrorTypes) {
      if (this.typesContent.includes(errorType)) {
        console.log(`  ✅ ${errorType} error type found`);
      } else {
        this.addIssue('types.ts', 0, 'info', 'Error Handling', 
          `Error type ${errorType} not found (may be defined elsewhere)`);
      }
    }
  }

  private validateAndroidCompatibility(): void {
    console.log('\n📱 Validating Android Kotlin Compatibility...');

    // Check for Android-compatible method aliases
    const androidAliases = [
      'findStationByName',
      'getStationNameById', 
      'isJunctionStation',
      'getStationReading'
    ];

    for (const alias of androidAliases) {
      if (this.typesContent.includes(alias)) {
        console.log(`  ✅ Android alias ${alias} found`);
      } else {
        this.addIssue('types.ts', 0, 'info', 'Android Compatibility', 
          `Android alias ${alias} not found`);
      }
    }

    // Check for Android compatibility interfaces
    if (this.typesContent.includes('AndroidCompatible')) {
      console.log('  ✅ Android compatibility interfaces present');
    } else {
      this.addIssue('types.ts', 0, 'info', 'Android Compatibility',
        'Android compatibility interfaces may need enhancement');
    }
  }

  private addIssue(file: string, line: number, severity: 'error' | 'warning' | 'info', 
                  category: string, message: string): void {
    this.issues.push({ file, line, severity, category, message });
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 INTERFACE VALIDATION RESULTS');
    console.log('='.repeat(60));

    const errors = this.issues.filter(i => i.severity === 'error');
    const warnings = this.issues.filter(i => i.severity === 'warning');  
    const infos = this.issues.filter(i => i.severity === 'info');

    console.log(`\n📈 SUMMARY:`);
    console.log(`  ❌ Errors: ${errors.length}`);
    console.log(`  ⚠️  Warnings: ${warnings.length}`);
    console.log(`  ℹ️  Info: ${infos.length}`);
    console.log(`  📊 Total Issues: ${this.issues.length}`);

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach(issue => {
        console.log(`  - ${issue.category}: ${issue.message}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      warnings.forEach(issue => {
        console.log(`  - ${issue.category}: ${issue.message}`);
      });
    }

    if (infos.length > 0) {
      console.log('\nℹ️  INFORMATION:');
      infos.forEach(issue => {
        console.log(`  - ${issue.category}: ${issue.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    if (errors.length === 0) {
      console.log('🎉 INTERFACE VALIDATION PASSED: No critical errors found');
    } else {
      console.log('❌ INTERFACE VALIDATION FAILED: Critical errors found');
    }
    
    console.log('='.repeat(60));
  }
}

// ===============================
// File Structure Validation
// ===============================

class FileStructureValidator {
  async validateProjectStructure(): Promise<void> {
    console.log('\n📁 Validating Project File Structure...');
    
    const requiredFiles = [
      'src/cli/types.ts',
      'src/cli/test_wasm_extended.ts',
      'src/cli/test_array_ops.ts',
      'src/cli/test_route_flag.ts',
      'src/cli/test_error_handling.ts',
      'src/cli/test_android_compat.ts',
      'src/cli/test_lifecycle.ts',
      'src/cli/examples/basic-object-classes.ts',
      'src/include/route_interface.h',
      'src/core/route_interface.cpp',
      'src/farert_wasm.cpp'
    ];

    let missingFiles = 0;
    let presentFiles = 0;

    for (const file of requiredFiles) {
      try {
        fs.accessSync(file, fs.constants.F_OK);
        console.log(`  ✅ ${file}`);
        presentFiles++;
      } catch {
        console.log(`  ❌ ${file} - MISSING`);
        missingFiles++;
      }
    }

    console.log(`\n📊 File Structure Summary:`);
    console.log(`  ✅ Present: ${presentFiles}/${requiredFiles.length}`);
    console.log(`  ❌ Missing: ${missingFiles}/${requiredFiles.length}`);
    console.log(`  📊 Completeness: ${Math.round(presentFiles/requiredFiles.length*100)}%`);
  }
}

// ===============================
// Main Execution
// ===============================

async function main(): Promise<void> {
  console.log('🚀 Starting Interface and File Structure Validation');
  console.log('Task 38: Comprehensive compatibility validation');
  console.log('='.repeat(80));

  try {
    // Validate TypeScript interfaces
    const interfaceValidator = new InterfaceValidator();
    await interfaceValidator.validateInterfaces();

    // Validate file structure
    const fileValidator = new FileStructureValidator();
    await fileValidator.validateProjectStructure();

    console.log('\n🏁 Validation Complete');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { InterfaceValidator, FileStructureValidator };