/**
 * Test output writer for file-based test results
 * Equivalent to file output functionality in original C++ test_exec.cpp
 * 
 * This class handles writing test results to test_result.txt file
 * with the same format as the original C++ implementation
 */

import * as fs from 'fs';

export class TestOutputWriter {
    private fileHandle: number | null = null;
    // private _filename: string; // Unused for now
    
    constructor(filename: string) {
        // this._filename = filename; // Store filename if needed later
        try {
            // Open file for writing (equivalent to fopen_s in original)
            this.fileHandle = fs.openSync(filename, 'w');
        } catch (error) {
            console.error(`Failed to open output file: ${filename}`, error);
            this.fileHandle = null;
        }
    }
    
    /**
     * Write string to output file (equivalent to _ftprintf in original)
     */
    write(text: string): void {
        if (this.fileHandle !== null) {
            try {
                fs.writeSync(this.fileHandle, text);
            } catch (error) {
                console.error('Failed to write to output file:', error);
            }
        }
    }
    
    /**
     * Write formatted output (equivalent to formatted _ftprintf calls)
     */
    writeFormatted(format: string, ...args: any[]): void {
        const formatted = this.sprintf(format, ...args);
        this.write(formatted);
    }
    
    /**
     * Simple sprintf implementation for basic formatting
     */
    private sprintf(format: string, ...args: any[]): string {
        let i = 0;
        return format.replace(/%[sd%]/g, (match) => {
            if (match === '%%') return '%';
            if (match === '%s') return String(args[i++]);
            if (match === '%d') return String(Number(args[i++]));
            return match;
        });
    }
    
    /**
     * Close output file (equivalent to fclose in original)
     */
    close(): void {
        if (this.fileHandle !== null) {
            try {
                fs.closeSync(this.fileHandle);
                this.fileHandle = null;
            } catch (error) {
                console.error('Failed to close output file:', error);
            }
        }
    }
    
    /**
     * Check if file is open and ready for writing
     */
    isOpen(): boolean {
        return this.fileHandle !== null;
    }
    
    /**
     * Format timestamp in exact C++ show_time format
     * Format: "YYYY-M-D H:MM:SS" (matching original _ftprintf format)
     */
    formatCppTimestamp(timestamp: number): string {
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // No zero padding for month
        const day = date.getDate();         // No zero padding for day
        const hour = date.getHours();       // No zero padding for hour
        const minute = date.getMinutes().toString().padStart(2, '0');
        const second = date.getSeconds().toString().padStart(2, '0');
        
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    }
    
    /**
     * Write C++ compatible test summary (REQ-CLI-002.2)
     * Matches the exact format from original test_exec.cpp
     */
    writeCppTestSummary(
        totalTests: number,
        passedTests: number,
        executionTimeSeconds: number
    ): void {
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0.0';
        
        // Exact C++ format: "Test Results: X/Y passed (Z.Z%)"
        this.write(`Test Results: ${passedTests}/${totalTests} passed (${successRate}%)\\n`);
        this.write(`Execution Time: ${executionTimeSeconds.toFixed(2)} seconds\\n`);
    }
    
    /**
     * Write route test header (equivalent to test header output in original)
     */
    writeRouteTestHeader(routeName: string, routeDefinition: string): void {
        this.write(`\\n--- Route Test: ${routeName} ---\\n`);
        this.write(`Route: ${routeDefinition}\\n`);
    }
    
    /**
     * Write route test result (equivalent to route result output in original)
     */
    writeRouteTestResult(
        route: string, 
        fare: number, 
        distance: number, 
        companies: string[], 
        fareString: string
    ): void {
        this.write(`Route: ${route}\\n`);
        this.write(`Fare: \\${fare}\\n`);
        this.write(`Distance: ${distance}km\\n`);
        if (companies.length > 0) {
            this.write(`Companies: ${companies.join(', ')}\\n`);
        }
        if (fareString && fareString.length > 0) {
            this.write(`Details: ${fareString}\\n`);
        }
        this.write('---\\n');
    }
    
    /**
     * Write auto route test result
     */
    writeAutoRouteResult(
        fromStation: string,
        toStation: string, 
        selectedRoute: string,
        fare: number,
        options: string
    ): void {
        this.write(`Auto Route: ${fromStation} -> ${toStation}\\n`);
        this.write(`Selected: ${selectedRoute}\\n`);
        this.write(`Fare: \\${fare}\\n`);
        if (options && options.length > 0) {
            this.write(`Options: ${options}\\n`);
        }
        this.write('---\\n');
    }
    
    /**
     * Write test error (equivalent to error output in original)
     */
    writeError(testName: string, errorMessage: string): void {
        this.write(`ERROR in ${testName}: ${errorMessage}\\n`);
    }
    
    /**
     * Write test section separator (equivalent to section headers in original)
     */
    writeSectionHeader(sectionName: string): void {
        const separator = '-'.repeat(50);
        this.write(`\\n${separator}\\n`);
        this.write(`${sectionName}\\n`);
        this.write(`${separator}\\n`);
    }
    
    /**
     * Write test validation result with tolerance check
     */
    writeValidationResult(
        testName: string,
        routeDefinition: string,
        expectedFare: number,
        actualFare: number,
        tolerance: number = 0
    ): void {
        const difference = Math.abs(expectedFare - actualFare);
        const passed = difference <= tolerance;
        
        this.write(`\\nValidation: ${testName}\\n`);
        this.write(`Route: ${routeDefinition}\\n`);
        this.write(`Expected Fare: ${expectedFare} yen\\n`);
        this.write(`Actual Fare: ${actualFare} yen\\n`);
        this.write(`Difference: ${difference} yen\\n`);
        this.write(`Tolerance: ${tolerance} yen\\n`);
        this.write(`Result: ${passed ? 'PASS' : 'FAIL'}\\n`);
        this.write('---\\n');
    }
    
    /**
     * Write test statistics summary in exact C++ format (REQ-CLI-002.2)
     * Format: "Test Results: X/Y passed (Z.Z%)"
     */
    writeTestStatistics(
        totalTests: number,
        passedTests: number,
        failedTests: number,
        executionTime: number
    ): void {
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0.0';
        
        // Write in exact C++ format matching original test_exec.cpp
        this.write(`\\nTest Results: ${passedTests}/${totalTests} passed (${successRate}%)\\n`);
        this.write(`Execution Time: ${executionTime.toFixed(2)} seconds\\n`);
        
        if (failedTests > 0) {
            this.write(`Failed Tests: ${failedTests}\\n`);
        }
    }
    
    /**
     * Write detailed failure information matching C++ format (REQ-CLI-002.5)
     * Shows test name, expected value, actual value, and tolerance checks
     */
    writeFailureDetails(
        testName: string,
        routeDefinition: string,
        errorMessage: string,
        expectedValue?: number,
        actualValue?: number,
        tolerance: number = 0,
        timestamp?: number
    ): void {
        this.write(`\\n=== FAILURE DETAILS ===\\n`);
        this.write(`Test: ${testName}\\n`);
        this.write(`Route: ${routeDefinition}\\n`);
        this.write(`Error: ${errorMessage}\\n`);
        
        // REQ-CLI-002.5: Show expected, actual, and tolerance information
        if (expectedValue !== undefined && actualValue !== undefined) {
            const difference = Math.abs(expectedValue - actualValue);
            const toleranceCheck = difference <= tolerance;
            
            this.write(`Expected Value: ${expectedValue} yen\\n`);
            this.write(`Actual Value: ${actualValue} yen\\n`);
            this.write(`Difference: ${difference} yen\\n`);
            this.write(`Tolerance: ${tolerance} yen\\n`);
            this.write(`Tolerance Check: ${toleranceCheck ? 'PASSED' : 'FAILED'}\\n`);
        }
        
        if (timestamp) {
            this.write(`Timestamp: ${this.formatCppTimestamp(timestamp)}\\n`);
        }
        
        this.write('======================\\n');
    }
    
    /**
     * Write enhanced failure report matching C++ format (REQ-CLI-002.5)
     * Includes test name, expected value, actual value, and tolerance information
     */
    writeEnhancedFailureReport(
        testName: string,
        routeDefinition: string,
        errorMessage: string,
        expectedValue?: number,
        actualValue?: number,
        tolerance: number = 0
    ): void {
        this.write(`\\n!!! TEST FAILURE !!!\\n`);
        this.write(`Test Name: ${testName}\\n`);
        this.write(`Route Definition: ${routeDefinition}\\n`);
        this.write(`Error Message: ${errorMessage}\\n`);
        
        if (expectedValue !== undefined && actualValue !== undefined) {
            const difference = Math.abs(expectedValue - actualValue);
            const toleranceCheck = difference <= tolerance;
            
            this.write(`Expected Value: ${expectedValue} yen\\n`);
            this.write(`Actual Value: ${actualValue} yen\\n`);
            this.write(`Difference: ${difference} yen\\n`);
            this.write(`Tolerance: ${tolerance} yen\\n`);
            this.write(`Tolerance Check: ${toleranceCheck ? 'PASSED' : 'FAILED'}\\n`);
        }
        
        this.write(`Timestamp: ${this.formatCppTimestamp(Date.now() / 1000)}\\n`);
        this.write('!!!!!!!!!!!!!!!!!!!\\n');
    }
}