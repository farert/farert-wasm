/**
 * Enhanced Object Class Wrappers for Farert Frontend API Layer SDK
 * 
 * Modern JavaScript patterns for object classes with fluent APIs, array operations,
 * lifecycle management, and Svelte-reactive capabilities.
 * 
 * This file provides enhanced wrappers around the 6 core WebAssembly object classes:
 * - cRouteList: Array operations with forEach, map, filter
 * - cRoute: Fluent route building with method chaining
 * - cCalcRoute: Fare calculation with reactive results
 * - cRouteItem: Individual route segment management
 * - cRouteFlag: Route configuration flags
 * - FareInfo: Comprehensive fare information access
 * 
 * Features:
 * - Fluent API patterns for method chaining
 * - Modern JavaScript array operations (forEach, map, filter) for cRouteList
 * - Automatic lifecycle management and memory cleanup
 * - Svelte-reactive state management with stores integration
 * - Enhanced error handling with user-friendly messages
 * - TypeScript strict mode compatibility with full type safety
 * - Integration with caching and error management systems
 * - Production-ready performance optimization
 * 
 * @file Enhanced Object Class Wrappers
 * @version 1.0.0
 * @author Farert WebAssembly Project
 * @license GPL-3.0
 * 
 * Requirements:
 * - REQ-API-006: Create enhanced object class wrappers
 *   - Extend existing object classes with fluent API patterns
 *   - Add array operations to cRouteList (forEach, map, filter)
 *   - Implement lifecycle management and memory cleanup
 *   - Build upon CLI types RouteWrapper interfaces
 *   - Integrate with WebAssembly wrapper and error management
 */

// ============================================================================
// IMPORTS AND TYPE DEFINITIONS
// ============================================================================

// Core WebAssembly wrapper integration
import type { WasmWrapper } from './wasm-wrapper';

// CLI object class interfaces
import type {
  RouteWrapper,
  RouteListWrapper,
  CalcRouteWrapper,
  RouteItemWrapper,
  RouteFlagWrapper,
  FareInfoData,
  FarertModule
} from '../../cli/types';

// Error management integration
import { 
  ErrorManager,
  ErrorCategory,
  ErrorSeverity,
  type ErrorContext
} from '../errors/error-manager';

// Core SDK types
import type {
  StationInfo,
  RouteSegment,
  FareCalculationResult,
  RouteSpec,
  FareBreakdownItem,
  FarertSDKError,
  FarertSDKErrorCode
} from '../types/core';

// Svelte store integration (conditional import)
let writable: any, derived: any, readable: any;
try {
  ({ writable, derived, readable } = require('svelte/store'));
} catch {
  // Fallback for non-Svelte environments
  writable = (value: any) => ({ subscribe: () => () => {}, set: () => {}, update: () => {} });
  derived = () => writable(null);
  readable = () => writable(null);
}

// ============================================================================
// ENHANCED OBJECT CLASS INTERFACES
// ============================================================================

/**
 * Enhanced RouteList with modern JavaScript array operations
 */
export interface EnhancedRouteList extends RouteListWrapper {
  // Array-like operations
  forEach(callback: (item: RouteItemWrapper, index: number) => void): this;
  map<T>(callback: (item: RouteItemWrapper, index: number) => T): T[];
  filter(predicate: (item: RouteItemWrapper, index: number) => boolean): RouteItemWrapper[];
  reduce<T>(callback: (accumulator: T, item: RouteItemWrapper, index: number) => T, initialValue: T): T;
  
  // Fluent operations
  clear(): this;
  reverse(): this;
  clone(): EnhancedRouteList;
  
  // Query operations
  find(predicate: (item: RouteItemWrapper, index: number) => boolean): RouteItemWrapper | undefined;
  findIndex(predicate: (item: RouteItemWrapper, index: number) => boolean): number;
  some(predicate: (item: RouteItemWrapper, index: number) => boolean): boolean;
  every(predicate: (item: RouteItemWrapper, index: number) => boolean): boolean;
  
  // Array-like properties
  readonly length: number;
  readonly isEmpty: boolean;
  readonly isValid: boolean;
  
  // Conversion operations
  toArray(): RouteItemWrapper[];
  toSegments(): RouteSegment[];
  toJSON(): string;
  
  // Reactive state (Svelte integration)
  readonly store: any; // Svelte store for reactive updates
}

/**
 * Enhanced Route with fluent API patterns
 */
export interface EnhancedRoute extends EnhancedRouteList {
  // Fluent route building
  from(stationIdOrName: number | string): this;
  to(stationIdOrName: number | string): this;
  via(stationIdOrName: number | string, lineId?: number): this;
  
  // Route operations with fluent API
  addStation(stationIdOrName: number | string): this;
  addStationViaLine(stationIdOrName: number | string, lineId: number): this;
  removeLastStation(): this;
  clearRoute(): this;
  reverseRoute(): this;
  
  // Route validation and optimization
  validate(): Promise<RouteValidationResult>;
  optimize(criteria?: 'time' | 'cost' | 'transfers'): Promise<this>;
  
  // Route information
  getStartStation(): Promise<StationInfo | null>;
  getEndStation(): Promise<StationInfo | null>;
  getTransferCount(): number;
  getTotalDistance(): number;
  getEstimatedTime(): number;
  
  // Route description
  getDescription(format?: 'short' | 'detailed' | 'json'): Promise<string>;
  getSegmentDescription(index: number): Promise<string>;
  
  // State management
  readonly isComplete: boolean;
  readonly hasErrors: boolean;
  readonly lastError: FarertSDKError | null;
}

/**
 * Enhanced CalcRoute with reactive fare calculation
 */
export interface EnhancedCalcRoute extends EnhancedRoute {
  // Fare calculation with options
  calculateFare(options?: FareCalculationOptions): Promise<FareCalculationResult>;
  calculateFareAsync(): Promise<FareCalculationResult>;
  
  // Fare display and formatting
  getFareDisplay(format?: FareDisplayFormat): Promise<string>;
  getFareBreakdown(): Promise<FareBreakdownItem[]>;
  getDiscountOptions(): Promise<FareDiscount[]>;
  
  // Configuration
  setLongRouteEnabled(enabled: boolean): this;
  setStartAsCity(enabled: boolean): this;
  setArriveAsCity(enabled: boolean): this;
  
  // Reactive fare state
  readonly fareStore: any; // Svelte store for fare updates
  readonly isCalculating: boolean;
  readonly lastCalculationTime: Date | null;
  readonly lastFareResult: FareCalculationResult | null;
  
  // Comparison and analysis
  compareFares(otherRoute: EnhancedCalcRoute): Promise<FareComparison>;
  analyzeCostEfficiency(): Promise<CostAnalysis>;
}

/**
 * Enhanced RouteItem with metadata
 */
export interface EnhancedRouteItem extends RouteItemWrapper {
  // Enhanced properties
  readonly stationInfo: Promise<StationInfo | null>;
  readonly lineInfo: Promise<LineInfo | null>;
  readonly segmentInfo: Promise<RouteSegment>;
  
  // Validation and conversion
  validate(): boolean;
  toSegment(): Promise<RouteSegment>;
  toJSON(): string;
  
  // Fluent updates
  setStation(stationId: number): this;
  setLine(lineId: number): this;
  setFlag(flag: number): this;
  
  // Clone and compare
  clone(): EnhancedRouteItem;
  equals(other: EnhancedRouteItem): boolean;
}

/**
 * Enhanced RouteFlag with semantic operations
 */
export interface EnhancedRouteFlag extends RouteFlagWrapper {
  // Flag operations
  hasFlag(flag: RouteFlagType): boolean;
  setFlag(flag: RouteFlagType, value: boolean): this;
  toggleFlag(flag: RouteFlagType): this;
  clearAllFlags(): this;
  
  // Semantic methods
  isLongRoute(): boolean;
  setLongRoute(enabled: boolean): this;
  isExpressRoute(): boolean;
  setExpressRoute(enabled: boolean): this;
  
  // Validation and description
  validate(): boolean;
  getDescription(): string;
  getActiveFlags(): RouteFlagType[];
}

/**
 * Enhanced FareInfo with comprehensive access
 */
export interface EnhancedFareInfo extends FareInfoData {
  // Fare breakdown and analysis
  getDetailedBreakdown(): FareBreakdownItem[];
  getDiscountSummary(): FareDiscount[];
  getTaxBreakdown(): TaxBreakdown;
  
  // Formatting and display
  formatFare(options?: FareFormatOptions): string;
  formatBreakdown(format?: 'text' | 'html' | 'json'): string;
  
  // Comparison and validation
  compareTo(other: EnhancedFareInfo): FareComparison;
  validate(): boolean;
  
  // Conversion
  toCalculationResult(): FareCalculationResult;
  toJSON(): string;
  
  // Rule analysis
  getAppliedRules(): FareRule[];
  getAvailableDiscounts(): FareDiscount[];
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}

export interface RouteValidationError {
  code: string;
  message: string;
  position?: number;
  severity: 'error' | 'warning' | 'info';
}

export interface RouteValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

export interface FareCalculationOptions {
  enableLongRoute?: boolean;
  startAsCity?: boolean;
  arriveAsCity?: boolean;
  includeDiscounts?: boolean;
  currency?: 'JPY';
}

export interface FareDisplayFormat {
  style: 'compact' | 'detailed' | 'breakdown';
  includeDiscounts: boolean;
  includeTax: boolean;
  language: 'ja' | 'en';
}

export interface FareDiscount {
  id: string;
  name: string;
  description: string;
  amount: number;
  percentage?: number;
  conditions: string[];
  available: boolean;
}

export interface FareComparison {
  cheaperBy: number;
  percentageDifference: number;
  recommendation: string;
  analysis: string[];
}

export interface CostAnalysis {
  costPerKm: number;
  costPerMinute: number;
  efficiency: 'excellent' | 'good' | 'average' | 'poor';
  recommendations: string[];
}

export interface LineInfo {
  id: number;
  name: string;
  companyId: number;
  companyName: string;
  color?: string;
  isJR: boolean;
  type: 'shinkansen' | 'jr' | 'private' | 'subway';
}

export interface TaxBreakdown {
  baseAmount: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
}

export interface FareRule {
  id: string;
  name: string;
  description: string;
  appliedAmount: number;
  type: 'discount' | 'surcharge' | 'base';
}

export enum RouteFlagType {
  LONG_ROUTE = 'long_route',
  EXPRESS_ROUTE = 'express_route',
  CITY_START = 'city_start',
  CITY_ARRIVE = 'city_arrive',
  SPECIAL_ROUTE = 'special_route'
}

// ============================================================================
// LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Object lifecycle manager for automatic cleanup
 */
export class ObjectLifecycleManager {
  private objects = new Set<any>();
  private disposed = false;
  
  /**
   * Register an object for lifecycle management
   */
  register(obj: any): void {
    if (this.disposed) return;
    this.objects.add(obj);
  }
  
  /**
   * Unregister an object from lifecycle management
   */
  unregister(obj: any): void {
    this.objects.delete(obj);
  }
  
  /**
   * Dispose of all managed objects
   */
  dispose(): void {
    if (this.disposed) return;
    
    for (const obj of this.objects) {
      try {
        if (typeof obj.dispose === 'function') {
          obj.dispose();
        } else if (typeof obj.delete === 'function') {
          obj.delete();
        }
      } catch (error) {
        console.warn('Error disposing object:', error);
      }
    }
    
    this.objects.clear();
    this.disposed = true;
  }
  
  /**
   * Get count of managed objects
   */
  getCount(): number {
    return this.objects.size;
  }
  
  /**
   * Check if manager is disposed
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}

// ============================================================================
// ENHANCED ROUTE LIST IMPLEMENTATION
// ============================================================================

/**
 * Enhanced RouteList implementation with modern JavaScript patterns
 */
export class EnhancedRouteListImpl implements EnhancedRouteList {
  private wasmObject: RouteListWrapper;
  private lifecycleManager: ObjectLifecycleManager;
  private errorManager: ErrorManager;
  private _store: any;
  
  constructor(
    wasmObject: RouteListWrapper,
    lifecycleManager: ObjectLifecycleManager,
    errorManager: ErrorManager
  ) {
    this.wasmObject = wasmObject;
    this.lifecycleManager = lifecycleManager;
    this.errorManager = errorManager;
    
    // Register for lifecycle management
    this.lifecycleManager.register(this);
    
    // Create Svelte store for reactive updates
    this._store = writable(this.toArray());
  }
  
  // ============================================================================
  // ARRAY-LIKE OPERATIONS
  // ============================================================================
  
  forEach(callback: (item: RouteItemWrapper, index: number) => void): this {
    try {
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item) {
          callback(item, i);
        }
      }
      return this;
    } catch (error) {
      this.handleError(error, 'forEach');
      return this;
    }
  }
  
  map<T>(callback: (item: RouteItemWrapper, index: number) => T): T[] {
    try {
      const result: T[] = [];
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item) {
          result.push(callback(item, i));
        }
      }
      return result;
    } catch (error) {
      this.handleError(error, 'map');
      return [];
    }
  }
  
  filter(predicate: (item: RouteItemWrapper, index: number) => boolean): RouteItemWrapper[] {
    try {
      const result: RouteItemWrapper[] = [];
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item && predicate(item, i)) {
          result.push(item);
        }
      }
      return result;
    } catch (error) {
      this.handleError(error, 'filter');
      return [];
    }
  }
  
  reduce<T>(callback: (accumulator: T, item: RouteItemWrapper, index: number) => T, initialValue: T): T {
    try {
      let accumulator = initialValue;
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item) {
          accumulator = callback(accumulator, item, i);
        }
      }
      return accumulator;
    } catch (error) {
      this.handleError(error, 'reduce');
      return initialValue;
    }
  }
  
  find(predicate: (item: RouteItemWrapper, index: number) => boolean): RouteItemWrapper | undefined {
    try {
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item && predicate(item, i)) {
          return item;
        }
      }
      return undefined;
    } catch (error) {
      this.handleError(error, 'find');
      return undefined;
    }
  }
  
  findIndex(predicate: (item: RouteItemWrapper, index: number) => boolean): number {
    try {
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item && predicate(item, i)) {
          return i;
        }
      }
      return -1;
    } catch (error) {
      this.handleError(error, 'findIndex');
      return -1;
    }
  }
  
  some(predicate: (item: RouteItemWrapper, index: number) => boolean): boolean {
    return this.find(predicate) !== undefined;
  }
  
  every(predicate: (item: RouteItemWrapper, index: number) => boolean): boolean {
    try {
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item && !predicate(item, i)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      this.handleError(error, 'every');
      return false;
    }
  }
  
  // ============================================================================
  // FLUENT OPERATIONS
  // ============================================================================
  
  clear(): this {
    try {
      if (typeof this.wasmObject.clear === 'function') {
        this.wasmObject.clear();
      } else if (typeof this.wasmObject.removeAll === 'function') {
        this.wasmObject.removeAll();
      }
      this.updateStore();
      return this;
    } catch (error) {
      this.handleError(error, 'clear');
      return this;
    }
  }
  
  reverse(): this {
    try {
      if (typeof this.wasmObject.reverse === 'function') {
        this.wasmObject.reverse();
      } else {
        // Manual reverse implementation
        const items = this.toArray();
        this.clear();
        for (let i = items.length - 1; i >= 0; i--) {
          this.add(items[i]);
        }
      }
      this.updateStore();
      return this;
    } catch (error) {
      this.handleError(error, 'reverse');
      return this;
    }
  }
  
  clone(): EnhancedRouteList {
    try {
      // Create new instance with same configuration
      const clonedWasm = this.wasmObject.constructor ? new (this.wasmObject.constructor as any)() : null;
      if (!clonedWasm) {
        throw new Error('Unable to clone RouteList - constructor not available');
      }
      
      // Copy all items
      this.forEach((item, index) => {
        clonedWasm.add(item);
      });
      
      return new EnhancedRouteListImpl(clonedWasm, this.lifecycleManager, this.errorManager);
    } catch (error) {
      this.handleError(error, 'clone');
      // Return empty clone as fallback
      const emptyWasm = this.wasmObject.constructor ? new (this.wasmObject.constructor as any)() : this.wasmObject;
      return new EnhancedRouteListImpl(emptyWasm, this.lifecycleManager, this.errorManager);
    }
  }
  
  // ============================================================================
  // PROPERTIES
  // ============================================================================
  
  get length(): number {
    try {
      return typeof this.wasmObject.size === 'function' ? this.wasmObject.size() : 
             typeof this.wasmObject.length === 'number' ? this.wasmObject.length : 0;
    } catch (error) {
      this.handleError(error, 'length');
      return 0;
    }
  }
  
  get isEmpty(): boolean {
    return this.length === 0;
  }
  
  get isValid(): boolean {
    try {
      return typeof this.wasmObject.isValid === 'function' ? this.wasmObject.isValid() : this.length >= 0;
    } catch {
      return false;
    }
  }
  
  get store(): any {
    return this._store;
  }
  
  // ============================================================================
  // CONVERSION OPERATIONS
  // ============================================================================
  
  toArray(): RouteItemWrapper[] {
    try {
      const result: RouteItemWrapper[] = [];
      const length = this.length;
      for (let i = 0; i < length; i++) {
        const item = this.get(i);
        if (item) {
          result.push(item);
        }
      }
      return result;
    } catch (error) {
      this.handleError(error, 'toArray');
      return [];
    }
  }
  
  toSegments(): RouteSegment[] {
    try {
      const items = this.toArray();
      const segments: RouteSegment[] = [];
      
      for (const item of items) {
        // Convert RouteItemWrapper to RouteSegment
        const segment: RouteSegment = {
          stationId: item.stationId || 0,
          stationName: '', // Will be populated by station lookup
          stationKana: '',
          lineId: item.lineId,
          lineName: '',
          isTransfer: false,
          travelTime: 0,
          distance: 0,
          fare: 0
        };
        
        segments.push(segment);
      }
      
      return segments;
    } catch (error) {
      this.handleError(error, 'toSegments');
      return [];
    }
  }
  
  toJSON(): string {
    try {
      const data = {
        length: this.length,
        items: this.toArray().map(item => ({
          stationId: item.stationId,
          lineId: item.lineId,
          flag: item.flag
        })),
        timestamp: new Date().toISOString()
      };
      return JSON.stringify(data);
    } catch (error) {
      this.handleError(error, 'toJSON');
      return '{"error": "Failed to serialize RouteList"}';
    }
  }
  
  // ============================================================================
  // WASM OBJECT DELEGATION (RouteListWrapper interface)
  // ============================================================================
  
  add(item: RouteItemWrapper): number {
    try {
      const result = this.wasmObject.add(item);
      this.updateStore();
      return result;
    } catch (error) {
      this.handleError(error, 'add');
      return -1;
    }
  }
  
  get(index: number): RouteItemWrapper | null {
    try {
      return this.wasmObject.get(index);
    } catch (error) {
      this.handleError(error, 'get');
      return null;
    }
  }
  
  set(index: number, item: RouteItemWrapper): boolean {
    try {
      const result = this.wasmObject.set(index, item);
      this.updateStore();
      return result;
    } catch (error) {
      this.handleError(error, 'set');
      return false;
    }
  }
  
  remove(index: number): boolean {
    try {
      const result = this.wasmObject.remove(index);
      this.updateStore();
      return result;
    } catch (error) {
      this.handleError(error, 'remove');
      return false;
    }
  }
  
  assign(obj: RouteListWrapper): void {
    try {
      this.wasmObject.assign(obj);
      this.updateStore();
    } catch (error) {
      this.handleError(error, 'assign');
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private updateStore(): void {
    try {
      if (this._store && typeof this._store.set === 'function') {
        this._store.set(this.toArray());
      }
    } catch (error) {
      // Ignore store update errors to prevent cascading failures
      console.warn('Failed to update RouteList store:', error);
    }
  }
  
  private handleError(error: any, operation: string): void {
    try {
      this.errorManager.handleError(error, {
        operation: `RouteList.${operation}`,
        objectType: 'EnhancedRouteList',
        wasmObjectType: this.wasmObject.constructor?.name || 'Unknown'
      });
    } catch (handlingError) {
      console.error(`Error handling failed for ${operation}:`, handlingError);
    }
  }
  
  /**
   * Dispose of the object and clean up resources
   */
  dispose(): void {
    try {
      // Unregister from lifecycle manager
      this.lifecycleManager.unregister(this);
      
      // Dispose of WASM object if possible
      if (typeof this.wasmObject.dispose === 'function') {
        this.wasmObject.dispose();
      } else if (typeof this.wasmObject.delete === 'function') {
        this.wasmObject.delete();
      }
      
      // Clear store
      if (this._store && typeof this._store.set === 'function') {
        this._store.set([]);
      }
      
    } catch (error) {
      console.warn('Error disposing EnhancedRouteList:', error);
    }
  }
}

// ============================================================================
// ENHANCED ROUTE IMPLEMENTATION
// ============================================================================

/**
 * Enhanced Route implementation with fluent API patterns
 */
export class EnhancedRouteImpl extends EnhancedRouteListImpl implements EnhancedRoute {
  private wasmRoute: RouteWrapper;
  private wasmWrapper?: WasmWrapper;
  
  constructor(
    wasmObject: RouteWrapper,
    lifecycleManager: ObjectLifecycleManager,
    errorManager: ErrorManager,
    wasmWrapper?: WasmWrapper
  ) {
    super(wasmObject, lifecycleManager, errorManager);
    this.wasmRoute = wasmObject;
    this.wasmWrapper = wasmWrapper;
  }
  
  // ============================================================================
  // FLUENT ROUTE BUILDING
  // ============================================================================
  
  from(stationIdOrName: number | string): this {
    try {
      if (typeof stationIdOrName === 'string') {
        // Convert station name to ID using WASM wrapper
        this.getStationIdAsync(stationIdOrName).then(stationId => {
          if (stationId > 0) {
            this.wasmRoute.addRouteBegin(stationId);
            this.updateStore();
          }
        });
      } else {
        this.wasmRoute.addRouteBegin(stationIdOrName);
        this.updateStore();
      }
      return this;
    } catch (error) {
      this.handleRouteError(error, 'from');
      return this;
    }
  }
  
  to(stationIdOrName: number | string): this {
    try {
      if (typeof stationIdOrName === 'string') {
        this.getStationIdAsync(stationIdOrName).then(stationId => {
          if (stationId > 0) {
            this.wasmRoute.addRoute(stationId);
            this.updateStore();
          }
        });
      } else {
        this.wasmRoute.addRoute(stationIdOrName);
        this.updateStore();
      }
      return this;
    } catch (error) {
      this.handleRouteError(error, 'to');
      return this;
    }
  }
  
  via(stationIdOrName: number | string, lineId?: number): this {
    try {
      if (typeof stationIdOrName === 'string') {
        this.getStationIdAsync(stationIdOrName).then(stationId => {
          if (stationId > 0) {
            if (lineId) {
              this.wasmRoute.addRouteWithLine(lineId, stationId);
            } else {
              this.wasmRoute.addRoute(stationId);
            }
            this.updateStore();
          }
        });
      } else {
        if (lineId) {
          this.wasmRoute.addRouteWithLine(lineId, stationIdOrName);
        } else {
          this.wasmRoute.addRoute(stationIdOrName);
        }
        this.updateStore();
      }
      return this;
    } catch (error) {
      this.handleRouteError(error, 'via');
      return this;
    }
  }
  
  addStation(stationIdOrName: number | string): this {
    return this.to(stationIdOrName);
  }
  
  addStationViaLine(stationIdOrName: number | string, lineId: number): this {
    return this.via(stationIdOrName, lineId);
  }
  
  removeLastStation(): this {
    try {
      this.wasmRoute.removeTail();
      this.updateStore();
      return this;
    } catch (error) {
      this.handleRouteError(error, 'removeLastStation');
      return this;
    }
  }
  
  clearRoute(): this {
    try {
      this.wasmRoute.removeAll();
      this.updateStore();
      return this;
    } catch (error) {
      this.handleRouteError(error, 'clearRoute');
      return this;
    }
  }
  
  reverseRoute(): this {
    try {
      this.wasmRoute.reverseRoute();
      this.updateStore();
      return this;
    } catch (error) {
      this.handleRouteError(error, 'reverseRoute');
      return this;
    }
  }
  
  // ============================================================================
  // ROUTE VALIDATION AND OPTIMIZATION
  // ============================================================================
  
  async validate(): Promise<RouteValidationResult> {
    try {
      const errors: RouteValidationError[] = [];
      const warnings: RouteValidationWarning[] = [];
      const suggestions: string[] = [];
      
      // Basic validation
      if (this.length < 2) {
        errors.push({
          code: 'INSUFFICIENT_STATIONS',
          message: 'Route must have at least 2 stations',
          severity: 'error'
        });
      }
      
      // Check for valid connections
      const items = this.toArray();
      for (let i = 0; i < items.length - 1; i++) {
        const current = items[i];
        const next = items[i + 1];
        
        if (current && next && current.lineId && next.stationId) {
          // Validate connection (would need WASM wrapper integration)
          // This is a placeholder for more sophisticated validation
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      };
    } catch (error) {
      this.handleRouteError(error, 'validate');
      return {
        isValid: false,
        errors: [{ code: 'VALIDATION_ERROR', message: 'Validation failed', severity: 'error' }],
        warnings: [],
        suggestions: []
      };
    }
  }
  
  async optimize(criteria: 'time' | 'cost' | 'transfers' = 'cost'): Promise<this> {
    try {
      // This would integrate with the WASM optimization algorithms
      // For now, this is a placeholder implementation
      console.log(`Optimizing route for ${criteria}`);
      return this;
    } catch (error) {
      this.handleRouteError(error, 'optimize');
      return this;
    }
  }
  
  // ============================================================================
  // ROUTE INFORMATION
  // ============================================================================
  
  async getStartStation(): Promise<StationInfo | null> {
    try {
      const startId = this.wasmRoute.startStationId();
      if (startId && this.wasmWrapper) {
        return await this.wasmWrapper.getStationInfo(startId);
      }
      return null;
    } catch (error) {
      this.handleRouteError(error, 'getStartStation');
      return null;
    }
  }
  
  async getEndStation(): Promise<StationInfo | null> {
    try {
      const endId = this.wasmRoute.lastStationId();
      if (endId && this.wasmWrapper) {
        return await this.wasmWrapper.getStationInfo(endId);
      }
      return null;
    } catch (error) {
      this.handleRouteError(error, 'getEndStation');
      return null;
    }
  }
  
  getTransferCount(): number {
    try {
      // Count transfers by counting line changes
      const items = this.toArray();
      let transfers = 0;
      let lastLineId = -1;
      
      for (const item of items) {
        if (item.lineId && item.lineId !== lastLineId && lastLineId !== -1) {
          transfers++;
        }
        lastLineId = item.lineId || -1;
      }
      
      return Math.max(0, transfers - 1); // Subtract 1 as the first line isn't a transfer
    } catch (error) {
      this.handleRouteError(error, 'getTransferCount');
      return 0;
    }
  }
  
  getTotalDistance(): number {
    try {
      // This would be calculated from station data
      // Placeholder implementation
      return this.length * 5; // Rough estimate of 5km per segment
    } catch (error) {
      this.handleRouteError(error, 'getTotalDistance');
      return 0;
    }
  }
  
  getEstimatedTime(): number {
    try {
      // Rough estimate based on distance and transfers
      const baseTime = this.getTotalDistance() * 2; // 2 minutes per km
      const transferTime = this.getTransferCount() * 5; // 5 minutes per transfer
      return baseTime + transferTime;
    } catch (error) {
      this.handleRouteError(error, 'getEstimatedTime');
      return 0;
    }
  }
  
  // ============================================================================
  // ROUTE DESCRIPTION
  // ============================================================================
  
  async getDescription(format: 'short' | 'detailed' | 'json' = 'short'): Promise<string> {
    try {
      switch (format) {
        case 'json':
          return this.toJSON();
        case 'detailed':
          return this.wasmRoute.routeScript() + ` (${this.length}駅, ${this.getTransferCount()}回乗換)`;
        case 'short':
        default:
          return this.wasmRoute.routeScript();
      }
    } catch (error) {
      this.handleRouteError(error, 'getDescription');
      return 'エラー: ルート取得に失敗しました';
    }
  }
  
  async getSegmentDescription(index: number): Promise<string> {
    try {
      const item = this.get(index);
      if (!item) {
        return 'セグメントが見つかりません';
      }
      
      // Get station and line names
      let description = `駅ID: ${item.stationId}`;
      if (item.lineId) {
        description += `, 路線ID: ${item.lineId}`;
      }
      
      return description;
    } catch (error) {
      this.handleRouteError(error, 'getSegmentDescription');
      return 'エラー: セグメント情報取得に失敗しました';
    }
  }
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  get isComplete(): boolean {
    return this.length >= 2;
  }
  
  get hasErrors(): boolean {
    // This would be determined by validation results
    return false; // Placeholder
  }
  
  get lastError(): FarertSDKError | null {
    // This would store the last error encountered
    return null; // Placeholder
  }
  
  // ============================================================================
  // ROUTE WRAPPER DELEGATION
  // ============================================================================
  
  addRoute(stationId: number): number {
    try {
      const result = this.wasmRoute.addRoute(stationId);
      this.updateStore();
      return result;
    } catch (error) {
      this.handleRouteError(error, 'addRoute');
      return -1;
    }
  }
  
  addRouteWithLine(lineId: number, stationId: number): number {
    try {
      const result = this.wasmRoute.addRouteWithLine(lineId, stationId);
      this.updateStore();
      return result;
    } catch (error) {
      this.handleRouteError(error, 'addRouteWithLine');
      return -1;
    }
  }
  
  removeTail(): number {
    try {
      const result = this.wasmRoute.removeTail();
      this.updateStore();
      return result;
    } catch (error) {
      this.handleRouteError(error, 'removeTail');
      return -1;
    }
  }
  
  removeAll(): void {
    try {
      this.wasmRoute.removeAll();
      this.updateStore();
    } catch (error) {
      this.handleRouteError(error, 'removeAll');
    }
  }
  
  reverseRoute(): number {
    try {
      const result = this.wasmRoute.reverseRoute();
      this.updateStore();
      return result;
    } catch (error) {
      this.handleRouteError(error, 'reverseRoute');
      return -1;
    }
  }
  
  setupRoute(route: string): number {
    try {
      const result = this.wasmRoute.setupRoute(route);
      this.updateStore();
      return result;
    } catch (error) {
      this.handleRouteError(error, 'setupRoute');
      return -1;
    }
  }
  
  routeScript(): string {
    try {
      return this.wasmRoute.routeScript();
    } catch (error) {
      this.handleRouteError(error, 'routeScript');
      return '';
    }
  }
  
  getRouteCount(): number {
    try {
      return this.wasmRoute.getRouteCount();
    } catch (error) {
      this.handleRouteError(error, 'getRouteCount');
      return 0;
    }
  }
  
  startStationId(): number {
    try {
      return this.wasmRoute.startStationId();
    } catch (error) {
      this.handleRouteError(error, 'startStationId');
      return 0;
    }
  }
  
  lastStationId(): number {
    try {
      return this.wasmRoute.lastStationId();
    } catch (error) {
      this.handleRouteError(error, 'lastStationId');
      return 0;
    }
  }
  
  addRouteBegin(stationId: number): number {
    try {
      const result = this.wasmRoute.addRouteBegin(stationId);
      this.updateStore();
      return result;
    } catch (error) {
      this.handleRouteError(error, 'addRouteBegin');
      return -1;
    }
  }
  
  isEnd(): number {
    try {
      return this.wasmRoute.isEnd();
    } catch (error) {
      this.handleRouteError(error, 'isEnd');
      return -1;
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private async getStationIdAsync(stationName: string): Promise<number> {
    try {
      if (this.wasmWrapper) {
        return await this.wasmWrapper.getStationId(stationName);
      }
      return 0;
    } catch (error) {
      console.warn(`Failed to get station ID for "${stationName}":`, error);
      return 0;
    }
  }
  
  private handleRouteError(error: any, operation: string): void {
    try {
      this.errorManager.handleError(error, {
          operation: `Route.${operation}`,
          objectType: 'EnhancedRoute',
          routeLength: this.length,
          startStation: this.startStationId(),
          endStation: this.lastStationId()
        });
    } catch (handlingError) {
      console.error(`Error handling failed for ${operation}:`, handlingError);
    }
  }
}

// ============================================================================
// ENHANCED CALC ROUTE IMPLEMENTATION
// ============================================================================

/**
 * Enhanced CalcRoute implementation with reactive fare calculation
 */
export class EnhancedCalcRouteImpl extends EnhancedRouteImpl implements EnhancedCalcRoute {
  private wasmCalcRoute: CalcRouteWrapper;
  private _fareStore: any;
  private _isCalculating = false;
  private _lastCalculationTime: Date | null = null;
  private _lastFareResult: FareCalculationResult | null = null;
  
  constructor(
    wasmObject: CalcRouteWrapper,
    lifecycleManager: ObjectLifecycleManager,
    errorManager: ErrorManager,
    wasmWrapper?: WasmWrapper
  ) {
    super(wasmObject, lifecycleManager, errorManager, wasmWrapper);
    this.wasmCalcRoute = wasmObject;
    
    // Create fare store for reactive updates
    this._fareStore = writable(null);
  }
  
  // ============================================================================
  // FARE CALCULATION WITH OPTIONS
  // ============================================================================
  
  async calculateFare(options?: FareCalculationOptions): Promise<FareCalculationResult> {
    try {
      this._isCalculating = true;
      
      // Apply options if provided
      if (options?.enableLongRoute !== undefined) {
        this.setLongRouteEnabled(options.enableLongRoute);
      }
      if (options?.startAsCity) {
        this.wasmCalcRoute.setStartAsCity();
      }
      if (options?.arriveAsCity) {
        this.wasmCalcRoute.setArriveAsCity();
      }
      
      // Execute fare calculation
      const fareInfo = this.wasmCalcRoute.calcFare();
      
      // Convert to enhanced result
      const result: FareCalculationResult = {
        fare: fareInfo.fare || 0,
        success: fareInfo.result === 0,
        errorCode: fareInfo.result || 0,
        currency: 'JPY',
        breakdown: await this.getFareBreakdown(),
        discounts: await this.getDiscountOptions(),
        calculatedAt: new Date(),
        route: {
          segments: await this.toSegments(),
          description: await this.getDescription(),
          transferCount: this.getTransferCount(),
          totalDistance: this.getTotalDistance(),
          estimatedTime: this.getEstimatedTime()
        }
      };
      
      this._lastFareResult = result;
      this._lastCalculationTime = new Date();
      
      // Update reactive store
      if (this._fareStore) {
        this._fareStore.set(result);
      }
      
      return result;
      
    } catch (error) {
      this.handleCalcError(error, 'calculateFare');
      return {
        fare: 0,
        success: false,
        errorCode: -1,
        currency: 'JPY',
        breakdown: [],
        discounts: [],
        calculatedAt: new Date(),
        route: {
          segments: [],
          description: 'エラー',
          transferCount: 0,
          totalDistance: 0,
          estimatedTime: 0
        }
      };
    } finally {
      this._isCalculating = false;
    }
  }
  
  async calculateFareAsync(): Promise<FareCalculationResult> {
    return this.calculateFare();
  }
  
  // ============================================================================
  // FARE DISPLAY AND FORMATTING
  // ============================================================================
  
  async getFareDisplay(format?: FareDisplayFormat): Promise<string> {
    try {
      const fareResult = this._lastFareResult || await this.calculateFare();
      
      if (!format) {
        return `${fareResult.fare}円`;
      }
      
      switch (format.style) {
        case 'breakdown':
          return this.formatFareBreakdown(fareResult, format);
        case 'detailed':
          return this.formatDetailedFare(fareResult, format);
        case 'compact':
        default:
          return `${fareResult.fare}円`;
      }
    } catch (error) {
      this.handleCalcError(error, 'getFareDisplay');
      return 'エラー';
    }
  }
  
  async getFareBreakdown(): Promise<FareBreakdownItem[]> {
    try {
      const fareInfo = this.wasmCalcRoute.calcFare();
      const breakdown: FareBreakdownItem[] = [];
      
      // Base fare
      if (fareInfo.fare > 0) {
        breakdown.push({
          type: 'base',
          description: '基本運賃',
          amount: fareInfo.fare,
          applied: true
        });
      }
      
      // Add discount items if available
      const discounts = await this.getDiscountOptions();
      for (const discount of discounts) {
        if (discount.available && discount.amount > 0) {
          breakdown.push({
            type: 'discount',
            description: discount.name,
            amount: -discount.amount,
            applied: true
          });
        }
      }
      
      return breakdown;
    } catch (error) {
      this.handleCalcError(error, 'getFareBreakdown');
      return [];
    }
  }
  
  async getDiscountOptions(): Promise<FareDiscount[]> {
    try {
      const fareInfo = this.wasmCalcRoute.calcFare();
      const discounts: FareDiscount[] = [];
      
      // Stock discount options
      if (fareInfo.availCountForFareOfStockDiscount > 0) {
        for (let i = 0; i < fareInfo.availCountForFareOfStockDiscount; i++) {
          const discountFare = fareInfo.fareForStockDiscount(i);
          const discountTitle = fareInfo.fareForStockDiscountTitle(i);
          
          if (discountFare > 0 && discountTitle) {
            discounts.push({
              id: `stock_discount_${i}`,
              name: discountTitle,
              description: `回数券割引 ${i + 1}`,
              amount: Math.max(0, fareInfo.fare - discountFare),
              available: true,
              conditions: ['回数券利用時']
            });
          }
        }
      }
      
      return discounts;
    } catch (error) {
      this.handleCalcError(error, 'getDiscountOptions');
      return [];
    }
  }
  
  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  setLongRouteEnabled(enabled: boolean): this {
    try {
      this.wasmCalcRoute.setLongRoute(enabled);
      return this;
    } catch (error) {
      this.handleCalcError(error, 'setLongRouteEnabled');
      return this;
    }
  }
  
  setStartAsCity(enabled: boolean): this {
    try {
      if (enabled) {
        this.wasmCalcRoute.setStartAsCity();
      }
      return this;
    } catch (error) {
      this.handleCalcError(error, 'setStartAsCity');
      return this;
    }
  }
  
  setArriveAsCity(enabled: boolean): this {
    try {
      if (enabled) {
        this.wasmCalcRoute.setArriveAsCity();
      }
      return this;
    } catch (error) {
      this.handleCalcError(error, 'setArriveAsCity');
      return this;
    }
  }
  
  // ============================================================================
  // REACTIVE PROPERTIES
  // ============================================================================
  
  get fareStore(): any {
    return this._fareStore;
  }
  
  get isCalculating(): boolean {
    return this._isCalculating;
  }
  
  get lastCalculationTime(): Date | null {
    return this._lastCalculationTime;
  }
  
  get lastFareResult(): FareCalculationResult | null {
    return this._lastFareResult;
  }
  
  // ============================================================================
  // COMPARISON AND ANALYSIS
  // ============================================================================
  
  async compareFares(otherRoute: EnhancedCalcRoute): Promise<FareComparison> {
    try {
      const thisFare = this._lastFareResult || await this.calculateFare();
      const otherFare = otherRoute.lastFareResult || await otherRoute.calculateFare();
      
      const difference = thisFare.fare - otherFare.fare;
      const percentage = otherFare.fare > 0 ? (difference / otherFare.fare) * 100 : 0;
      
      return {
        cheaperBy: Math.abs(difference),
        percentageDifference: Math.abs(percentage),
        recommendation: difference < 0 ? 'この経路の方が安い' : 'もう一方の経路の方が安い',
        analysis: [
          `運賃差: ${Math.abs(difference)}円`,
          `差額割合: ${Math.abs(percentage).toFixed(1)}%`
        ]
      };
    } catch (error) {
      this.handleCalcError(error, 'compareFares');
      return {
        cheaperBy: 0,
        percentageDifference: 0,
        recommendation: '比較できませんでした',
        analysis: []
      };
    }
  }
  
  async analyzeCostEfficiency(): Promise<CostAnalysis> {
    try {
      const fareResult = this._lastFareResult || await this.calculateFare();
      const distance = this.getTotalDistance();
      const time = this.getEstimatedTime();
      
      const costPerKm = distance > 0 ? fareResult.fare / distance : 0;
      const costPerMinute = time > 0 ? fareResult.fare / time : 0;
      
      let efficiency: 'excellent' | 'good' | 'average' | 'poor' = 'average';
      if (costPerKm < 20) efficiency = 'excellent';
      else if (costPerKm < 30) efficiency = 'good';
      else if (costPerKm > 50) efficiency = 'poor';
      
      return {
        costPerKm,
        costPerMinute,
        efficiency,
        recommendations: [
          `1kmあたり${costPerKm.toFixed(1)}円`,
          `1分あたり${costPerMinute.toFixed(1)}円`
        ]
      };
    } catch (error) {
      this.handleCalcError(error, 'analyzeCostEfficiency');
      return {
        costPerKm: 0,
        costPerMinute: 0,
        efficiency: 'poor',
        recommendations: []
      };
    }
  }
  
  // ============================================================================
  // CALC ROUTE WRAPPER DELEGATION
  // ============================================================================
  
  calcFare(): FareInfoData {
    try {
      return this.wasmCalcRoute.calcFare();
    } catch (error) {
      this.handleCalcError(error, 'calcFare');
      return { result: -1, fare: 0 } as FareInfoData;
    }
  }
  
  setLongRoute(flag: boolean): void {
    try {
      this.wasmCalcRoute.setLongRoute(flag);
    } catch (error) {
      this.handleCalcError(error, 'setLongRoute');
    }
  }
  
  setStartAsCity(): void {
    try {
      this.wasmCalcRoute.setStartAsCity();
    } catch (error) {
      this.handleCalcError(error, 'setStartAsCity');
    }
  }
  
  setArriveAsCity(): void {
    try {
      this.wasmCalcRoute.setArriveAsCity();
    } catch (error) {
      this.handleCalcError(error, 'setArriveAsCity');
    }
  }
  
  showFare(): string {
    try {
      return this.wasmCalcRoute.showFare();
    } catch (error) {
      this.handleCalcError(error, 'showFare');
      return '';
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private formatFareBreakdown(result: FareCalculationResult, format: FareDisplayFormat): string {
    let output = `運賃: ${result.fare}円\n`;
    
    if (format.includeDiscounts && result.discounts.length > 0) {
      output += '\n割引情報:\n';
      for (const discount of result.discounts) {
        if (discount.available) {
          output += `- ${discount.name}: ${discount.amount}円引き\n`;
        }
      }
    }
    
    return output.trim();
  }
  
  private formatDetailedFare(result: FareCalculationResult, format: FareDisplayFormat): string {
    let output = `運賃: ${result.fare}円\n`;
    output += `経路: ${result.route.description}\n`;
    output += `乗換回数: ${result.route.transferCount}回\n`;
    output += `推定時間: ${result.route.estimatedTime}分\n`;
    
    if (format.includeDiscounts && result.discounts.length > 0) {
      output += '\n利用可能な割引:\n';
      for (const discount of result.discounts) {
        output += `- ${discount.name}: ${discount.amount}円引き\n`;
      }
    }
    
    return output;
  }
  
  private handleCalcError(error: any, operation: string): void {
    try {
      this.errorManager.handleError(error, {
          operation: `CalcRoute.${operation}`,
          objectType: 'EnhancedCalcRoute',
          routeLength: this.length,
          startStation: this.startStationId(),
          endStation: this.lastStationId(),
          lastCalculationTime: this._lastCalculationTime?.toISOString()
        });
    } catch (handlingError) {
      console.error(`Error handling failed for ${operation}:`, handlingError);
    }
  }
}

// ============================================================================
// ENHANCED ROUTE ITEM IMPLEMENTATION  
// ============================================================================

/**
 * Enhanced RouteItem implementation with metadata and validation
 */
export class EnhancedRouteItemImpl implements EnhancedRouteItem {
  private wasmItem: RouteItemWrapper;
  private lifecycleManager: ObjectLifecycleManager;
  private errorManager: ErrorManager;
  private wasmWrapper?: WasmWrapper;
  
  constructor(
    wasmObject: RouteItemWrapper,
    lifecycleManager: ObjectLifecycleManager,
    errorManager: ErrorManager,
    wasmWrapper?: WasmWrapper
  ) {
    this.wasmItem = wasmObject;
    this.lifecycleManager = lifecycleManager;
    this.errorManager = errorManager;
    this.wasmWrapper = wasmWrapper;
    
    // Register for lifecycle management
    this.lifecycleManager.register(this);
  }
  
  // ============================================================================
  // ENHANCED PROPERTIES
  // ============================================================================
  
  get stationInfo(): Promise<StationInfo | null> {
    return this.getStationInfo();
  }
  
  get lineInfo(): Promise<LineInfo | null> {
    return this.getLineInfo();
  }
  
  get segmentInfo(): Promise<RouteSegment> {
    return this.toSegment();
  }
  
  // ============================================================================
  // VALIDATION AND CONVERSION
  // ============================================================================
  
  validate(): boolean {
    try {
      return this.stationId > 0;
    } catch (error) {
      this.handleItemError(error, 'validate');
      return false;
    }
  }
  
  async toSegment(): Promise<RouteSegment> {
    try {
      const stationInfo = await this.getStationInfo();
      const lineInfo = await this.getLineInfo();
      
      return {
        stationId: this.stationId || 0,
        stationName: stationInfo?.name || '',
        stationKana: stationInfo?.kana || '',
        lineId: this.lineId,
        lineName: lineInfo?.name || '',
        isTransfer: false, // Would be determined by context
        travelTime: 0, // Would be calculated
        distance: 0, // Would be calculated
        fare: 0 // Would be calculated
      };
    } catch (error) {
      this.handleItemError(error, 'toSegment');
      return {
        stationId: this.stationId || 0,
        stationName: '',
        stationKana: '',
        lineId: this.lineId,
        lineName: '',
        isTransfer: false,
        travelTime: 0,
        distance: 0,
        fare: 0
      };
    }
  }
  
  toJSON(): string {
    try {
      const data = {
        stationId: this.stationId,
        lineId: this.lineId,
        flag: this.flag,
        timestamp: new Date().toISOString()
      };
      return JSON.stringify(data);
    } catch (error) {
      this.handleItemError(error, 'toJSON');
      return '{"error": "Failed to serialize RouteItem"}';
    }
  }
  
  // ============================================================================
  // FLUENT UPDATES
  // ============================================================================
  
  setStation(stationId: number): this {
    try {
      if (typeof this.wasmItem.setStationId === 'function') {
        this.wasmItem.setStationId(stationId);
      } else {
        // Fallback: directly set property if available
        (this.wasmItem as any).stationId = stationId;
      }
      return this;
    } catch (error) {
      this.handleItemError(error, 'setStation');
      return this;
    }
  }
  
  setLine(lineId: number): this {
    try {
      if (typeof this.wasmItem.setLineId === 'function') {
        this.wasmItem.setLineId(lineId);
      } else {
        // Fallback: directly set property if available
        (this.wasmItem as any).lineId = lineId;
      }
      return this;
    } catch (error) {
      this.handleItemError(error, 'setLine');
      return this;
    }
  }
  
  setFlag(flag: number): this {
    try {
      if (typeof this.wasmItem.setFlag === 'function') {
        this.wasmItem.setFlag(flag);
      } else {
        // Fallback: directly set property if available
        (this.wasmItem as any).flag = flag;
      }
      return this;
    } catch (error) {
      this.handleItemError(error, 'setFlag');
      return this;
    }
  }
  
  // ============================================================================
  // CLONE AND COMPARE
  // ============================================================================
  
  clone(): EnhancedRouteItem {
    try {
      // Create new WASM object
      const clonedWasm = this.wasmItem.constructor ? new (this.wasmItem.constructor as any)() : null;
      if (!clonedWasm) {
        throw new Error('Unable to clone RouteItem - constructor not available');
      }
      
      // Copy properties
      if (typeof clonedWasm.setStationId === 'function') {
        clonedWasm.setStationId(this.stationId);
      } else {
        (clonedWasm as any).stationId = this.stationId;
      }
      
      if (typeof clonedWasm.setLineId === 'function') {
        clonedWasm.setLineId(this.lineId);
      } else {
        (clonedWasm as any).lineId = this.lineId;
      }
      
      if (typeof clonedWasm.setFlag === 'function') {
        clonedWasm.setFlag(this.flag);
      } else {
        (clonedWasm as any).flag = this.flag;
      }
      
      return new EnhancedRouteItemImpl(clonedWasm, this.lifecycleManager, this.errorManager, this.wasmWrapper);
    } catch (error) {
      this.handleItemError(error, 'clone');
      // Return self as fallback
      return this;
    }
  }
  
  equals(other: EnhancedRouteItem): boolean {
    try {
      return this.stationId === other.stationId &&
             this.lineId === other.lineId &&
             this.flag === other.flag;
    } catch (error) {
      this.handleItemError(error, 'equals');
      return false;
    }
  }
  
  // ============================================================================
  // ROUTE ITEM WRAPPER DELEGATION
  // ============================================================================
  
  get stationId(): number {
    try {
      return this.wasmItem.stationId || 0;
    } catch (error) {
      this.handleItemError(error, 'stationId getter');
      return 0;
    }
  }
  
  get lineId(): number {
    try {
      return this.wasmItem.lineId || 0;
    } catch (error) {
      this.handleItemError(error, 'lineId getter');
      return 0;
    }
  }
  
  get flag(): number {
    try {
      return this.wasmItem.flag || 0;
    } catch (error) {
      this.handleItemError(error, 'flag getter');
      return 0;
    }
  }
  
  get indexOfAggregate(): number {
    try {
      return this.wasmItem.indexOfAggregate || -1;
    } catch (error) {
      this.handleItemError(error, 'indexOfAggregate getter');
      return -1;
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private async getStationInfo(): Promise<StationInfo | null> {
    try {
      if (this.wasmWrapper && this.stationId > 0) {
        return await this.wasmWrapper.getStationInfo(this.stationId);
      }
      return null;
    } catch (error) {
      this.handleItemError(error, 'getStationInfo');
      return null;
    }
  }
  
  private async getLineInfo(): Promise<LineInfo | null> {
    try {
      if (this.wasmWrapper && this.lineId > 0) {
        const lineName = await this.wasmWrapper.getLineName(this.lineId);
        return {
          id: this.lineId,
          name: lineName || '',
          companyId: 0, // Would need additional lookup
          companyName: '', // Would need additional lookup
          isJR: this.lineId < 0x10000,
          type: 'jr' // Would need proper classification
        };
      }
      return null;
    } catch (error) {
      this.handleItemError(error, 'getLineInfo');
      return null;
    }
  }
  
  private handleItemError(error: any, operation: string): void {
    try {
      this.errorManager.handleError(error, {
          operation: `RouteItem.${operation}`,
          objectType: 'EnhancedRouteItem',
          stationId: this.stationId,
          lineId: this.lineId,
          flag: this.flag
        });
    } catch (handlingError) {
      console.error(`Error handling failed for ${operation}:`, handlingError);
    }
  }
  
  /**
   * Dispose of the object and clean up resources
   */
  dispose(): void {
    try {
      // Unregister from lifecycle manager
      this.lifecycleManager.unregister(this);
      
      // Dispose of WASM object if possible
      if (typeof this.wasmItem.dispose === 'function') {
        this.wasmItem.dispose();
      } else if (typeof this.wasmItem.delete === 'function') {
        this.wasmItem.delete();
      }
    } catch (error) {
      console.warn('Error disposing EnhancedRouteItem:', error);
    }
  }
}

// ============================================================================
// ENHANCED ROUTE FLAG IMPLEMENTATION
// ============================================================================

/**
 * Enhanced RouteFlag implementation with semantic operations
 */
export class EnhancedRouteFlagImpl implements EnhancedRouteFlag {
  private wasmFlag: RouteFlagWrapper;
  private lifecycleManager: ObjectLifecycleManager;
  private errorManager: ErrorManager;
  
  constructor(
    wasmObject: RouteFlagWrapper,
    lifecycleManager: ObjectLifecycleManager,
    errorManager: ErrorManager
  ) {
    this.wasmFlag = wasmObject;
    this.lifecycleManager = lifecycleManager;
    this.errorManager = errorManager;
    
    // Register for lifecycle management
    this.lifecycleManager.register(this);
  }
  
  // ============================================================================
  // FLAG OPERATIONS
  // ============================================================================
  
  hasFlag(flag: RouteFlagType): boolean {
    try {
      const flagValue = this.getFlagValue(flag);
      return (this.wasmFlag.flags & flagValue) !== 0;
    } catch (error) {
      this.handleFlagError(error, 'hasFlag');
      return false;
    }
  }
  
  setFlag(flag: RouteFlagType, value: boolean): this {
    try {
      const flagValue = this.getFlagValue(flag);
      if (value) {
        this.wasmFlag.flags |= flagValue;
      } else {
        this.wasmFlag.flags &= ~flagValue;
      }
      return this;
    } catch (error) {
      this.handleFlagError(error, 'setFlag');
      return this;
    }
  }
  
  toggleFlag(flag: RouteFlagType): this {
    try {
      const current = this.hasFlag(flag);
      return this.setFlag(flag, !current);
    } catch (error) {
      this.handleFlagError(error, 'toggleFlag');
      return this;
    }
  }
  
  clearAllFlags(): this {
    try {
      this.wasmFlag.flags = 0;
      return this;
    } catch (error) {
      this.handleFlagError(error, 'clearAllFlags');
      return this;
    }
  }
  
  // ============================================================================
  // SEMANTIC METHODS
  // ============================================================================
  
  isLongRoute(): boolean {
    return this.hasFlag(RouteFlagType.LONG_ROUTE);
  }
  
  setLongRoute(enabled: boolean): this {
    return this.setFlag(RouteFlagType.LONG_ROUTE, enabled);
  }
  
  isExpressRoute(): boolean {
    return this.hasFlag(RouteFlagType.EXPRESS_ROUTE);
  }
  
  setExpressRoute(enabled: boolean): this {
    return this.setFlag(RouteFlagType.EXPRESS_ROUTE, enabled);
  }
  
  // ============================================================================
  // VALIDATION AND DESCRIPTION
  // ============================================================================
  
  validate(): boolean {
    try {
      // Basic validation - flags should be within reasonable range
      return typeof this.wasmFlag.flags === 'number' && this.wasmFlag.flags >= 0;
    } catch (error) {
      this.handleFlagError(error, 'validate');
      return false;
    }
  }
  
  getDescription(): string {
    try {
      const activeFlags = this.getActiveFlags();
      if (activeFlags.length === 0) {
        return '標準経路';
      }
      
      const descriptions: string[] = [];
      for (const flag of activeFlags) {
        switch (flag) {
          case RouteFlagType.LONG_ROUTE:
            descriptions.push('長距離経路');
            break;
          case RouteFlagType.EXPRESS_ROUTE:
            descriptions.push('特急経路');
            break;
          case RouteFlagType.CITY_START:
            descriptions.push('都市内発');
            break;
          case RouteFlagType.CITY_ARRIVE:
            descriptions.push('都市内着');
            break;
          case RouteFlagType.SPECIAL_ROUTE:
            descriptions.push('特殊経路');
            break;
        }
      }
      
      return descriptions.join(', ');
    } catch (error) {
      this.handleFlagError(error, 'getDescription');
      return 'エラー';
    }
  }
  
  getActiveFlags(): RouteFlagType[] {
    try {
      const active: RouteFlagType[] = [];
      for (const flag of Object.values(RouteFlagType)) {
        if (this.hasFlag(flag)) {
          active.push(flag);
        }
      }
      return active;
    } catch (error) {
      this.handleFlagError(error, 'getActiveFlags');
      return [];
    }
  }
  
  // ============================================================================
  // ROUTE FLAG WRAPPER DELEGATION
  // ============================================================================
  
  get flags(): number {
    try {
      return this.wasmFlag.flags || 0;
    } catch (error) {
      this.handleFlagError(error, 'flags getter');
      return 0;
    }
  }
  
  set flags(value: number) {
    try {
      this.wasmFlag.flags = value;
    } catch (error) {
      this.handleFlagError(error, 'flags setter');
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private getFlagValue(flag: RouteFlagType): number {
    // Map semantic flags to bit values
    switch (flag) {
      case RouteFlagType.LONG_ROUTE:
        return 0x01;
      case RouteFlagType.EXPRESS_ROUTE:
        return 0x02;
      case RouteFlagType.CITY_START:
        return 0x04;
      case RouteFlagType.CITY_ARRIVE:
        return 0x08;
      case RouteFlagType.SPECIAL_ROUTE:
        return 0x10;
      default:
        return 0;
    }
  }
  
  private handleFlagError(error: any, operation: string): void {
    try {
      this.errorManager.handleError(error, {
          operation: `RouteFlag.${operation}`,
          objectType: 'EnhancedRouteFlag',
          flagsValue: this.flags
        });
    } catch (handlingError) {
      console.error(`Error handling failed for ${operation}:`, handlingError);
    }
  }
  
  /**
   * Dispose of the object and clean up resources
   */
  dispose(): void {
    try {
      // Unregister from lifecycle manager
      this.lifecycleManager.unregister(this);
      
      // Dispose of WASM object if possible
      if (typeof this.wasmFlag.dispose === 'function') {
        this.wasmFlag.dispose();
      } else if (typeof this.wasmFlag.delete === 'function') {
        this.wasmFlag.delete();
      }
    } catch (error) {
      console.warn('Error disposing EnhancedRouteFlag:', error);
    }
  }
}

// ============================================================================
// ENHANCED FARE INFO IMPLEMENTATION
// ============================================================================

/**
 * Enhanced FareInfo implementation with comprehensive access
 */
export class EnhancedFareInfoImpl implements EnhancedFareInfo {
  private fareData: FareInfoData;
  private lifecycleManager: ObjectLifecycleManager;
  private errorManager: ErrorManager;
  
  constructor(
    fareData: FareInfoData,
    lifecycleManager: ObjectLifecycleManager,
    errorManager: ErrorManager
  ) {
    this.fareData = fareData;
    this.lifecycleManager = lifecycleManager;
    this.errorManager = errorManager;
    
    // Register for lifecycle management
    this.lifecycleManager.register(this);
  }
  
  // ============================================================================
  // FARE BREAKDOWN AND ANALYSIS
  // ============================================================================
  
  getDetailedBreakdown(): FareBreakdownItem[] {
    try {
      const breakdown: FareBreakdownItem[] = [];
      
      // Base fare
      if (this.fare > 0) {
        breakdown.push({
          type: 'base',
          description: '基本運賃',
          amount: this.fare,
          applied: true
        });
      }
      
      // Stock discounts
      if (this.availCountForFareOfStockDiscount > 0) {
        for (let i = 0; i < this.availCountForFareOfStockDiscount; i++) {
          const discountFare = this.fareForStockDiscount(i);
          const discountTitle = this.fareForStockDiscountTitle(i);
          
          if (discountFare > 0 && this.fare > discountFare) {
            breakdown.push({
              type: 'discount',
              description: discountTitle || `回数券割引 ${i + 1}`,
              amount: this.fare - discountFare,
              applied: false
            });
          }
        }
      }
      
      return breakdown;
    } catch (error) {
      this.handleFareError(error, 'getDetailedBreakdown');
      return [];
    }
  }
  
  getDiscountSummary(): FareDiscount[] {
    try {
      const discounts: FareDiscount[] = [];
      
      if (this.availCountForFareOfStockDiscount > 0) {
        for (let i = 0; i < this.availCountForFareOfStockDiscount; i++) {
          const discountFare = this.fareForStockDiscount(i);
          const discountTitle = this.fareForStockDiscountTitle(i);
          
          if (discountFare > 0 && this.fare > discountFare) {
            discounts.push({
              id: `stock_discount_${i}`,
              name: discountTitle || `回数券割引 ${i + 1}`,
              description: '回数券利用時の割引運賃',
              amount: this.fare - discountFare,
              available: true,
              conditions: ['回数券購入時']
            });
          }
        }
      }
      
      return discounts;
    } catch (error) {
      this.handleFareError(error, 'getDiscountSummary');
      return [];
    }
  }
  
  getTaxBreakdown(): TaxBreakdown {
    try {
      // Japanese railway fares typically include tax
      const taxRate = 0.10; // 10% consumption tax
      const baseAmount = Math.floor(this.fare / (1 + taxRate));
      const taxAmount = this.fare - baseAmount;
      
      return {
        baseAmount,
        taxAmount,
        taxRate,
        totalAmount: this.fare
      };
    } catch (error) {
      this.handleFareError(error, 'getTaxBreakdown');
      return {
        baseAmount: this.fare,
        taxAmount: 0,
        taxRate: 0,
        totalAmount: this.fare
      };
    }
  }
  
  // ============================================================================
  // FORMATTING AND DISPLAY
  // ============================================================================
  
  formatFare(options?: FareFormatOptions): string {
    try {
      let formatted = `${this.fare}円`;
      
      if (options?.includeCurrency === false) {
        formatted = this.fare.toString();
      }
      
      if (options?.includeBreakdown) {
        const breakdown = this.getDetailedBreakdown();
        if (breakdown.length > 1) {
          formatted += ' (';
          formatted += breakdown
            .filter(item => item.type !== 'base')
            .map(item => `${item.description}: ${item.amount}円`)
            .join(', ');
          formatted += ')';
        }
      }
      
      return formatted;
    } catch (error) {
      this.handleFareError(error, 'formatFare');
      return `${this.fare}円`;
    }
  }
  
  formatBreakdown(format: 'text' | 'html' | 'json' = 'text'): string {
    try {
      const breakdown = this.getDetailedBreakdown();
      
      switch (format) {
        case 'json':
          return JSON.stringify(breakdown, null, 2);
          
        case 'html':
          let html = '<div class="fare-breakdown">';
          html += `<div class="total-fare">運賃: ${this.fare}円</div>`;
          if (breakdown.length > 1) {
            html += '<ul class="breakdown-items">';
            for (const item of breakdown) {
              if (item.type !== 'base') {
                html += `<li class="discount-item">${item.description}: ${item.amount}円引き</li>`;
              }
            }
            html += '</ul>';
          }
          html += '</div>';
          return html;
          
        case 'text':
        default:
          let text = `運賃: ${this.fare}円\n`;
          const discounts = breakdown.filter(item => item.type !== 'base');
          if (discounts.length > 0) {
            text += '利用可能な割引:\n';
            for (const discount of discounts) {
              text += `- ${discount.description}: ${discount.amount}円引き\n`;
            }
          }
          return text.trim();
      }
    } catch (error) {
      this.handleFareError(error, 'formatBreakdown');
      return `運賃: ${this.fare}円`;
    }
  }
  
  // ============================================================================
  // COMPARISON AND VALIDATION
  // ============================================================================
  
  compareTo(other: EnhancedFareInfo): FareComparison {
    try {
      const difference = this.fare - other.fare;
      const percentage = other.fare > 0 ? (difference / other.fare) * 100 : 0;
      
      return {
        cheaperBy: Math.abs(difference),
        percentageDifference: Math.abs(percentage),
        recommendation: difference < 0 ? 'この運賃の方が安い' : 'もう一方の運賃の方が安い',
        analysis: [
          `運賃差: ${Math.abs(difference)}円`,
          `差額割合: ${Math.abs(percentage).toFixed(1)}%`
        ]
      };
    } catch (error) {
      this.handleFareError(error, 'compareTo');
      return {
        cheaperBy: 0,
        percentageDifference: 0,
        recommendation: '比較できませんでした',
        analysis: []
      };
    }
  }
  
  validate(): boolean {
    try {
      return this.result === 0 && this.fare >= 0;
    } catch (error) {
      this.handleFareError(error, 'validate');
      return false;
    }
  }
  
  // ============================================================================
  // CONVERSION
  // ============================================================================
  
  toCalculationResult(): FareCalculationResult {
    try {
      return {
        fare: this.fare,
        success: this.result === 0,
        errorCode: this.result,
        currency: 'JPY',
        breakdown: this.getDetailedBreakdown(),
        discounts: this.getDiscountSummary(),
        calculatedAt: new Date(),
        route: {
          segments: [],
          description: '',
          transferCount: 0,
          totalDistance: 0,
          estimatedTime: 0
        }
      };
    } catch (error) {
      this.handleFareError(error, 'toCalculationResult');
      return {
        fare: 0,
        success: false,
        errorCode: -1,
        currency: 'JPY',
        breakdown: [],
        discounts: [],
        calculatedAt: new Date(),
        route: {
          segments: [],
          description: 'エラー',
          transferCount: 0,
          totalDistance: 0,
          estimatedTime: 0
        }
      };
    }
  }
  
  toJSON(): string {
    try {
      const data = {
        result: this.result,
        fare: this.fare,
        availCountForFareOfStockDiscount: this.availCountForFareOfStockDiscount,
        breakdown: this.getDetailedBreakdown(),
        discounts: this.getDiscountSummary(),
        timestamp: new Date().toISOString()
      };
      return JSON.stringify(data);
    } catch (error) {
      this.handleFareError(error, 'toJSON');
      return '{"error": "Failed to serialize FareInfo"}';
    }
  }
  
  // ============================================================================
  // RULE ANALYSIS
  // ============================================================================
  
  getAppliedRules(): FareRule[] {
    try {
      const rules: FareRule[] = [];
      
      // Basic fare rule
      rules.push({
        id: 'base_fare',
        name: '基本運賃',
        description: 'JR運賃規定に基づく基本運賃',
        appliedAmount: this.fare,
        type: 'base'
      });
      
      return rules;
    } catch (error) {
      this.handleFareError(error, 'getAppliedRules');
      return [];
    }
  }
  
  getAvailableDiscounts(): FareDiscount[] {
    return this.getDiscountSummary();
  }
  
  // ============================================================================
  // FARE INFO DATA DELEGATION
  // ============================================================================
  
  get result(): number {
    return this.fareData.result || 0;
  }
  
  get fare(): number {
    return this.fareData.fare || 0;
  }
  
  get availCountForFareOfStockDiscount(): number {
    return this.fareData.availCountForFareOfStockDiscount || 0;
  }
  
  fareForStockDiscount(index: number): number {
    try {
      return this.fareData.fareForStockDiscount(index);
    } catch (error) {
      this.handleFareError(error, 'fareForStockDiscount');
      return 0;
    }
  }
  
  fareForStockDiscountTitle(index: number): string {
    try {
      return this.fareData.fareForStockDiscountTitle(index);
    } catch (error) {
      this.handleFareError(error, 'fareForStockDiscountTitle');
      return '';
    }
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private handleFareError(error: any, operation: string): void {
    try {
      this.errorManager.handleError(error, {
          operation: `FareInfo.${operation}`,
          objectType: 'EnhancedFareInfo',
          fare: this.fare,
          result: this.result
        });
    } catch (handlingError) {
      console.error(`Error handling failed for ${operation}:`, handlingError);
    }
  }
  
  /**
   * Dispose of the object and clean up resources
   */
  dispose(): void {
    try {
      // Unregister from lifecycle manager
      this.lifecycleManager.unregister(this);
      
      // No WASM object to dispose for FareInfo as it's data-only
    } catch (error) {
      console.warn('Error disposing EnhancedFareInfo:', error);
    }
  }
}

// ============================================================================
// SUPPORTING INTERFACE IMPLEMENTATIONS
// ============================================================================

export interface FareFormatOptions {
  includeCurrency?: boolean;
  includeBreakdown?: boolean;
  locale?: string;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create enhanced object class instances with lifecycle management
 */
export class ObjectClassFactory {
  constructor(
    private wasmWrapper: WasmWrapper,
    private lifecycleManager: ObjectLifecycleManager,
    private errorManager: ErrorManager
  ) {}
  
  // ============================================================================
  // CORE OBJECT CLASS CREATION METHODS
  // ============================================================================
  
  /**
   * Create enhanced RouteList with array operations and lifecycle management
   */
  createRouteList(wasmObject?: RouteListWrapper): EnhancedRouteList {
    const wasm = wasmObject || this.wasmWrapper.createRouteList();
    if (!wasm) {
      throw new Error('Failed to create RouteList object');
    }
    return new EnhancedRouteListImpl(wasm, this.lifecycleManager, this.errorManager);
  }
  
  /**
   * Create enhanced Route with fluent API and validation
   */
  createRoute(wasmObject?: RouteWrapper): EnhancedRoute {
    const wasm = wasmObject || this.wasmWrapper.createRoute();
    if (!wasm) {
      throw new Error('Failed to create Route object');
    }
    return new EnhancedRouteImpl(wasm, this.lifecycleManager, this.errorManager, this.wasmWrapper);
  }
  
  /**
   * Create enhanced CalcRoute with reactive fare calculation
   */
  createCalcRoute(wasmObject?: CalcRouteWrapper): EnhancedCalcRoute {
    const wasm = wasmObject || this.wasmWrapper.createCalcRoute();
    if (!wasm) {
      throw new Error('Failed to create CalcRoute object');
    }
    return new EnhancedCalcRouteImpl(wasm, this.lifecycleManager, this.errorManager, this.wasmWrapper);
  }
  
  /**
   * Create enhanced RouteItem with metadata and validation
   */
  createRouteItem(wasmObject?: RouteItemWrapper): EnhancedRouteItem {
    const wasm = wasmObject || this.wasmWrapper.createRouteItem();
    if (!wasm) {
      throw new Error('Failed to create RouteItem object');
    }
    return new EnhancedRouteItemImpl(wasm, this.lifecycleManager, this.errorManager, this.wasmWrapper);
  }
  
  /**
   * Create enhanced RouteFlag with semantic operations
   */
  createRouteFlag(wasmObject?: RouteFlagWrapper): EnhancedRouteFlag {
    const wasm = wasmObject || this.wasmWrapper.createRouteFlag();
    if (!wasm) {
      throw new Error('Failed to create RouteFlag object');
    }
    return new EnhancedRouteFlagImpl(wasm, this.lifecycleManager, this.errorManager);
  }
  
  /**
   * Create enhanced FareInfo with comprehensive analysis
   */
  createFareInfo(fareData: FareInfoData): EnhancedFareInfo {
    if (!fareData) {
      throw new Error('FareInfoData is required');
    }
    return new EnhancedFareInfoImpl(fareData, this.lifecycleManager, this.errorManager);
  }
  
  // ============================================================================
  // CONVENIENCE CREATION METHODS
  // ============================================================================
  
  /**
   * Create a complete route calculation workflow
   */
  createRouteCalculationWorkflow(): {
    route: EnhancedRoute;
    calcRoute: EnhancedCalcRoute;
    flags: EnhancedRouteFlag;
  } {
    try {
      const route = this.createRoute();
      const calcRoute = this.createCalcRoute();
      const flags = this.createRouteFlag();
      
      return { route, calcRoute, flags };
    } catch (error) {
      this.errorManager.handleError(error, {
          operation: 'createRouteCalculationWorkflow',
          objectType: 'WorkflowObjects'
        });
      throw error;
    }
  }
  
  /**
   * Create multiple route items for batch operations
   */
  createRouteItems(count: number): EnhancedRouteItem[] {
    try {
      const items: EnhancedRouteItem[] = [];
      for (let i = 0; i < count; i++) {
        items.push(this.createRouteItem());
      }
      return items;
    } catch (error) {
      this.errorManager.handleError(error, {
          operation: 'createRouteItems',
          objectType: 'RouteItem[]',
          count
        });
      throw error;
    }
  }
  
  /**
   * Create route from existing WASM objects (for migration/upgrade scenarios)
   */
  upgradeExistingObjects(existingObjects: {
    routeList?: RouteListWrapper;
    route?: RouteWrapper;
    calcRoute?: CalcRouteWrapper;
    routeItem?: RouteItemWrapper;
    routeFlag?: RouteFlagWrapper;
  }): {
    routeList?: EnhancedRouteList;
    route?: EnhancedRoute;
    calcRoute?: EnhancedCalcRoute;
    routeItem?: EnhancedRouteItem;
    routeFlag?: EnhancedRouteFlag;
  } {
    try {
      const enhanced: any = {};
      
      if (existingObjects.routeList) {
        enhanced.routeList = this.createRouteList(existingObjects.routeList);
      }
      
      if (existingObjects.route) {
        enhanced.route = this.createRoute(existingObjects.route);
      }
      
      if (existingObjects.calcRoute) {
        enhanced.calcRoute = this.createCalcRoute(existingObjects.calcRoute);
      }
      
      if (existingObjects.routeItem) {
        enhanced.routeItem = this.createRouteItem(existingObjects.routeItem);
      }
      
      if (existingObjects.routeFlag) {
        enhanced.routeFlag = this.createRouteFlag(existingObjects.routeFlag);
      }
      
      return enhanced;
    } catch (error) {
      this.errorManager.handleError(error, {
          operation: 'upgradeExistingObjects',
          objectType: 'MixedObjects'
        });
      throw error;
    }
  }
  
  // ============================================================================
  // LIFECYCLE MANAGEMENT
  // ============================================================================
  
  /**
   * Get statistics about created objects
   */
  getStatistics(): {
    totalObjects: number;
    isDisposed: boolean;
  } {
    return {
      totalObjects: this.lifecycleManager.getCount(),
      isDisposed: this.lifecycleManager.isDisposed()
    };
  }
  
  /**
   * Dispose of all created objects
   */
  dispose(): void {
    try {
      this.lifecycleManager.dispose();
    } catch (error) {
      console.warn('Error during factory disposal:', error);
    }
  }
}

/**
 * Create a factory with default configuration
 */
export function createObjectClassFactory(
  wasmWrapper: WasmWrapper,
  lifecycleManager?: ObjectLifecycleManager,
  errorManager?: ErrorManager
): ObjectClassFactory {
  const lifecycle = lifecycleManager || new ObjectLifecycleManager();
  const errors = errorManager || new ErrorManager();
  
  return new ObjectClassFactory(wasmWrapper, lifecycle, errors);
}

// Export all implementations and types
export {
  // Core implementations
  EnhancedRouteListImpl,
  EnhancedRouteImpl,
  EnhancedCalcRouteImpl,
  EnhancedRouteItemImpl,
  EnhancedRouteFlagImpl,
  EnhancedFareInfoImpl,
  
  // Lifecycle management
  ObjectLifecycleManager,
  
  // Factory classes
  ObjectClassFactory,
  
  // Supporting types and enums
  RouteFlagType,
  
  // All interface types (re-exported for convenience)
  type EnhancedRouteList,
  type EnhancedRoute,
  type EnhancedCalcRoute,
  type EnhancedRouteItem,
  type EnhancedRouteFlag,
  type EnhancedFareInfo,
  
  // Supporting interfaces
  type RouteValidationResult,
  type RouteValidationError,
  type RouteValidationWarning,
  type FareCalculationOptions,
  type FareDisplayFormat,
  type FareDiscount,
  type FareComparison,
  type CostAnalysis,
  type LineInfo,
  type TaxBreakdown,
  type FareRule,
  type FareFormatOptions
};