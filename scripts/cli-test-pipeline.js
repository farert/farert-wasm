#!/usr/bin/env node

/**
 * CLI Testing Pipeline Integration Script
 * Task 19: Create automated CLI testing pipeline integration
 * Requirements: REQ-CLI-005.2, REQ-CLI-005.4
 * 
 * This script provides comprehensive CLI testing pipeline automation for:
 * - Automated CI/CD pipeline integration
 * - Proper exit codes for CI/CD systems (0 for success, 1 for failure)  
 * - npm script integration without conflicts
 * - Environment validation and test execution
 * - Performance monitoring and reporting
 * - Cross-platform compatibility
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * CLI Testing Pipeline Configuration
 */
class CLITestPipeline {
    constructor(options = {}) {
        this.projectRoot = process.cwd();
        this.verbose = options.verbose || process.env.CI_DEBUG === '1';
        this.skipBuild = options.skipBuild || false;
        this.testPattern = options.testPattern || 'all'; // 'cli', 'unit', 'integration', 'all'
        this.timeout = options.timeout || 300000; // 5 minutes default
        
        this.results = {
            timestamp: new Date().toISOString(),
            success: false,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            executionTime: 0,
            errors: [],
            warnings: [],
            environment: this.getEnvironmentInfo(),
            performance: {
                buildTime: 0,
                testTime: 0,
                memoryPeak: this.getCurrentMemoryUsage()
            }
        };
        
        this.startTime = process.hrtime.bigint();
    }

    /**
     * Logging utility with structured output for CI/CD consumption
     */
    log(level, message, details = null) {
        const timestamp = new Date().toISOString();
        const levelPrefix = {
            'INFO': '📋',
            'SUCCESS': '✅', 
            'ERROR': '❌',
            'WARNING': '⚠️',
            'DEBUG': '🔍'
        }[level] || '🔧';

        console.log(`${levelPrefix} [${timestamp}] ${message}`);
        
        if (this.verbose && details) {
            console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
        }

        // Store structured logs for reporting
        if (level === 'ERROR') {
            this.results.errors.push({ message, details, timestamp });
        } else if (level === 'WARNING') {
            this.results.warnings.push({ message, details, timestamp });
        }
    }

    /**
     * Get current environment information
     */
    getEnvironmentInfo() {
        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            npmVersion: this.getNpmVersion(),
            workingDirectory: this.projectRoot,
            ciEnvironment: this.detectCIEnvironment(),
            memoryLimit: process.env.NODE_OPTIONS?.includes('--max-old-space-size') 
                ? process.env.NODE_OPTIONS.match(/--max-old-space-size=(\d+)/)?.[1] 
                : 'default'
        };
    }

    /**
     * Get current memory usage in MB
     */
    getCurrentMemoryUsage() {
        const usage = process.memoryUsage();
        return Math.round(usage.rss / 1024 / 1024);
    }

    /**
     * Get npm version safely
     */
    getNpmVersion() {
        try {
            return execSync('npm -v', { encoding: 'utf8', timeout: 5000 }).trim();
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Detect CI environment
     */
    detectCIEnvironment() {
        const ciIndicators = [
            'CI', 'CONTINUOUS_INTEGRATION', 'GITHUB_ACTIONS', 
            'GITLAB_CI', 'JENKINS_URL', 'TRAVIS', 'CIRCLECI'
        ];
        
        for (const indicator of ciIndicators) {
            if (process.env[indicator]) {
                return indicator.toLowerCase();
            }
        }
        
        return process.env.NODE_ENV === 'ci' ? 'generic' : 'local';
    }

    /**
     * Comprehensive environment validation (REQ-CLI-005.2)
     */
    async validateEnvironment() {
        this.log('INFO', 'Validating CI/CD environment requirements...');
        
        const validationChecks = [
            { name: 'Node.js Version', check: () => this.checkNodeVersion() },
            { name: 'NPM Accessibility', check: () => this.checkNpmAccess() },
            { name: 'Project Structure', check: () => this.checkProjectStructure() },
            { name: 'Build Configuration', check: () => this.checkBuildConfiguration() },
            { name: 'WebAssembly Artifacts', check: () => this.checkWebAssemblyArtifacts() },
            { name: 'Test Scripts', check: () => this.checkTestScripts() }
        ];

        let allValid = true;
        const validationResults = {};

        for (const check of validationChecks) {
            try {
                const result = await check.check();
                validationResults[check.name] = result;
                
                if (result.valid) {
                    this.log('SUCCESS', `${check.name}: ${result.message}`);
                } else {
                    this.log('ERROR', `${check.name}: ${result.message}`, result.details);
                    allValid = false;
                }
            } catch (error) {
                validationResults[check.name] = {
                    valid: false,
                    message: error.message,
                    details: { error: error.toString() }
                };
                this.log('ERROR', `${check.name}: Validation failed - ${error.message}`);
                allValid = false;
            }
        }

        if (!allValid) {
            this.log('ERROR', 'Environment validation failed. Please check the errors above.');
            this.generateValidationReport(validationResults);
        } else {
            this.log('SUCCESS', 'All environment validation checks passed');
        }

        return allValid;
    }

    checkNodeVersion() {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        const isValid = major >= 14;
        
        return {
            valid: isValid,
            message: `${version} ${isValid ? '(Compatible)' : '(Requires >=14.0.0)'}`,
            details: { currentVersion: version, requiredVersion: '>=14.0.0', major }
        };
    }

    checkNpmAccess() {
        try {
            const version = execSync('npm -v', { encoding: 'utf8', timeout: 10000 }).trim();
            const major = parseInt(version.split('.')[0]);
            const isValid = major >= 6;
            
            return {
                valid: isValid,
                message: `v${version} ${isValid ? '(Compatible)' : '(Requires >=6.0.0)'}`,
                details: { version, requiredVersion: '>=6.0.0' }
            };
        } catch (error) {
            return {
                valid: false,
                message: 'NPM not accessible or not installed',
                details: { error: error.message }
            };
        }
    }

    checkProjectStructure() {
        const requiredPaths = [
            { path: 'package.json', type: 'file', critical: true },
            { path: 'tsconfig.cli.json', type: 'file', critical: true },
            { path: 'src/cli', type: 'directory', critical: true },
            { path: 'src/core', type: 'directory', critical: false },
            { path: 'src/include', type: 'directory', critical: false },
            { path: 'Makefile', type: 'file', critical: false }
        ];

        const missing = [];
        const present = [];

        for (const item of requiredPaths) {
            const fullPath = path.join(this.projectRoot, item.path);
            const exists = fs.existsSync(fullPath);
            
            if (exists) {
                present.push(item.path);
            } else {
                missing.push(item.path);
                if (item.critical) {
                    return {
                        valid: false,
                        message: `Critical project structure missing: ${item.path}`,
                        details: { missing, present }
                    };
                }
            }
        }

        return {
            valid: true,
            message: `Project structure valid (${present.length} items present${missing.length > 0 ? `, ${missing.length} optional missing` : ''})`,
            details: { present, missing }
        };
    }

    checkBuildConfiguration() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
            
            const requiredScripts = [
                'build', 'build:cli', 'cli:exec', 'cli:build'
            ];
            
            const missingScripts = requiredScripts.filter(script => !packageJson.scripts || !packageJson.scripts[script]);
            
            if (missingScripts.length > 0) {
                return {
                    valid: false,
                    message: `Missing required npm scripts: ${missingScripts.join(', ')}`,
                    details: { missingScripts, availableScripts: Object.keys(packageJson.scripts || {}) }
                };
            }

            return {
                valid: true,
                message: 'All required npm scripts are configured',
                details: { requiredScripts, availableScripts: Object.keys(packageJson.scripts || {}) }
            };
        } catch (error) {
            return {
                valid: false,
                message: 'Failed to parse package.json',
                details: { error: error.message }
            };
        }
    }

    checkWebAssemblyArtifacts() {
        const artifacts = [
            { path: 'dist/farert.js', required: true },
            { path: 'dist/farert.wasm', required: true }
        ];

        const missing = [];
        const present = [];

        for (const artifact of artifacts) {
            const fullPath = path.join(this.projectRoot, artifact.path);
            if (fs.existsSync(fullPath)) {
                present.push(artifact.path);
            } else {
                missing.push(artifact.path);
            }
        }

        // If artifacts are missing but build is not skipped, it's not necessarily an error
        if (missing.length > 0 && !this.skipBuild) {
            return {
                valid: true,
                message: `WebAssembly artifacts missing but will be built: ${missing.join(', ')}`,
                details: { missing, present, buildScheduled: true }
            };
        } else if (missing.length > 0 && this.skipBuild) {
            return {
                valid: false,
                message: `WebAssembly artifacts missing and build is skipped: ${missing.join(', ')}`,
                details: { missing, present, buildSkipped: true }
            };
        }

        return {
            valid: true,
            message: `All WebAssembly artifacts present (${present.length} files)`,
            details: { present, missing }
        };
    }

    checkTestScripts() {
        const testScriptPath = path.join(this.projectRoot, 'src/cli/main.ts');
        const testExecPath = path.join(this.projectRoot, 'src/cli/test_exec_complete.ts');
        
        const issues = [];
        
        if (!fs.existsSync(testScriptPath)) {
            issues.push('Main CLI script missing: src/cli/main.ts');
        }
        
        if (!fs.existsSync(testExecPath)) {
            issues.push('Complete test suite missing: src/cli/test_exec_complete.ts');
        }

        if (issues.length > 0) {
            return {
                valid: false,
                message: `Test script issues: ${issues.join(', ')}`,
                details: { issues }
            };
        }

        return {
            valid: true,
            message: 'All required test scripts are present',
            details: { testScriptPath, testExecPath }
        };
    }

    /**
     * Execute build pipeline if not skipped
     */
    async executeBuild() {
        if (this.skipBuild) {
            this.log('INFO', 'Build skipped as requested');
            return true;
        }

        this.log('INFO', 'Starting build pipeline...');
        const buildStartTime = process.hrtime.bigint();

        try {
            // Clean previous artifacts
            this.log('INFO', 'Cleaning previous build artifacts...');
            try {
                execSync('npm run clean', { 
                    stdio: this.verbose ? 'inherit' : 'pipe',
                    timeout: 30000,
                    cwd: this.projectRoot
                });
            } catch (error) {
                this.log('WARNING', 'Clean command failed or not available, continuing...');
            }

            // Build WebAssembly artifacts
            this.log('INFO', 'Building WebAssembly artifacts...');
            execSync('npm run build:wasm', { 
                stdio: this.verbose ? 'inherit' : 'pipe',
                timeout: 120000, // 2 minutes
                cwd: this.projectRoot
            });

            // Build TypeScript CLI
            this.log('INFO', 'Building TypeScript CLI...');
            execSync('npm run build:cli', { 
                stdio: this.verbose ? 'inherit' : 'pipe',
                timeout: 60000, // 1 minute
                cwd: this.projectRoot
            });

            const buildTime = Number(process.hrtime.bigint() - buildStartTime) / 1000000000;
            this.results.performance.buildTime = buildTime;
            
            this.log('SUCCESS', `Build completed successfully in ${buildTime.toFixed(2)}s`);
            return true;

        } catch (error) {
            const buildTime = Number(process.hrtime.bigint() - buildStartTime) / 1000000000;
            this.results.performance.buildTime = buildTime;
            
            this.log('ERROR', `Build failed after ${buildTime.toFixed(2)}s`, {
                error: error.message,
                code: error.status,
                signal: error.signal
            });
            return false;
        }
    }

    /**
     * Execute CLI test suite with proper result parsing (REQ-CLI-005.2)
     */
    async executeCliTests() {
        this.log('INFO', 'Starting CLI test execution...');
        const testStartTime = process.hrtime.bigint();

        return new Promise((resolve) => {
            const cliArgs = ['dist/cli/cli/main.js', '-exec'];
            const child = spawn('node', cliArgs, {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: this.projectRoot,
                timeout: this.timeout
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
                if (this.verbose) {
                    process.stdout.write(data);
                }
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
                if (this.verbose) {
                    process.stderr.write(data);
                }
            });

            child.on('close', (code, signal) => {
                const testTime = Number(process.hrtime.bigint() - testStartTime) / 1000000000;
                this.results.performance.testTime = testTime;

                const testResults = this.parseCliTestOutput(stdout, stderr);
                
                const result = {
                    name: 'CLI Tests',
                    success: code === 0,
                    exitCode: code,
                    signal,
                    stdout,
                    stderr,
                    testResults,
                    executionTime: testTime
                };

                if (code === 0) {
                    this.log('SUCCESS', `CLI tests completed successfully in ${testTime.toFixed(2)}s`);
                    this.log('INFO', `Test results: ${testResults.passed}/${testResults.total} passed`);
                } else {
                    this.log('ERROR', `CLI tests failed with exit code ${code}${signal ? ` (signal: ${signal})` : ''}`);
                    this.log('ERROR', `Test results: ${testResults.passed}/${testResults.total} passed, ${testResults.failed} failed`);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                const testTime = Number(process.hrtime.bigint() - testStartTime) / 1000000000;
                this.results.performance.testTime = testTime;

                this.log('ERROR', `CLI test execution failed: ${error.message}`);
                resolve({
                    name: 'CLI Tests',
                    success: false,
                    exitCode: -1,
                    error: error.message,
                    testResults: { total: 0, passed: 0, failed: 1 },
                    executionTime: testTime
                });
            });
        });
    }

    /**
     * Parse CLI test output to extract test statistics
     */
    parseCliTestOutput(stdout, stderr) {
        let total = 0;
        let passed = 0;
        let failed = 0;

        // Look for various test result patterns
        const patterns = [
            // Pattern 1: "Test Results: X/Y passed"
            /Test Results:\s*(\d+)\/(\d+)\s*passed/i,
            // Pattern 2: "X tests passed, Y failed"
            /(\d+)\s*tests?\s*passed.*?(\d+)\s*failed/i,
            // Pattern 3: "Passed: X, Failed: Y, Total: Z"
            /Passed:\s*(\d+).*?Failed:\s*(\d+).*?Total:\s*(\d+)/i,
            // Pattern 4: "✅ All tests passed successfully!"
            /✅\s*All tests passed successfully!/i
        ];

        for (const pattern of patterns) {
            const match = stdout.match(pattern);
            if (match) {
                if (pattern === patterns[3]) { // "All tests passed" pattern
                    // Look for test count indicators in the output
                    const countMatch = stdout.match(/(\d+)\s*test/i);
                    if (countMatch) {
                        total = parseInt(countMatch[1]);
                        passed = total;
                        failed = 0;
                    } else {
                        // Assume at least one successful test
                        total = 1;
                        passed = 1;
                        failed = 0;
                    }
                } else if (match.length === 3) {
                    if (pattern === patterns[0]) { // "Test Results: X/Y passed"
                        passed = parseInt(match[1]);
                        total = parseInt(match[2]);
                        failed = total - passed;
                    } else if (pattern === patterns[1]) { // "X tests passed, Y failed"
                        passed = parseInt(match[1]);
                        failed = parseInt(match[2]);
                        total = passed + failed;
                    }
                } else if (match.length === 4 && pattern === patterns[2]) { // "Passed: X, Failed: Y, Total: Z"
                    passed = parseInt(match[1]);
                    failed = parseInt(match[2]);
                    total = parseInt(match[3]);
                }
                break;
            }
        }

        // Fallback: If no patterns matched, try to infer from success indicators
        if (total === 0) {
            if (stdout.includes('✅') || stdout.includes('SUCCESS') || stdout.includes('All tests passed')) {
                total = 1;
                passed = 1;
                failed = 0;
            } else if (stdout.includes('❌') || stdout.includes('FAILED') || stderr.length > 0) {
                total = 1;
                passed = 0;
                failed = 1;
            }
        }

        return { total, passed, failed };
    }

    /**
     * Execute comprehensive test suite based on pattern
     */
    async executeTests() {
        this.log('INFO', `Executing test pattern: ${this.testPattern}`);
        
        const testResults = [];

        if (this.testPattern === 'cli' || this.testPattern === 'all') {
            const cliResult = await this.executeCliTests();
            testResults.push(cliResult);
        }

        // Additional test patterns could be added here
        if (this.testPattern === 'all') {
            // Could add unit tests, integration tests, etc.
            // For now, focusing on CLI tests as per the main requirement
        }

        // Aggregate results
        this.aggregateTestResults(testResults);
        
        return this.results.success;
    }

    /**
     * Aggregate test results from multiple test suites
     */
    aggregateTestResults(testResults) {
        this.results.totalTests = 0;
        this.results.passedTests = 0;
        this.results.failedTests = 0;
        this.results.success = true;

        for (const result of testResults) {
            if (result.testResults) {
                this.results.totalTests += result.testResults.total;
                this.results.passedTests += result.testResults.passed;
                this.results.failedTests += result.testResults.failed;
            }
            
            if (!result.success) {
                this.results.success = false;
            }
        }

        // Ensure consistency
        if (this.results.failedTests > 0) {
            this.results.success = false;
        }
    }

    /**
     * Generate validation report for failed environment checks
     */
    generateValidationReport(validationResults) {
        const reportPath = path.join(this.projectRoot, 'validation-report.json');
        
        const report = {
            timestamp: new Date().toISOString(),
            valid: false,
            environment: this.results.environment,
            checks: validationResults,
            recommendations: this.generateRecommendations(validationResults)
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.log('INFO', `Validation report written to: ${reportPath}`);
    }

    /**
     * Generate recommendations based on failed validation checks
     */
    generateRecommendations(validationResults) {
        const recommendations = [];
        
        for (const [checkName, result] of Object.entries(validationResults)) {
            if (!result.valid) {
                switch (checkName) {
                    case 'Node.js Version':
                        recommendations.push('Update Node.js to version 14.0.0 or higher');
                        break;
                    case 'NPM Accessibility':
                        recommendations.push('Install NPM or check PATH configuration');
                        break;
                    case 'Project Structure':
                        recommendations.push('Ensure all required project files are present');
                        break;
                    case 'Build Configuration':
                        recommendations.push('Check package.json npm scripts configuration');
                        break;
                    case 'WebAssembly Artifacts':
                        recommendations.push('Run "npm run build:wasm" to generate WebAssembly artifacts');
                        break;
                    case 'Test Scripts':
                        recommendations.push('Ensure all required test scripts are present in src/cli/');
                        break;
                    default:
                        recommendations.push(`Fix validation issue: ${checkName}`);
                }
            }
        }
        
        return recommendations;
    }

    /**
     * Generate comprehensive test report (REQ-CLI-005.4)
     */
    generateTestReport() {
        const totalTime = Number(process.hrtime.bigint() - this.startTime) / 1000000000;
        this.results.executionTime = totalTime;
        this.results.performance.memoryPeak = Math.max(this.results.performance.memoryPeak, this.getCurrentMemoryUsage());

        // JSON report for machine consumption
        const jsonReportPath = path.join(this.projectRoot, 'cli-test-results.json');
        fs.writeFileSync(jsonReportPath, JSON.stringify(this.results, null, 2));

        // Human-readable report
        const textReportPath = path.join(this.projectRoot, 'cli-test-summary.txt');
        const textReport = this.generateTextReport(totalTime);
        fs.writeFileSync(textReportPath, textReport);

        this.log('SUCCESS', 'Test reports generated successfully');
        this.log('INFO', `JSON report: ${jsonReportPath}`);
        this.log('INFO', `Text summary: ${textReportPath}`);
    }

    /**
     * Generate human-readable text report
     */
    generateTextReport(totalTime) {
        const successRate = this.results.totalTests > 0 
            ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1)
            : '0.0';

        return `
================================================================
FARERT WASM CLI TESTING PIPELINE REPORT
================================================================
Timestamp: ${this.results.timestamp}
Overall Result: ${this.results.success ? '✅ SUCCESS' : '❌ FAILURE'}
Total Execution Time: ${totalTime.toFixed(2)} seconds

ENVIRONMENT:
  Platform: ${this.results.environment.platform} (${this.results.environment.arch})
  Node.js: ${this.results.environment.nodeVersion}
  NPM: ${this.results.environment.npmVersion}
  CI Environment: ${this.results.environment.ciEnvironment}
  Working Directory: ${this.results.environment.workingDirectory}

TEST STATISTICS:
  Total Tests: ${this.results.totalTests}
  Passed Tests: ${this.results.passedTests}
  Failed Tests: ${this.results.failedTests}
  Success Rate: ${successRate}%

PERFORMANCE METRICS:
  Build Time: ${this.results.performance.buildTime.toFixed(2)}s
  Test Time: ${this.results.performance.testTime.toFixed(2)}s
  Memory Peak: ${this.results.performance.memoryPeak}MB

${this.results.errors.length > 0 ? `
ERRORS (${this.results.errors.length}):
${this.results.errors.map((error, index) => `  ${index + 1}. ${error.message}`).join('\n')}
` : ''}

${this.results.warnings.length > 0 ? `
WARNINGS (${this.results.warnings.length}):
${this.results.warnings.map((warning, index) => `  ${index + 1}. ${warning.message}`).join('\n')}
` : ''}

================================================================
Generated by Farert WASM CLI Testing Pipeline
Task 19: Create automated CLI testing pipeline integration
================================================================
`;
    }

    /**
     * Main pipeline execution method (REQ-CLI-005.2, REQ-CLI-005.4)
     */
    async run() {
        this.log('INFO', '🚀 Starting Farert WASM CLI Testing Pipeline');
        this.log('INFO', `Environment: ${this.results.environment.ciEnvironment}, Platform: ${this.results.environment.platform}`);

        try {
            // Step 1: Environment validation
            const envValid = await this.validateEnvironment();
            if (!envValid) {
                this.log('ERROR', '❌ Environment validation failed - aborting pipeline');
                process.exit(1);
            }

            // Step 2: Build pipeline (if not skipped)
            const buildSuccess = await this.executeBuild();
            if (!buildSuccess) {
                this.log('ERROR', '❌ Build failed - aborting pipeline');
                process.exit(1);
            }

            // Step 3: Test execution
            this.log('INFO', 'Starting test execution phase...');
            const testSuccess = await this.executeTests();

            // Step 4: Generate reports
            this.generateTestReport();

            // Step 5: Final status and exit with proper code (REQ-CLI-005.2)
            const totalTime = Number(process.hrtime.bigint() - this.startTime) / 1000000000;
            
            if (testSuccess) {
                this.log('SUCCESS', `✅ CLI Testing Pipeline completed successfully in ${totalTime.toFixed(2)}s`);
                console.log(`\n📊 Final Summary: ${this.results.passedTests}/${this.results.totalTests} tests passed`);
                console.log(`🎯 Success Rate: ${this.results.totalTests > 0 ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(1) : '0.0'}%`);
                process.exit(0); // Success exit code for CI/CD
            } else {
                this.log('ERROR', `❌ CLI Testing Pipeline failed in ${totalTime.toFixed(2)}s`);
                console.log(`\n📊 Final Summary: ${this.results.passedTests}/${this.results.totalTests} tests passed, ${this.results.failedTests} failed`);
                console.log(`💥 Failure Rate: ${this.results.totalTests > 0 ? ((this.results.failedTests / this.results.totalTests) * 100).toFixed(1) : '100.0'}%`);
                process.exit(1); // Failure exit code for CI/CD
            }

        } catch (error) {
            const totalTime = Number(process.hrtime.bigint() - this.startTime) / 1000000000;
            this.log('ERROR', `💥 Pipeline execution failed after ${totalTime.toFixed(2)}s: ${error.message}`);
            
            // Generate error report even on pipeline failure
            try {
                this.results.success = false;
                this.generateTestReport();
            } catch (reportError) {
                console.error('Failed to generate error report:', reportError.message);
            }
            
            process.exit(1); // Failure exit code for CI/CD
        }
    }
}

/**
 * Command-line interface for the CLI testing pipeline
 */
function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        verbose: false,
        skipBuild: false,
        testPattern: 'all',
        timeout: 300000,
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--skip-build':
                options.skipBuild = true;
                break;
            case '--test-pattern':
                options.testPattern = args[++i] || 'all';
                break;
            case '--timeout':
                options.timeout = parseInt(args[++i]) || 300000;
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

/**
 * Show command-line help
 */
function showHelp() {
    console.log(`
Farert WASM CLI Testing Pipeline
Task 19: Create automated CLI testing pipeline integration

USAGE:
  node scripts/cli-test-pipeline.js [OPTIONS]

OPTIONS:
  --verbose, -v         Enable verbose output
  --skip-build          Skip build phase (use existing artifacts)
  --test-pattern TYPE   Test pattern to execute (cli, all) [default: all]
  --timeout MS          Test execution timeout in milliseconds [default: 300000]
  --help, -h            Show this help message

EXAMPLES:
  node scripts/cli-test-pipeline.js                    # Run full pipeline
  node scripts/cli-test-pipeline.js --verbose          # Run with verbose output
  node scripts/cli-test-pipeline.js --skip-build       # Skip build, run tests only
  node scripts/cli-test-pipeline.js --test-pattern cli # Run only CLI tests

ENVIRONMENT VARIABLES:
  CI_DEBUG=1            Enable debug/verbose mode
  NODE_OPTIONS          Node.js options (e.g., memory limits)

EXIT CODES:
  0                     Success (all tests passed)
  1                     Failure (tests failed or environment issues)

For more information, see: README_CLI.md
`);
}

// Execute pipeline if run directly
if (require.main === module) {
    const options = parseArguments();
    
    if (options.help) {
        showHelp();
        process.exit(0);
    }

    // Set verbose mode from environment if not set via command line
    if (!options.verbose && process.env.CI_DEBUG === '1') {
        options.verbose = true;
    }

    const pipeline = new CLITestPipeline(options);
    
    // Handle cleanup on process termination
    process.on('SIGINT', () => {
        console.log('\n⚠️ Pipeline interrupted, cleaning up...');
        process.exit(1);
    });

    process.on('SIGTERM', () => {
        console.log('\n⚠️ Pipeline terminated, cleaning up...');
        process.exit(1);
    });

    // Execute pipeline
    pipeline.run().catch((error) => {
        console.error('💥 Fatal pipeline error:', error.message);
        if (options.verbose && error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    });
}

module.exports = CLITestPipeline;