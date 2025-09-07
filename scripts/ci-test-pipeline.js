#!/usr/bin/env node

/**
 * CI/CD Testing Pipeline Integration Script
 * Task 19: Create automated CLI testing pipeline integration
 * 
 * This script provides comprehensive CI/CD testing automation with:
 * - Test result aggregation and reporting
 * - Pipeline status validation
 * - Exit code management for CI/CD systems
 * - Machine-readable test outputs
 * - Performance monitoring integration
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * CI/CD Pipeline Test Runner Configuration
 */
class CIPipelineTestRunner {
    constructor() {
        this.projectRoot = process.cwd();
        this.testResults = {
            timestamp: new Date().toISOString(),
            success: false,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            executionTime: 0,
            errors: [],
            warnings: [],
            performance: {
                buildTime: 0,
                testTime: 0,
                memoryPeak: 0
            }
        };
        this.startTime = Date.now();
    }

    log(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const prefix = {
            'INFO': '📋',
            'SUCCESS': '✅',
            'ERROR': '❌',
            'WARNING': '⚠️',
            'DEBUG': '🔍'
        }[level] || '🔧';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
        
        // Store structured logs for CI/CD consumption
        if (level === 'ERROR') {
            this.testResults.errors.push({ message, metadata, timestamp });
        } else if (level === 'WARNING') {
            this.testResults.warnings.push({ message, metadata, timestamp });
        }
    }

    /**
     * Validate CI/CD environment requirements (REQ-CLI-005.2)
     */
    async validateEnvironment() {
        this.log('INFO', 'Validating CI/CD environment...');
        
        const checks = [
            { name: 'Node.js Version', check: () => this.checkNodeVersion() },
            { name: 'NPM Version', check: () => this.checkNpmVersion() },
            { name: 'Emscripten SDK', check: () => this.checkEmscriptenSDK() },
            { name: 'Project Structure', check: () => this.checkProjectStructure() },
            { name: 'Build Artifacts', check: () => this.checkBuildArtifacts() }
        ];

        let allPassed = true;
        for (const checkItem of checks) {
            try {
                const result = await checkItem.check();
                if (result.success) {
                    this.log('SUCCESS', `${checkItem.name}: ${result.message}`);
                } else {
                    this.log('ERROR', `${checkItem.name}: ${result.message}`);
                    allPassed = false;
                }
            } catch (error) {
                this.log('ERROR', `${checkItem.name}: ${error.message}`);
                allPassed = false;
            }
        }

        return allPassed;
    }

    checkNodeVersion() {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return {
            success: major >= 14,
            message: `${version} ${major >= 14 ? '(✓ Compatible)' : '(✗ Requires >=14.0.0)'}`
        };
    }

    checkNpmVersion() {
        try {
            const version = execSync('npm -v', { encoding: 'utf8' }).trim();
            const major = parseInt(version.split('.')[0]);
            return {
                success: major >= 6,
                message: `${version} ${major >= 6 ? '(✓ Compatible)' : '(✗ Requires >=6.0.0)'}`
            };
        } catch (error) {
            return { success: false, message: 'NPM not found or not accessible' };
        }
    }

    checkEmscriptenSDK() {
        const emsdkPath = path.join(process.env.HOME || '~', 'priv/farert.repos/emsdk/');
        const setupEnvPath = path.join(this.projectRoot, 'setup_env.sh');
        
        return {
            success: fs.existsSync(emsdkPath) && fs.existsSync(setupEnvPath),
            message: fs.existsSync(emsdkPath) && fs.existsSync(setupEnvPath) 
                ? 'Emscripten SDK and setup script available'
                : 'Emscripten SDK or setup_env.sh missing'
        };
    }

    checkProjectStructure() {
        const requiredPaths = [
            'src/cli',
            'src/core',
            'src/include',
            'package.json',
            'tsconfig.cli.json',
            'Makefile'
        ];

        const missing = requiredPaths.filter(p => !fs.existsSync(path.join(this.projectRoot, p)));
        return {
            success: missing.length === 0,
            message: missing.length === 0 
                ? 'All required project files present'
                : `Missing: ${missing.join(', ')}`
        };
    }

    checkBuildArtifacts() {
        const artifacts = ['dist/farert.js', 'dist/farert.wasm'];
        const present = artifacts.filter(a => fs.existsSync(path.join(this.projectRoot, a)));
        
        return {
            success: present.length === artifacts.length,
            message: `${present.length}/${artifacts.length} artifacts present ${present.length < artifacts.length ? '(run: npm run build:wasm)' : ''}`
        };
    }

    /**
     * Execute comprehensive build pipeline with performance tracking
     */
    async executeBuild() {
        this.log('INFO', 'Starting comprehensive build pipeline...');
        const buildStartTime = Date.now();

        try {
            // Clean previous build artifacts
            this.log('INFO', 'Cleaning previous build artifacts...');
            execSync('npm run clean', { stdio: 'inherit' });

            // Build WebAssembly modules
            this.log('INFO', 'Building WebAssembly modules...');
            execSync('npm run build:wasm', { stdio: 'inherit' });

            // Build TypeScript CLI
            this.log('INFO', 'Building TypeScript CLI...');
            execSync('npm run build:cli', { stdio: 'inherit' });

            this.testResults.performance.buildTime = (Date.now() - buildStartTime) / 1000;
            this.log('SUCCESS', `Build completed in ${this.testResults.performance.buildTime.toFixed(2)}s`);
            return true;

        } catch (error) {
            this.testResults.performance.buildTime = (Date.now() - buildStartTime) / 1000;
            this.log('ERROR', `Build failed after ${this.testResults.performance.buildTime.toFixed(2)}s: ${error.message}`);
            return false;
        }
    }

    /**
     * Execute comprehensive test suite with result aggregation
     */
    async executeTests() {
        this.log('INFO', 'Starting comprehensive test suite execution...');
        const testStartTime = Date.now();

        try {
            // Run CLI exec tests (main test suite)
            this.log('INFO', 'Executing CLI test suite...');
            const cliResult = await this.executeCliTests();
            
            // Run unit tests
            this.log('INFO', 'Executing unit test suite...');
            const unitResult = await this.executeUnitTests();
            
            // Run integration tests
            this.log('INFO', 'Executing integration test suite...');
            const integrationResult = await this.executeIntegrationTests();

            // Aggregate results
            this.testResults.performance.testTime = (Date.now() - testStartTime) / 1000;
            this.aggregateTestResults([cliResult, unitResult, integrationResult]);

            this.log('SUCCESS', `All tests completed in ${this.testResults.performance.testTime.toFixed(2)}s`);
            return this.testResults.success;

        } catch (error) {
            this.testResults.performance.testTime = (Date.now() - testStartTime) / 1000;
            this.log('ERROR', `Test execution failed after ${this.testResults.performance.testTime.toFixed(2)}s: ${error.message}`);
            return false;
        }
    }

    /**
     * Execute CLI tests with result parsing
     */
    async executeCliTests() {
        return new Promise((resolve) => {
            this.log('INFO', 'Running CLI test execution...');
            
            const child = spawn('node', ['dist/cli/cli/main.js', '-exec'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.projectRoot
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    name: 'CLI Tests',
                    success: code === 0,
                    exitCode: code,
                    stdout,
                    stderr,
                    tests: this.parseCliTestResults(stdout)
                };

                if (code === 0) {
                    this.log('SUCCESS', 'CLI tests passed');
                } else {
                    this.log('ERROR', `CLI tests failed with exit code ${code}`);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                this.log('ERROR', `CLI test execution error: ${error.message}`);
                resolve({
                    name: 'CLI Tests',
                    success: false,
                    exitCode: -1,
                    stdout: '',
                    stderr: error.message,
                    tests: { total: 0, passed: 0, failed: 1 }
                });
            });
        });
    }

    /**
     * Execute unit tests
     */
    async executeUnitTests() {
        return new Promise((resolve) => {
            this.log('INFO', 'Running unit tests...');
            
            const child = spawn('npm', ['run', 'test:unit'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.projectRoot
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    name: 'Unit Tests',
                    success: code === 0,
                    exitCode: code,
                    stdout,
                    stderr,
                    tests: this.parseUnitTestResults(stdout)
                };

                if (code === 0) {
                    this.log('SUCCESS', 'Unit tests passed');
                } else {
                    this.log('ERROR', `Unit tests failed with exit code ${code}`);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                this.log('ERROR', `Unit test execution error: ${error.message}`);
                resolve({
                    name: 'Unit Tests',
                    success: false,
                    exitCode: -1,
                    stdout: '',
                    stderr: error.message,
                    tests: { total: 0, passed: 0, failed: 1 }
                });
            });
        });
    }

    /**
     * Execute integration tests
     */
    async executeIntegrationTests() {
        return new Promise((resolve) => {
            this.log('INFO', 'Running integration tests...');
            
            const child = spawn('npm', ['run', 'test:integration'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.projectRoot
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                const result = {
                    name: 'Integration Tests',
                    success: code === 0,
                    exitCode: code,
                    stdout,
                    stderr,
                    tests: this.parseIntegrationTestResults(stdout)
                };

                if (code === 0) {
                    this.log('SUCCESS', 'Integration tests passed');
                } else {
                    this.log('ERROR', `Integration tests failed with exit code ${code}`);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                this.log('ERROR', `Integration test execution error: ${error.message}`);
                resolve({
                    name: 'Integration Tests',
                    success: false,
                    exitCode: -1,
                    stdout: '',
                    stderr: error.message,
                    tests: { total: 0, passed: 0, failed: 1 }
                });
            });
        });
    }

    /**
     * Parse CLI test results from output
     */
    parseCliTestResults(output) {
        // Default values
        let total = 0;
        let passed = 0;
        let failed = 0;

        // Look for test result patterns in CLI output
        const resultPatterns = [
            /Test Results:\s*(\d+)\/(\d+)\s*passed/,
            /Total tests:\s*(\d+).*passed:\s*(\d+).*failed:\s*(\d+)/,
            /(\d+)\s*tests.*(\d+)\s*passed.*(\d+)\s*failed/
        ];

        for (const pattern of resultPatterns) {
            const match = output.match(pattern);
            if (match) {
                if (match.length === 3) {
                    // Format: passed/total
                    passed = parseInt(match[1]);
                    total = parseInt(match[2]);
                    failed = total - passed;
                } else if (match.length === 4) {
                    // Format: total, passed, failed
                    total = parseInt(match[1]);
                    passed = parseInt(match[2]);
                    failed = parseInt(match[3]);
                }
                break;
            }
        }

        return { total, passed, failed };
    }

    /**
     * Parse unit test results from output
     */
    parseUnitTestResults(output) {
        // Simple parsing - can be enhanced based on actual test runner output
        const successPattern = /(\d+)\s*tests?\s*passed/i;
        const failurePattern = /(\d+)\s*tests?\s*failed/i;

        let total = 0;
        let passed = 0;
        let failed = 0;

        const passMatch = output.match(successPattern);
        const failMatch = output.match(failurePattern);

        if (passMatch) passed = parseInt(passMatch[1]);
        if (failMatch) failed = parseInt(failMatch[1]);
        total = passed + failed;

        // If no specific patterns found, assume single test
        if (total === 0) {
            total = 1;
            passed = output.includes('✅') || output.includes('SUCCESS') ? 1 : 0;
            failed = total - passed;
        }

        return { total, passed, failed };
    }

    /**
     * Parse integration test results from output
     */
    parseIntegrationTestResults(output) {
        return this.parseUnitTestResults(output); // Similar parsing logic
    }

    /**
     * Aggregate test results from multiple test suites
     */
    aggregateTestResults(results) {
        this.testResults.totalTests = 0;
        this.testResults.passedTests = 0;
        this.testResults.failedTests = 0;
        this.testResults.success = true;

        results.forEach(result => {
            if (result.tests) {
                this.testResults.totalTests += result.tests.total;
                this.testResults.passedTests += result.tests.passed;
                this.testResults.failedTests += result.tests.failed;
            }
            
            if (!result.success) {
                this.testResults.success = false;
            }
        });

        // Final validation
        if (this.testResults.failedTests > 0) {
            this.testResults.success = false;
        }
    }

    /**
     * Generate comprehensive CI/CD report in multiple formats
     */
    generateReports() {
        this.log('INFO', 'Generating CI/CD test reports...');

        // Generate JSON report for machine consumption
        this.generateJsonReport();
        
        // Generate JUnit XML for CI/CD systems
        this.generateJunitReport();
        
        // Generate human-readable summary
        this.generateTextReport();

        this.log('SUCCESS', 'All reports generated successfully');
    }

    /**
     * Generate JSON report for CI/CD systems
     */
    generateJsonReport() {
        const reportPath = path.join(this.projectRoot, 'ci-test-results.json');
        
        this.testResults.executionTime = (Date.now() - this.startTime) / 1000;
        
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        this.log('INFO', `JSON report written to: ${reportPath}`);
    }

    /**
     * Generate JUnit XML report for CI/CD systems
     */
    generateJunitReport() {
        const reportPath = path.join(this.projectRoot, 'ci-test-results.xml');
        
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Farert WASM CI Tests" tests="${this.testResults.totalTests}" failures="${this.testResults.failedTests}" time="${this.testResults.executionTime.toFixed(3)}">
  <testsuite name="CLI Tests" tests="${this.testResults.totalTests}" failures="${this.testResults.failedTests}" time="${this.testResults.executionTime.toFixed(3)}">
    ${this.testResults.errors.map(error => 
      `<testcase name="${error.message}" classname="CLI">
        <failure message="${error.message}">${error.metadata ? JSON.stringify(error.metadata) : ''}</failure>
      </testcase>`
    ).join('\n    ')}
    ${this.testResults.totalTests > 0 && this.testResults.failedTests === 0 ? 
      `<testcase name="All CLI Tests" classname="CLI" time="${this.testResults.executionTime.toFixed(3)}"/>` : ''}
  </testsuite>
</testsuites>`;

        fs.writeFileSync(reportPath, xml);
        this.log('INFO', `JUnit XML report written to: ${reportPath}`);
    }

    /**
     * Generate human-readable text report
     */
    generateTextReport() {
        const reportPath = path.join(this.projectRoot, 'ci-test-summary.txt');
        
        const report = `
=================================================================
FARERT WASM CI/CD TEST PIPELINE SUMMARY
=================================================================
Timestamp: ${this.testResults.timestamp}
Overall Result: ${this.testResults.success ? '✅ SUCCESS' : '❌ FAILURE'}
Total Execution Time: ${this.testResults.executionTime.toFixed(2)} seconds

TEST STATISTICS:
  Total Tests: ${this.testResults.totalTests}
  Passed Tests: ${this.testResults.passedTests}
  Failed Tests: ${this.testResults.failedTests}
  Success Rate: ${this.testResults.totalTests > 0 ? ((this.testResults.passedTests / this.testResults.totalTests) * 100).toFixed(1) : '0'}%

PERFORMANCE METRICS:
  Build Time: ${this.testResults.performance.buildTime.toFixed(2)}s
  Test Time: ${this.testResults.performance.testTime.toFixed(2)}s
  Memory Peak: ${this.testResults.performance.memoryPeak || 'N/A'}MB

${this.testResults.errors.length > 0 ? `
ERRORS (${this.testResults.errors.length}):
${this.testResults.errors.map((error, index) => `  ${index + 1}. ${error.message}`).join('\n')}
` : ''}

${this.testResults.warnings.length > 0 ? `
WARNINGS (${this.testResults.warnings.length}):
${this.testResults.warnings.map((warning, index) => `  ${index + 1}. ${warning.message}`).join('\n')}
` : ''}

=================================================================
Generated by Farert WASM CI/CD Testing Pipeline
=================================================================
`;

        fs.writeFileSync(reportPath, report);
        this.log('INFO', `Text summary report written to: ${reportPath}`);
    }

    /**
     * Main pipeline execution method
     */
    async run() {
        this.log('INFO', '🚀 Starting Farert WASM CI/CD Testing Pipeline');
        
        try {
            // Environment validation
            const envValid = await this.validateEnvironment();
            if (!envValid) {
                this.log('ERROR', 'Environment validation failed - aborting pipeline');
                process.exit(1);
            }

            // Build pipeline
            const buildSuccess = await this.executeBuild();
            if (!buildSuccess) {
                this.log('ERROR', 'Build failed - aborting pipeline');
                process.exit(1);
            }

            // Test execution
            const testSuccess = await this.executeTests();
            
            // Generate reports
            this.generateReports();

            // Final pipeline status
            if (testSuccess) {
                this.log('SUCCESS', `✅ CI/CD Pipeline completed successfully in ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`);
                console.log(`\n📊 Summary: ${this.testResults.passedTests}/${this.testResults.totalTests} tests passed`);
                process.exit(0);
            } else {
                this.log('ERROR', `❌ CI/CD Pipeline failed in ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`);
                console.log(`\n📊 Summary: ${this.testResults.passedTests}/${this.testResults.totalTests} tests passed, ${this.testResults.failedTests} failed`);
                process.exit(1);
            }

        } catch (error) {
            this.log('ERROR', `Pipeline execution failed: ${error.message}`);
            process.exit(1);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const runner = new CIPipelineTestRunner();
    runner.run().catch(error => {
        console.error('❌ Fatal pipeline error:', error);
        process.exit(1);
    });
}

module.exports = CIPipelineTestRunner;