/**
 * Test Executor Utilities - Task 15
 * Helper functions for executing CLI tests with comprehensive monitoring
 * Requirements: REQ-CLI-002.2, REQ-CLI-002.3, REQ-CLI-002.5
 * 
 * This module provides utilities for:
 * - Safe CLI execution with timeouts and monitoring
 * - Performance measurement and validation
 * - Memory usage tracking
 * - Error handling and recovery
 * - Result validation and reporting
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { performance } from 'perf_hooks';
import { parseCliResult } from './result-parser';

/**
 * Test execution configuration
 */
export interface TestExecutionConfig {
  timeout?: number;
  memoryLimit?: number; // in bytes
  retryAttempts?: number;
  retryDelay?: number; // in milliseconds
  monitorMemory?: boolean;
  monitorPerformance?: boolean;
  captureDebugOutput?: boolean;
  environment?: Record<string, string>;
  workingDirectory?: string;
}

/**
 * Test execution result with comprehensive metrics
 */
export interface TestExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  memoryUsage?: MemoryUsageInfo;
  performanceMetrics?: PerformanceInfo;
  retryAttempts?: number;
  errorDetails?: string;
  parsedResult?: any;
  validationResults?: ValidationResult[];
}

/**
 * Memory usage information
 */
export interface MemoryUsageInfo {
  peakHeapUsed: number;
  peakHeapTotal: number;
  peakRss: number;
  peakExternal: number;
  samples: number;
  exceedsLimit: boolean;
}

/**
 * Performance information
 */
export interface PerformanceInfo {
  startupTime?: number;
  executionTime: number;
  cliInitTime?: number;
  wasmLoadTime?: number;
  dbInitTime?: number;
  calculationTime?: number;
  meetsRequirements: boolean;
  violations: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  type: 'fare' | 'route' | 'output' | 'performance' | 'memory' | 'error';
  passed: boolean;
  message: string;
  expected?: any;
  actual?: any;
  tolerance?: number;
}

/**
 * Default test execution configuration
 */
export const DEFAULT_TEST_CONFIG: TestExecutionConfig = {
  timeout: 30000, // 30 seconds
  memoryLimit: 512 * 1024 * 1024, // 512MB
  retryAttempts: 1,
  retryDelay: 1000, // 1 second
  monitorMemory: true,
  monitorPerformance: true,
  captureDebugOutput: false,
  environment: { NODE_ENV: 'test' }
};

/**
 * Safe CLI executor with comprehensive monitoring
 */
export class CliTestExecutor {
  private cliPath: string;
  private config: TestExecutionConfig;
  private processMetrics: Map<number, any> = new Map();

  constructor(cliPath: string, config: Partial<TestExecutionConfig> = {}) {
    this.cliPath = cliPath;
    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
    
    // Verify CLI path exists
    if (!fs.existsSync(this.cliPath)) {
      throw new Error(`CLI path does not exist: ${this.cliPath}`);
    }
  }

  /**
   * Execute CLI command with comprehensive monitoring
   */
  async execute(args: string[], testName?: string): Promise<TestExecutionResult> {
    const config = this.config;
    let attempt = 0;
    let lastError: any = null;
    
    while (attempt <= (config.retryAttempts || 0)) {
      try {
        const result = await this.executeSingle(args, attempt, testName);
        if (result.success || attempt === config.retryAttempts) {
          result.retryAttempts = attempt;
          return result;
        }
        lastError = result.errorDetails;
      } catch (error) {
        lastError = error;
      }
      
      attempt++;
      if (attempt <= (config.retryAttempts || 0) && config.retryDelay) {
        await this.delay(config.retryDelay);
      }
    }
    
    // If all attempts failed, return the last attempt result
    return {
      success: false,
      exitCode: -1,
      stdout: '',
      stderr: '',
      duration: 0,
      retryAttempts: attempt,
      errorDetails: `All ${attempt} attempts failed. Last error: ${lastError}`
    };
  }

  /**
   * Execute single CLI command attempt
   */
  private async executeSingle(
    args: string[], 
    attempt: number, 
    testName?: string
  ): Promise<TestExecutionResult> {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let resolved = false;
      let memoryMonitor: NodeJS.Timeout | null = null;
      
      const memoryUsage: MemoryUsageInfo = {
        peakHeapUsed: 0,
        peakHeapTotal: 0,
        peakRss: 0,
        peakExternal: 0,
        samples: 0,
        exceedsLimit: false
      };
      
      const env = {
        ...process.env,
        ...this.config.environment
      };
      
      if (this.config.captureDebugOutput) {
        env.CLI_DEBUG = '1';
      }
      
      const child: ChildProcess = spawn('node', [this.cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
        cwd: this.config.workingDirectory || process.cwd()
      });
      
      const childPid = child.pid;
      
      // Set up memory monitoring
      if (this.config.monitorMemory && childPid) {
        memoryMonitor = setInterval(() => {
          try {
            const usage = process.memoryUsage();
            memoryUsage.peakHeapUsed = Math.max(memoryUsage.peakHeapUsed, usage.heapUsed);
            memoryUsage.peakHeapTotal = Math.max(memoryUsage.peakHeapTotal, usage.heapTotal);
            memoryUsage.peakRss = Math.max(memoryUsage.peakRss, usage.rss);
            memoryUsage.peakExternal = Math.max(memoryUsage.peakExternal, usage.external);
            memoryUsage.samples++;
            
            if (this.config.memoryLimit && usage.heapUsed > this.config.memoryLimit) {
              memoryUsage.exceedsLimit = true;
              console.warn(`Memory limit exceeded: ${(usage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
            }
          } catch (error) {
            // Memory monitoring failed, continue without it
          }
        }, 100); // Sample every 100ms
      }
      
      // Set up timeout
      const timer = setTimeout(() => {
        if (!resolved) {
          if (memoryMonitor) clearInterval(memoryMonitor);
          child.kill('SIGTERM');
          
          const duration = performance.now() - startTime;
          resolve({
            success: false,
            exitCode: -1,
            stdout,
            stderr,
            duration,
            memoryUsage: this.config.monitorMemory ? memoryUsage : undefined,
            errorDetails: `Command timed out after ${this.config.timeout}ms`
          });
          resolved = true;
        }
      }, this.config.timeout || 30000);
      
      // Collect output
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });
      }
      
      if (child.stderr) {
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      }
      
      // Handle completion
      child.on('exit', (code) => {
        if (!resolved) {
          clearTimeout(timer);
          if (memoryMonitor) clearInterval(memoryMonitor);
          
          const duration = performance.now() - startTime;
          const exitCode = code || 0;
          
          // Parse results
          const parsedResult = parseCliResult(stdout, stderr, duration, exitCode);
          
          // Generate performance metrics
          const performanceMetrics = this.generatePerformanceMetrics(
            duration, stdout, stderr
          );
          
          // Generate validation results
          const validationResults = this.validateResults(
            exitCode, stdout, stderr, duration, memoryUsage
          );
          
          resolve({
            success: exitCode === 0,
            exitCode,
            stdout,
            stderr,
            duration,
            memoryUsage: this.config.monitorMemory ? memoryUsage : undefined,
            performanceMetrics,
            parsedResult,
            validationResults
          });
          resolved = true;
        }
      });
      
      child.on('error', (error) => {
        if (!resolved) {
          clearTimeout(timer);
          if (memoryMonitor) clearInterval(memoryMonitor);
          
          const duration = performance.now() - startTime;
          resolve({
            success: false,
            exitCode: -1,
            stdout,
            stderr,
            duration,
            memoryUsage: this.config.monitorMemory ? memoryUsage : undefined,
            errorDetails: `Process error: ${error.message}`
          });
          resolved = true;
        }
      });
    });
  }

  /**
   * Generate performance metrics from execution
   */
  private generatePerformanceMetrics(
    duration: number,
    stdout: string,
    stderr: string
  ): PerformanceInfo {
    const violations: string[] = [];
    
    // Check startup time requirement (≤2 seconds)
    if (duration > 2000) {
      violations.push(`Startup time ${duration.toFixed(1)}ms exceeds 2000ms limit`);
    }
    
    // Extract specific timing information from output
    let startupTime: number | undefined;
    let wasmLoadTime: number | undefined;
    let dbInitTime: number | undefined;
    let calculationTime: number | undefined;
    
    const timingPatterns = [
      { key: 'startup', pattern: /CLI startup.*?(\d+(?:\.\d+)?)\s*ms/, target: 'startupTime' },
      { key: 'wasm', pattern: /WASM.*load.*?(\d+(?:\.\d+)?)\s*ms/, target: 'wasmLoadTime' },
      { key: 'db', pattern: /Database.*init.*?(\d+(?:\.\d+)?)\s*ms/, target: 'dbInitTime' },
      { key: 'calc', pattern: /Route calculation.*?(\d+(?:\.\d+)?)\s*ms/, target: 'calculationTime' }
    ];
    
    const combinedOutput = stdout + stderr;
    for (const { pattern, target } of timingPatterns) {
      const match = combinedOutput.match(pattern);
      if (match) {
        const value = parseFloat(match[1]);
        if (!isNaN(value)) {
          switch (target) {
            case 'startupTime': startupTime = value; break;
            case 'wasmLoadTime': wasmLoadTime = value; break;
            case 'dbInitTime': dbInitTime = value; break;
            case 'calculationTime': calculationTime = value; break;
          }
        }
      }
    }
    
    // Check calculation time requirement (≤1 second)
    if (calculationTime && calculationTime > 1000) {
      violations.push(`Calculation time ${calculationTime.toFixed(1)}ms exceeds 1000ms limit`);
    }
    
    return {
      startupTime,
      executionTime: duration,
      wasmLoadTime,
      dbInitTime,
      calculationTime,
      meetsRequirements: violations.length === 0,
      violations
    };
  }

  /**
   * Validate execution results
   */
  private validateResults(
    exitCode: number,
    stdout: string,
    stderr: string,
    duration: number,
    memoryUsage: MemoryUsageInfo
  ): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    // Performance validation
    results.push({
      type: 'performance',
      passed: duration <= 2000,
      message: `Execution time: ${duration.toFixed(1)}ms`,
      expected: '≤2000ms',
      actual: `${duration.toFixed(1)}ms`
    });
    
    // Memory validation
    if (this.config.monitorMemory && this.config.memoryLimit) {
      results.push({
        type: 'memory',
        passed: !memoryUsage.exceedsLimit,
        message: `Peak memory usage: ${(memoryUsage.peakHeapUsed / 1024 / 1024).toFixed(1)}MB`,
        expected: `≤${(this.config.memoryLimit / 1024 / 1024).toFixed(0)}MB`,
        actual: `${(memoryUsage.peakHeapUsed / 1024 / 1024).toFixed(1)}MB`
      });
    }
    
    // Output validation
    results.push({
      type: 'output',
      passed: stdout.length > 0 || stderr.length > 0,
      message: `Output received: ${stdout.length + stderr.length} characters`
    });
    
    // Error validation
    if (exitCode !== 0) {
      results.push({
        type: 'error',
        passed: stderr.length > 0 || stdout.includes('❌'),
        message: `Exit code ${exitCode} with appropriate error message`,
        expected: 'Error message present',
        actual: stderr.length > 0 ? 'Error in stderr' : stdout.includes('❌') ? 'Error in stdout' : 'No error message'
      });
    }
    
    return results;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.processMetrics.clear();
  }
}

/**
 * Batch test executor for running multiple tests efficiently
 */
export class BatchTestExecutor {
  private executor: CliTestExecutor;
  private results: Map<string, TestExecutionResult> = new Map();
  private startTime: number = 0;

  constructor(cliPath: string, config?: Partial<TestExecutionConfig>) {
    this.executor = new CliTestExecutor(cliPath, config);
  }

  /**
   * Execute multiple test cases
   */
  async executeTests(testCases: Array<{
    name: string;
    args: string[];
    config?: Partial<TestExecutionConfig>;
  }>): Promise<Map<string, TestExecutionResult>> {
    this.startTime = performance.now();
    
    console.log(`🚀 Starting batch execution of ${testCases.length} tests`);
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      console.log(`\n[${i + 1}/${testCases.length}] Executing: ${testCase.name}`);
      
      try {
        // Create executor with test-specific config if provided
        const testExecutor = testCase.config 
          ? new CliTestExecutor(this.executor['cliPath'], {
              ...this.executor['config'],
              ...testCase.config
            })
          : this.executor;
        
        const result = await testExecutor.execute(testCase.args, testCase.name);
        this.results.set(testCase.name, result);
        
        if (result.success) {
          console.log(`✅ ${testCase.name} passed (${result.duration.toFixed(1)}ms)`);
        } else {
          console.log(`❌ ${testCase.name} failed (${result.duration.toFixed(1)}ms)`);
          if (result.errorDetails) {
            console.log(`   Error: ${result.errorDetails}`);
          }
        }
        
        // Cleanup if using test-specific executor
        if (testCase.config && testExecutor !== this.executor) {
          testExecutor.cleanup();
        }
        
      } catch (error) {
        console.error(`💥 ${testCase.name} crashed: ${error}`);
        this.results.set(testCase.name, {
          success: false,
          exitCode: -1,
          stdout: '',
          stderr: '',
          duration: 0,
          errorDetails: `Test execution crashed: ${error}`
        });
      }
    }
    
    const totalTime = performance.now() - this.startTime;
    console.log(`\n🏁 Batch execution completed in ${(totalTime / 1000).toFixed(2)}s`);
    
    return this.results;
  }

  /**
   * Get batch execution summary
   */
  getSummary(): {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    totalExecutionTime: number;
    averageTestTime: number;
    performanceViolations: number;
    memoryViolations: number;
  } {
    const results = Array.from(this.results.values());
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalExecutionTime = performance.now() - this.startTime;
    const averageTestTime = results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    
    let performanceViolations = 0;
    let memoryViolations = 0;
    
    for (const result of results) {
      if (result.performanceMetrics && !result.performanceMetrics.meetsRequirements) {
        performanceViolations++;
      }
      if (result.memoryUsage && result.memoryUsage.exceedsLimit) {
        memoryViolations++;
      }
    }
    
    return {
      totalTests,
      passedTests,
      failedTests,
      totalExecutionTime,
      averageTestTime,
      performanceViolations,
      memoryViolations
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.executor.cleanup();
    this.results.clear();
  }
}