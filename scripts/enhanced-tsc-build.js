#!/usr/bin/env node

/**
 * Enhanced TypeScript Build Script with Detailed Error Reporting
 * Provides comprehensive compilation error details with file paths and line numbers
 * for requirement REQ-CLI-005.5: Enhanced build error reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class EnhancedTSCBuilder {
    constructor() {
        this.projectRoot = process.cwd();
        this.configFile = process.argv[2] || 'tsconfig.cli.json';
        this.startTime = Date.now();
    }

    log(level, message) {
        const timestamp = new Date().toISOString();
        const prefix = {
            'INFO': '📋',
            'SUCCESS': '✅',
            'ERROR': '❌',
            'WARNING': '⚠️'
        }[level] || '🔧';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    checkPrerequisites() {
        this.log('INFO', 'Checking build prerequisites...');
        
        // Check TypeScript config file
        const configPath = path.join(this.projectRoot, this.configFile);
        if (!fs.existsSync(configPath)) {
            this.log('ERROR', `TypeScript config file not found: ${configPath}`);
            return false;
        }

        // Check WebAssembly artifacts
        const wasmArtifacts = ['dist/farert.js', 'dist/farert.wasm'];
        let missingArtifacts = [];
        
        wasmArtifacts.forEach(artifact => {
            if (!fs.existsSync(path.join(this.projectRoot, artifact))) {
                missingArtifacts.push(artifact);
            }
        });

        if (missingArtifacts.length > 0) {
            this.log('WARNING', `Missing WebAssembly artifacts: ${missingArtifacts.join(', ')}`);
            this.log('INFO', '💡 Run: npm run build:wasm to generate missing artifacts');
        }

        return true;
    }

    parseTypeScriptErrors(errorOutput) {
        const errors = [];
        const lines = errorOutput.split('\\n');
        
        let currentError = null;
        for (const line of lines) {
            // Match TypeScript error pattern: filename(line,column): error TSxxxx: message
            const errorMatch = line.match(/^(.+)\\((\\d+),(\\d+)\\):\\s+error\\s+(TS\\d+):\\s+(.+)$/);
            if (errorMatch) {
                if (currentError) {
                    errors.push(currentError);
                }
                currentError = {
                    file: errorMatch[1],
                    line: parseInt(errorMatch[2]),
                    column: parseInt(errorMatch[3]),
                    code: errorMatch[4],
                    message: errorMatch[5],
                    suggestions: []
                };
            } else if (currentError && line.trim()) {
                // Additional error context or suggestions
                currentError.message += ' ' + line.trim();
            }
        }
        
        if (currentError) {
            errors.push(currentError);
        }
        
        return errors;
    }

    generateSuggestions(error) {
        const suggestions = [];
        
        // Common TypeScript error patterns and solutions
        const errorPatterns = [
            {
                pattern: /Cannot find module.*react/i,
                suggestion: "Install React types: npm install --save-dev @types/react @types/react-dom"
            },
            {
                pattern: /Cannot use JSX unless.*jsx.*flag/i,
                suggestion: "Add 'jsx': 'react' to compilerOptions in tsconfig.json"
            },
            {
                pattern: /Property.*does not exist/i,
                suggestion: "Check property name spelling and interface definitions"
            },
            {
                pattern: /Parameter.*implicitly has.*any.*type/i,
                suggestion: "Add explicit type annotations to function parameters"
            },
            {
                pattern: /Cannot find name/i,
                suggestion: "Check import statements and type declarations"
            }
        ];

        errorPatterns.forEach(({ pattern, suggestion }) => {
            if (pattern.test(error.message)) {
                suggestions.push(suggestion);
            }
        });

        // File-specific suggestions
        if (error.file.includes('src/sdk/react/')) {
            suggestions.push("This file contains React code - consider excluding from CLI build");
        }

        if (error.file.includes('.tsx')) {
            suggestions.push("TSX files require JSX support - check tsconfig.json jsx settings");
        }

        return suggestions;
    }

    formatErrorReport(errors) {
        if (errors.length === 0) return '';

        let report = '\\n' + '='.repeat(80) + '\\n';
        report += '❌ TYPESCRIPT COMPILATION ERROR REPORT\\n';
        report += '='.repeat(80) + '\\n';
        
        errors.forEach((error, index) => {
            report += `\\n📁 Error ${index + 1}/${errors.length}:\\n`;
            report += `   File: ${error.file}\\n`;
            report += `   Line: ${error.line}, Column: ${error.column}\\n`;
            report += `   Code: ${error.code}\\n`;
            report += `   Message: ${error.message}\\n`;
            
            const suggestions = this.generateSuggestions(error);
            if (suggestions.length > 0) {
                report += `   💡 Suggestions:\\n`;
                suggestions.forEach(suggestion => {
                    report += `      • ${suggestion}\\n`;
                });
            }
            
            report += '\\n' + '-'.repeat(60) + '\\n';
        });

        report += '\\n🔧 General Solutions:\\n';
        report += '   • Verify all import statements are correct\\n';
        report += '   • Check that all required packages are installed\\n';
        report += '   • Ensure tsconfig.json includes the correct files\\n';
        report += '   • Run: npm run build:wasm if WebAssembly artifacts are missing\\n';
        
        return report;
    }

    async build() {
        try {
            this.log('INFO', `Starting TypeScript build with config: ${this.configFile}`);
            
            if (!this.checkPrerequisites()) {
                process.exit(1);
            }

            // Execute TypeScript compilation
            const tscCommand = `tsc -p ${this.configFile}`;
            this.log('INFO', `Executing: ${tscCommand}`);
            
            execSync(tscCommand, { 
                stdio: 'inherit',
                cwd: this.projectRoot 
            });
            
            const buildTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
            this.log('SUCCESS', `TypeScript compilation completed successfully in ${buildTime}s`);
            
        } catch (error) {
            const buildTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
            this.log('ERROR', `TypeScript compilation failed after ${buildTime}s`);
            
            if (error.stdout || error.stderr) {
                const errorOutput = error.stdout ? error.stdout.toString() : error.stderr.toString();
                const parsedErrors = this.parseTypeScriptErrors(errorOutput);
                const errorReport = this.formatErrorReport(parsedErrors);
                console.error(errorReport);
            }
            
            process.exit(1);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const builder = new EnhancedTSCBuilder();
    builder.build();
}

module.exports = EnhancedTSCBuilder;