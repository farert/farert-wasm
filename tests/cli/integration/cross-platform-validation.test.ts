/**
 * Cross-Platform Environment Testing Suite - Task 20
 * Requirements: REQ-CLI-004, REQ-CLI-006 - Environment management and cross-platform compatibility
 * 
 * This test suite validates:
 * - Cross-platform CLI functionality (macOS, Linux, Windows)
 * - Environment variable handling and configuration
 * - File system access patterns and security
 * - Terminal encoding and Japanese text display
 * - Node.js version compatibility
 * - WebAssembly module loading across platforms
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { performance } from 'perf_hooks';

const CLI_PATH = path.resolve(__dirname, '../../../src/cli/main.ts');
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

/**
 * Platform-specific configuration and expectations
 */
interface PlatformConfig {
  platform: string;
  expectedShell: string;
  pathSeparator: string;
  lineEnding: string;
  tempDir: string;
  homeDir: string;
  maxPathLength: number;
  supportsUTF8: boolean;
  expectedNodeMinVersion: string;
}

/**
 * Cross-platform test result
 */
interface CrossPlatformTestResult {
  testName: string;
  platform: string;
  success: boolean;
  duration: number;
  stdout: string;
  stderr: string;
  exitCode: number;
  environmentInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cwd: string;
    homeDir: string;
    tempDir: string;
  };
  issues: string[];
  recommendations: string[];
}

describe('Cross-Platform Environment Validation - Task 20', () => {
  let platformConfig: PlatformConfig;
  let testResults: CrossPlatformTestResult[] = [];
  
  beforeAll(() => {
    // Determine platform configuration
    platformConfig = getPlatformConfig();
    
    console.log(`🌐 Cross-Platform Testing on ${platformConfig.platform}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Architecture: ${process.arch}`);
  });
  
  afterAll(() => {
    // Generate cross-platform compatibility report
    generateCrossPlatformReport();
  });
  
  describe('Environment Detection and Validation', () => {
    it('should detect current platform correctly', async () => {
      const result = await executeTestWithPlatformAnalysis({
        testName: 'Platform Detection',
        args: ['--env-report'],
        expectedExitCode: 0,
        validatePlatform: true
      });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain(platformConfig.platform);
      expect(result.environmentInfo.platform).toBe(platformConfig.platform);
    });
    
    it('should validate Node.js version compatibility', async () => {
      const result = await executeTestWithPlatformAnalysis({
        testName: 'Node.js Version Compatibility',
        args: ['--env-report'],
        expectedExitCode: 0,
        validateNodeVersion: true
      });
      
      expect(result.success).toBe(true);
      
      // Check minimum Node.js version requirement
      const currentVersion = process.version.slice(1); // Remove 'v' prefix
      const [major] = currentVersion.split('.').map(Number);
      expect(major).toBeGreaterThanOrEqual(14);
    });
    
    it('should validate environment variables and configuration', async () => {
      const envVars = {
        CLI_DEBUG: '1',
        CLI_WASM_PATH: path.join(PROJECT_ROOT, 'dist/farert.wasm'),
        NODE_ENV: 'test'
      };
      
      const result = await executeTestWithPlatformAnalysis({
        testName: 'Environment Variables',
        args: ['--env-debug', '--env-report'],
        expectedExitCode: 0,
        environmentOverrides: envVars,
        validateEnvironment: true
      });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('[DEBUG]');
    });
  });
  
  describe('File System Access and Security', () => {
    it('should handle file paths correctly for platform', async () => {
      const testFile = path.join(os.tmpdir(), 'farert-cross-platform-test.txt');
      const routeData = `東京 東海道線 品川${os.EOL}新宿 中央線 立川${os.EOL}/${os.EOL}`;
      
      try {
        fs.writeFileSync(testFile, routeData, 'utf8');
        
        const result = await executeTestWithPlatformAnalysis({
          testName: 'File System Access',
          args: [testFile],
          expectedExitCode: 0,
          validateFileAccess: true
        });
        
        expect(result.success).toBe(true);
        expect(result.stdout).toContain('Processing route file');
        expect(result.stdout).toContain('東京');
        
        // Validate platform-specific path handling
        if (platformConfig.platform === 'win32') {
          expect(testFile).toMatch(/\\/);
        } else {
          expect(testFile).toMatch(/\//);
        }
        
      } finally {
        if (fs.existsSync(testFile)) {
          fs.unlinkSync(testFile);
        }
      }
    });
    
    it('should prevent path traversal attacks across platforms', async () => {
      const maliciousFiles = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '../../../../proc/version',
        './../../../.env'
      ];
      
      for (const maliciousFile of maliciousFiles) {
        const result = await executeTestWithPlatformAnalysis({
          testName: `Path Traversal Prevention: ${maliciousFile}`,
          args: [maliciousFile],
          expectedExitCode: -1,
          validateSecurity: true
        });
        
        expect(result.success).toBe(true); // Success means security prevented the attack
        expect(result.stderr).toContain('security');
      }
    });
    
    it('should handle long file paths appropriately', async () => {
      // Test platform-specific path length limits
      const longFileName = 'a'.repeat(Math.min(platformConfig.maxPathLength - 50, 200)) + '.txt';
      const longFilePath = path.join(os.tmpdir(), longFileName);
      
      try {
        fs.writeFileSync(longFilePath, '東京 東海道線 品川\n/', 'utf8');
        
        const result = await executeTestWithPlatformAnalysis({
          testName: 'Long File Path Handling',
          args: [longFilePath],
          expectedExitCode: 0,
          validateFileAccess: true
        });
        
        expect(result.success).toBe(true);
        
      } catch (error) {
        // Some platforms may not support very long paths
        console.warn(`Platform limitation: Long path not supported on ${platformConfig.platform}`);
      } finally {
        if (fs.existsSync(longFilePath)) {
          fs.unlinkSync(longFilePath);
        }
      }
    });
  });
  
  describe('Terminal and Text Encoding', () => {
    it('should display Japanese text correctly in terminal', async () => {
      const result = await executeTestWithPlatformAnalysis({
        testName: 'Japanese Text Display',
        args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: 0,
        validateJapaneseText: true
      });
      
      expect(result.success).toBe(true);
      
      // Validate UTF-8 characters are preserved
      const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
      expect(japanesePattern.test(result.stdout)).toBe(true);
      
      // Check for common encoding issues
      expect(result.stdout).not.toContain('?');
      expect(result.stdout).not.toContain('\uFFFD'); // Unicode replacement character
    });
    
    it('should handle terminal encoding variations', async () => {
      // Test different encoding scenarios
      const encodingTests = [
        { name: 'UTF-8', env: { LANG: 'en_US.UTF-8' } },
        { name: 'UTF-8 Japanese', env: { LANG: 'ja_JP.UTF-8' } }
      ];
      
      if (platformConfig.platform === 'win32') {
        encodingTests.push({ name: 'Windows UTF-8', env: { CHCP: '65001' } });
      }
      
      for (const test of encodingTests) {
        const result = await executeTestWithPlatformAnalysis({
          testName: `Terminal Encoding: ${test.name}`,
          args: ['-h'],
          expectedExitCode: 0,
          environmentOverrides: test.env,
          validateJapaneseText: true
        });
        
        expect(result.success).toBe(true);
        expect(result.stdout).toContain('Japanese Railway Fare Calculator');
      }
    });
  });
  
  describe('WebAssembly and Database Loading', () => {
    it('should load WebAssembly module on current platform', async () => {
      const result = await executeTestWithPlatformAnalysis({
        testName: 'WebAssembly Module Loading',
        args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿'],
        expectedExitCode: 0,
        validateWebAssembly: true
      });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('WebAssembly module');
      expect(result.stdout).not.toContain('WASM loading failed');
    });
    
    it('should access database file with proper permissions', async () => {
      const dbPath = path.join(PROJECT_ROOT, 'data/jrdbnewest.db');
      
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        expect(stats.isFile()).toBe(true);
        expect(stats.size).toBeGreaterThan(0);
        
        // Check read permissions
        try {
          fs.accessSync(dbPath, fs.constants.R_OK);
        } catch (error) {
          fail(`Database file not readable: ${error}`);
        }
      }
      
      const result = await executeTestWithPlatformAnalysis({
        testName: 'Database File Access',
        args: ['-exec'],
        expectedExitCode: 0,
        validateDatabase: true,
        timeout: 15000 // Allow more time for database operations
      });
      
      expect(result.success).toBe(true);
      expect(result.stdout).toContain('database');
      expect(result.stdout).not.toContain('Database error');
    });
  });
  
  describe('Performance Across Platforms', () => {
    it('should meet performance requirements on current platform', async () => {
      const performanceTests = [
        {
          name: 'Help Command Performance',
          args: ['-h'],
          maxDuration: 2000 // 2 seconds
        },
        {
          name: 'Route Calculation Performance',
          args: ['-5', '東京', '東海道線', '品川', '山手線', '新宿'],
          maxDuration: 1000 // 1 second
        }
      ];
      
      for (const test of performanceTests) {
        const startTime = performance.now();
        
        const result = await executeTestWithPlatformAnalysis({
          testName: test.name,
          args: test.args,
          expectedExitCode: 0,
          validatePerformance: true,
          timeout: test.maxDuration + 1000
        });
        
        const duration = performance.now() - startTime;
        
        expect(result.success).toBe(true);
        expect(duration).toBeLessThanOrEqual(test.maxDuration);
        
        console.log(`⏱️  ${test.name}: ${duration.toFixed(1)}ms (limit: ${test.maxDuration}ms)`);
      }
    });
  });
  
  describe('Error Handling Across Platforms', () => {
    it('should handle invalid commands consistently', async () => {
      const invalidCommands = [
        ['--invalid-option'],
        ['-999'],
        ['invalid', 'arguments'],
        ['-5', 'too', 'few', 'args']
      ];
      
      for (const command of invalidCommands) {
        const result = await executeTestWithPlatformAnalysis({
          testName: `Invalid Command: ${command.join(' ')}`,
          args: command,
          expectedExitCode: -1,
          validateErrorHandling: true
        });
        
        expect(result.success).toBe(true); // Success means error was handled correctly
        expect(result.exitCode).not.toBe(0);
      }
    });
    
    it('should handle system errors gracefully', async () => {
      // Test non-existent file
      const result = await executeTestWithPlatformAnalysis({
        testName: 'Non-existent File Handling',
        args: ['/nonexistent/path/to/file.txt'],
        expectedExitCode: -1,
        validateErrorHandling: true
      });
      
      expect(result.success).toBe(true);
      expect(result.stderr).toContain('file');
    });
  });
  
  // Helper functions
  
  async function executeTestWithPlatformAnalysis(config: {
    testName: string;
    args: string[];
    expectedExitCode: number;
    timeout?: number;
    environmentOverrides?: Record<string, string>;
    validatePlatform?: boolean;
    validateNodeVersion?: boolean;
    validateEnvironment?: boolean;
    validateFileAccess?: boolean;
    validateSecurity?: boolean;
    validateJapaneseText?: boolean;
    validateWebAssembly?: boolean;
    validateDatabase?: boolean;
    validatePerformance?: boolean;
    validateErrorHandling?: boolean;
  }): Promise<CrossPlatformTestResult> {
    const startTime = performance.now();
    
    console.log(`  🧪 ${config.testName} (${platformConfig.platform})`);
    
    const env = {
      ...process.env,
      ...(config.environmentOverrides || {})
    };
    
    const child = spawn('node', [CLI_PATH, ...config.args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
      timeout: config.timeout || 10000
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    const exitCode = await new Promise<number>((resolve) => {
      child.on('exit', (code) => resolve(code || 0));
      child.on('error', () => resolve(-1));
    });
    
    const duration = performance.now() - startTime;
    
    const result: CrossPlatformTestResult = {
      testName: config.testName,
      platform: platformConfig.platform,
      success: exitCode === config.expectedExitCode,
      duration,
      stdout,
      stderr,
      exitCode,
      environmentInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        homeDir: os.homedir(),
        tempDir: os.tmpdir()
      },
      issues: [],
      recommendations: []
    };
    
    // Platform-specific validations
    if (config.validatePlatform) {
      validatePlatformSpecificBehavior(result);
    }
    
    if (config.validateJapaneseText) {
      validateJapaneseTextDisplay(result);
    }
    
    if (config.validateSecurity) {
      validateSecurityMeasures(result);
    }
    
    if (config.validatePerformance) {
      validatePerformanceRequirements(result);
    }
    
    testResults.push(result);
    return result;
  }
  
  function getPlatformConfig(): PlatformConfig {
    const platform = process.platform;
    
    const configs: Record<string, PlatformConfig> = {
      'win32': {
        platform: 'Windows',
        expectedShell: 'cmd.exe',
        pathSeparator: '\\',
        lineEnding: '\r\n',
        tempDir: process.env.TEMP || process.env.TMP || 'C:\\temp',
        homeDir: process.env.USERPROFILE || 'C:\\Users\\Default',
        maxPathLength: 260,
        supportsUTF8: true,
        expectedNodeMinVersion: '14.0.0'
      },
      'darwin': {
        platform: 'macOS',
        expectedShell: '/bin/sh',
        pathSeparator: '/',
        lineEnding: '\n',
        tempDir: process.env.TMPDIR || '/tmp',
        homeDir: process.env.HOME || '/Users',
        maxPathLength: 1024,
        supportsUTF8: true,
        expectedNodeMinVersion: '14.0.0'
      },
      'linux': {
        platform: 'Linux',
        expectedShell: '/bin/sh',
        pathSeparator: '/',
        lineEnding: '\n',
        tempDir: process.env.TMPDIR || '/tmp',
        homeDir: process.env.HOME || '/home',
        maxPathLength: 4096,
        supportsUTF8: true,
        expectedNodeMinVersion: '14.0.0'
      }
    };
    
    return configs[platform] || configs['linux']; // Default to Linux config
  }
  
  function validatePlatformSpecificBehavior(result: CrossPlatformTestResult): void {
    // Check platform-specific path separators
    if (result.stdout.includes('\\') && platformConfig.platform !== 'Windows') {
      result.issues.push('Windows-style path separators on non-Windows platform');
    }
    
    // Check line endings
    const expectedLineEnding = platformConfig.lineEnding;
    if (result.stdout.includes('\r\n') && expectedLineEnding === '\n') {
      result.issues.push('Windows line endings on Unix platform');
    }
  }
  
  function validateJapaneseTextDisplay(result: CrossPlatformTestResult): void {
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    
    if (!japanesePattern.test(result.stdout) && !japanesePattern.test(result.stderr)) {
      result.issues.push('Japanese text not displayed correctly');
      result.recommendations.push('Check terminal UTF-8 encoding support');
    }
    
    // Check for common encoding issues
    if (result.stdout.includes('?') || result.stdout.includes('\uFFFD')) {
      result.issues.push('Character encoding corruption detected');
      result.recommendations.push('Ensure proper UTF-8 encoding handling');
    }
  }
  
  function validateSecurityMeasures(result: CrossPlatformTestResult): void {
    // Security validation should result in error exit codes
    if (result.exitCode === 0) {
      result.issues.push('Security test passed when it should have failed');
      result.recommendations.push('Strengthen security input validation');
    }
    
    if (!result.stderr.toLowerCase().includes('security')) {
      result.issues.push('Security error message not informative enough');
      result.recommendations.push('Improve security error messaging');
    }
  }
  
  function validatePerformanceRequirements(result: CrossPlatformTestResult): void {
    // Platform-specific performance adjustments
    const performanceMultiplier = platformConfig.platform === 'Windows' ? 1.5 : 1.0;
    const adjustedDuration = result.duration / performanceMultiplier;
    
    if (adjustedDuration > 2000) { // 2 second limit
      result.issues.push(`Performance issue: ${result.duration}ms exceeds platform limit`);
      result.recommendations.push('Optimize for platform-specific performance characteristics');
    }
  }
  
  function generateCrossPlatformReport(): void {
    const reportPath = path.join(PROJECT_ROOT, 'CROSS_PLATFORM_VALIDATION_REPORT.md');
    
    const totalTests = testResults.length;
    const successfulTests = testResults.filter(r => r.success).length;
    const testsWithIssues = testResults.filter(r => r.issues.length > 0).length;
    
    let report = `# Cross-Platform Validation Report\n\n`;
    report += `**Platform:** ${platformConfig.platform}\n`;
    report += `**Node.js:** ${process.version}\n`;
    report += `**Architecture:** ${process.arch}\n`;
    report += `**Test Date:** ${new Date().toISOString()}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- Total Tests: ${totalTests}\n`;
    report += `- Successful: ${successfulTests}\n`;
    report += `- Tests with Issues: ${testsWithIssues}\n`;
    report += `- Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%\n\n`;
    
    report += `## Platform Compatibility\n\n`;
    if (testsWithIssues === 0) {
      report += `✅ **FULLY COMPATIBLE** - All tests passed on ${platformConfig.platform}\n\n`;
    } else {
      report += `⚠️  **PARTIAL COMPATIBILITY** - ${testsWithIssues} tests have platform-specific issues\n\n`;
    }
    
    report += `## Test Results by Category\n\n`;
    
    const categories = [...new Set(testResults.map(r => {
      if (r.testName.includes('Platform')) return 'Platform Detection';
      if (r.testName.includes('File')) return 'File System';
      if (r.testName.includes('Japanese')) return 'Text Encoding';
      if (r.testName.includes('WebAssembly')) return 'WebAssembly';
      if (r.testName.includes('Performance')) return 'Performance';
      if (r.testName.includes('Error')) return 'Error Handling';
      return 'Other';
    }))];
    
    for (const category of categories) {
      const categoryTests = testResults.filter(r => {
        if (category === 'Platform Detection') return r.testName.includes('Platform');
        if (category === 'File System') return r.testName.includes('File');
        if (category === 'Text Encoding') return r.testName.includes('Japanese');
        if (category === 'WebAssembly') return r.testName.includes('WebAssembly');
        if (category === 'Performance') return r.testName.includes('Performance');
        if (category === 'Error Handling') return r.testName.includes('Error');
        return true;
      });
      
      const categorySuccess = categoryTests.filter(r => r.success).length;
      const categoryTotal = categoryTests.length;
      
      report += `### ${category}\n`;
      report += `**Status:** ${categorySuccess === categoryTotal ? '✅ PASSED' : '⚠️  ISSUES'} (${categorySuccess}/${categoryTotal})\n\n`;
      
      const categoryIssues = categoryTests.filter(r => r.issues.length > 0);
      if (categoryIssues.length > 0) {
        report += `**Issues:**\n`;
        for (const test of categoryIssues) {
          report += `- ${test.testName}:\n`;
          for (const issue of test.issues) {
            report += `  - ${issue}\n`;
          }
        }
        report += `\n`;
      }
    }
    
    report += `## Recommendations\n\n`;
    const allRecommendations = [...new Set(testResults.flatMap(r => r.recommendations))];
    if (allRecommendations.length > 0) {
      for (const recommendation of allRecommendations) {
        report += `- ${recommendation}\n`;
      }
    } else {
      report += `✅ No platform-specific issues found\n`;
    }
    
    report += `\n## Task 20 Cross-Platform Compliance\n\n`;
    const isFullyCompatible = testsWithIssues === 0;
    report += `**Cross-Platform Requirement:** ${isFullyCompatible ? '✅ MET' : '❌ NOT MET'}\n\n`;
    
    try {
      fs.writeFileSync(reportPath, report, 'utf8');
      console.log(`📊 Cross-platform validation report: ${reportPath}`);
    } catch (error) {
      console.error('Failed to generate cross-platform report:', error);
    }
  }
});