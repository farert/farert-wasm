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
    private filename: string;
    
    constructor(filename: string) {
        this.filename = filename;
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
}