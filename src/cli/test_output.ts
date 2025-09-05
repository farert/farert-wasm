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
     * Write test statistics summary
     */
    writeTestStatistics(
        totalTests: number,
        passedTests: number,
        failedTests: number,
        executionTime: number
    ): void {
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : '0.00';
        
        this.write('\\n=== TEST STATISTICS ===\\n');
        this.write(`Total Tests: ${totalTests}\\n`);
        this.write(`Passed: ${passedTests}\\n`);
        this.write(`Failed: ${failedTests}\\n`);
        this.write(`Success Rate: ${successRate}%\\n`);
        this.write(`Execution Time: ${executionTime.toFixed(2)}s\\n`);
        this.write('=======================\\n');
    }
    
    /**
     * Write detailed failure information for debugging
     */
    writeFailureDetails(
        testName: string,
        routeDefinition: string,
        errorMessage: string,
        expectedValue?: number,
        actualValue?: number,
        timestamp?: number
    ): void {
        this.write(`\\n=== FAILURE DETAILS ===\\n`);
        this.write(`Test: ${testName}\\n`);
        this.write(`Route: ${routeDefinition}\\n`);
        this.write(`Error: ${errorMessage}\\n`);
        
        if (expectedValue !== undefined && actualValue !== undefined) {
            this.write(`Expected: ${expectedValue}\\n`);
            this.write(`Actual: ${actualValue}\\n`);
            this.write(`Difference: ${Math.abs(expectedValue - actualValue)}\\n`);
        }
        
        if (timestamp) {
            this.write(`Timestamp: ${new Date(timestamp).toISOString()}\\n`);
        }
        
        this.write('======================\\n');
    }
}