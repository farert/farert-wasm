/**
 * Farert SDK Minimal Entry Point
 * 
 * Minimal, working build that includes only essential, working components
 * without problematic imports or duplicate exports.
 */

// Essential types
export interface FarertSDKConfig {
  wasmPath?: string;
  enableLogging?: boolean;
  enableCaching?: boolean;
}

export interface StationInfo {
  id: number;
  name: string;
  kana?: string;
  prefecture?: string;
}

export interface RouteInfo {
  stations: StationInfo[];
  lines: number[];
  distance: number;
  fare: number;
}

// Core SDK class (minimal implementation)
export class FarertSDK {
  private config: FarertSDKConfig;
  private initialized = false;

  constructor(config: FarertSDKConfig = {}) {
    this.config = config;
  }

  async initialize(): Promise<boolean> {
    try {
      // Placeholder initialization
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('SDK initialization failed:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async getStationInfo(stationId: number): Promise<StationInfo | null> {
    if (!this.initialized) {
      throw new Error('SDK not initialized');
    }
    
    // Placeholder implementation
    return {
      id: stationId,
      name: `Station ${stationId}`,
      kana: `ステーション${stationId}`,
    };
  }

  async calculateRoute(fromStation: number, toStation: number): Promise<RouteInfo | null> {
    if (!this.initialized) {
      throw new Error('SDK not initialized');
    }
    
    // Placeholder implementation
    return {
      stations: [
        { id: fromStation, name: `Station ${fromStation}` },
        { id: toStation, name: `Station ${toStation}` }
      ],
      lines: [1],
      distance: 10,
      fare: 200
    };
  }
}

// Factory function
export function createFarertSDK(config?: FarertSDKConfig): FarertSDK {
  return new FarertSDK(config);
}

// Utility functions
export function formatFare(fare: number): string {
  return `¥${fare.toLocaleString()}`;
}

export function formatDistance(distance: number): string {
  return `${distance.toFixed(1)}km`;
}

// Build information
export const SDK_VERSION = '1.0.0';
export const BUILD_TARGET = 'minimal';
export const BUILD_DATE = new Date().toISOString();

// Default export
export default FarertSDK;