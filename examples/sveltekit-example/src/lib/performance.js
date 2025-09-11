/**
 * Performance Tracking Utilities
 * 
 * Provides performance monitoring and tracking capabilities
 * for development and debugging purposes.
 * 
 * @author Farert SvelteKit Example
 * @version 1.0.0
 */

/**
 * Performance tracker class
 */
export class PerformanceTracker {
	constructor() {
		this.marks = new Map();
		this.measures = new Map();
		this.startTime = performance.now();
	}
	
	/**
	 * Start tracking
	 */
	start() {
		this.mark('app-start');
		console.log('[Performance] Tracking started');
	}
	
	/**
	 * Create a performance mark
	 */
	mark(name) {
		const time = performance.now();
		this.marks.set(name, time);
		
		if (typeof performance.mark === 'function') {
			performance.mark(`farert-${name}`);
		}
		
		console.log(`[Performance] Mark: ${name} at ${time.toFixed(2)}ms`);
	}
	
	/**
	 * Measure time between marks
	 */
	measure(name, startMark, endMark) {
		const startTime = this.marks.get(startMark);
		const endTime = this.marks.get(endMark);
		
		if (startTime && endTime) {
			const duration = endTime - startTime;
			this.measures.set(name, duration);
			
			if (typeof performance.measure === 'function') {
				try {
					performance.measure(`farert-${name}`, `farert-${startMark}`, `farert-${endMark}`);
				} catch (e) {
					// Fallback for browsers that don't support marks
				}
			}
			
			console.log(`[Performance] Measure: ${name} = ${duration.toFixed(2)}ms`);
			return duration;
		}
		
		return null;
	}
	
	/**
	 * Mark navigation
	 */
	markNavigation(path) {
		this.mark(`nav-${path}`);
	}
	
	/**
	 * Get all measurements
	 */
	getMeasurements() {
		return Object.fromEntries(this.measures);
	}
}

/**
 * Simple performance utilities
 */
export const performance = {
	/**
	 * Time a function execution
	 */
	async timeAsync(name, fn) {
		const start = performance.now();
		const result = await fn();
		const end = performance.now();
		console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
		return result;
	},
	
	/**
	 * Time a synchronous function
	 */
	time(name, fn) {
		const start = performance.now();
		const result = fn();
		const end = performance.now();
		console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
		return result;
	}
};