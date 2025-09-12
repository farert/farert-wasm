#!/usr/bin/env node

/**
 * Framework Integration Examples
 * 
 * This file demonstrates how to integrate WASM Object Classes with modern web frameworks:
 * - React integration with hooks and components
 * - Vue.js integration with Composition API
 * - Svelte integration with stores and reactive statements  
 * - TypeScript service patterns for framework-agnostic usage
 * - State management and caching strategies
 * - Error boundaries and loading states
 * 
 * Requirements: REQ-OBJ-008 - Framework-specific integration examples (React/Vue)
 * Focus: Modern frontend development patterns with Japanese railway fare calculation
 */

import { wasmLoader } from '../../cli/wasm_loader';
import { 
    FarertModule, 
    CalcRouteWrapper,
    FareInfoData
} from '../../cli/types';

/**
 * React Integration Examples
 * 
 * Demonstrates React patterns including hooks, components, and state management
 * for integrating with the WASM Object Classes.
 */
function demonstrateReactIntegration(): void {
    console.log('=== React Integration Patterns ===\n');
    
    // React Hook Example
    console.log('--- React Hook Implementation ---');
    console.log(`
// useFarertCalculator.ts - Custom React Hook
import { useState, useEffect, useCallback } from 'react';
import { wasmLoader } from '../../cli/wasm_loader';
import { FarertModule, CalcRouteWrapper, FareInfoData } from '../../cli/types';

interface FarertState {
  module: FarertModule | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface RouteCalculationState {
  fare: FareInfoData | null;
  loading: boolean;
  error: string | null;
}

export const useFarertCalculator = () => {
  const [state, setState] = useState<FarertState>({
    module: null,
    loading: true,
    error: null,
    initialized: false
  });

  const [calculation, setCalculation] = useState<RouteCalculationState>({
    fare: null,
    loading: false,
    error: null
  });

  // Initialize WebAssembly module
  useEffect(() => {
    let isMounted = true;

    const initializeModule = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const module = await wasmLoader.loadModule();
        await wasmLoader.initializeDatabase();
        
        if (isMounted) {
          setState({
            module,
            loading: false,
            error: null,
            initialized: true
          });
        }
      } catch (error) {
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to initialize',
            initialized: false
          }));
        }
      }
    };

    initializeModule();

    return () => {
      isMounted = false;
      // Cleanup WebAssembly resources
      if (state.module) {
        try {
          state.module.closeDatabase();
        } catch (error) {
          console.warn('Error closing database:', error);
        }
      }
    };
  }, []);

  // Calculate route fare
  const calculateFare = useCallback(async (routeString: string) => {
    if (!state.module || !state.initialized) {
      throw new Error('WASM module not initialized');
    }

    setCalculation({ fare: null, loading: true, error: null });

    try {
      const calcRoute = new state.module.cCalcRoute();
      calcRoute.setupRoute(routeString);
      
      const fareInfo = calcRoute.calcFare();
      
      setCalculation({
        fare: fareInfo,
        loading: false,
        error: null
      });

      return fareInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      setCalculation({
        fare: null,
        loading: false,
        error: errorMessage
      });
      throw error;
    }
  }, [state.module, state.initialized]);

  // Validate station name
  const validateStation = useCallback((stationName: string): boolean => {
    if (!state.module) return false;
    
    try {
      const stationId = state.module.getStationId(stationName);
      return stationId > 0;
    } catch (error) {
      return false;
    }
  }, [state.module]);

  return {
    // Module state
    module: state.module,
    loading: state.loading,
    error: state.error,
    initialized: state.initialized,
    
    // Calculation state
    calculation,
    
    // Methods
    calculateFare,
    validateStation
  };
};`);
    
    console.log('\n--- React Component Implementation ---');
    console.log(`
// FareCalculator.tsx - React Component
import React, { useState, useCallback } from 'react';
import { useFarertCalculator } from './useFarertCalculator';

interface RouteFormData {
  startStation: string;
  line: string;
  endStation: string;
}

export const FareCalculator: React.FC = () => {
  const { 
    loading: moduleLoading, 
    error: moduleError, 
    initialized,
    calculation,
    calculateFare,
    validateStation
  } = useFarertCalculator();

  const [formData, setFormData] = useState<RouteFormData>({
    startStation: '',
    line: '',
    endStation: ''
  });

  const [validationErrors, setValidationErrors] = useState<Partial<RouteFormData>>({});

  const handleInputChange = useCallback((field: keyof RouteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [validationErrors]);

  const validateForm = useCallback((): boolean => {
    const errors: Partial<RouteFormData> = {};
    
    if (!formData.startStation.trim()) {
      errors.startStation = '出発駅を入力してください';
    } else if (!validateStation(formData.startStation)) {
      errors.startStation = '存在しない駅名です';
    }
    
    if (!formData.endStation.trim()) {
      errors.endStation = '到着駅を入力してください';
    } else if (!validateStation(formData.endStation)) {
      errors.endStation = '存在しない駅名です';
    }
    
    if (!formData.line.trim()) {
      errors.line = '路線名を入力してください';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateStation]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const routeString = \`\${formData.startStation} \${formData.line} \${formData.endStation}\`;
    
    try {
      await calculateFare(routeString);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }, [formData, validateForm, calculateFare]);

  // Loading state
  if (moduleLoading) {
    return (
      <div className="fare-calculator loading">
        <div className="spinner" />
        <p>WebAssemblyモジュールを初期化中...</p>
      </div>
    );
  }

  // Error state
  if (moduleError) {
    return (
      <div className="fare-calculator error">
        <h3>エラーが発生しました</h3>
        <p>{moduleError}</p>
        <button onClick={() => window.location.reload()}>
          ページを再読み込み
        </button>
      </div>
    );
  }

  return (
    <div className="fare-calculator">
      <h2>運賃計算</h2>
      
      <form onSubmit={handleSubmit} className="route-form">
        <div className="form-group">
          <label htmlFor="startStation">出発駅</label>
          <input
            id="startStation"
            type="text"
            value={formData.startStation}
            onChange={(e) => handleInputChange('startStation', e.target.value)}
            placeholder="例: 東京"
            className={validationErrors.startStation ? 'error' : ''}
          />
          {validationErrors.startStation && (
            <span className="error-message">{validationErrors.startStation}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="line">路線名</label>
          <input
            id="line"
            type="text"
            value={formData.line}
            onChange={(e) => handleInputChange('line', e.target.value)}
            placeholder="例: 東海道線"
            className={validationErrors.line ? 'error' : ''}
          />
          {validationErrors.line && (
            <span className="error-message">{validationErrors.line}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="endStation">到着駅</label>
          <input
            id="endStation"
            type="text"
            value={formData.endStation}
            onChange={(e) => handleInputChange('endStation', e.target.value)}
            placeholder="例: 品川"
            className={validationErrors.endStation ? 'error' : ''}
          />
          {validationErrors.endStation && (
            <span className="error-message">{validationErrors.endStation}</span>
          )}
        </div>

        <button 
          type="submit" 
          disabled={calculation.loading || !initialized}
          className="calculate-button"
        >
          {calculation.loading ? '計算中...' : '運賃を計算'}
        </button>
      </form>

      {calculation.error && (
        <div className="calculation-error">
          <h3>計算エラー</h3>
          <p>{calculation.error}</p>
        </div>
      )}

      {calculation.fare && (
        <div className="calculation-result">
          <h3>計算結果</h3>
          <div className="fare-display">
            <span className="fare-amount">¥{calculation.fare.fare.toLocaleString()}</span>
          </div>
          
          {calculation.fare.availCountForFareOfStockDiscount > 0 && (
            <div className="discount-info">
              <p>割引オプション: {calculation.fare.availCountForFareOfStockDiscount}件</p>
            </div>
          )}
          
          {calculation.fare.isRule114Applied && (
            <div className="special-rule-info">
              <p>特別ルール114が適用されました</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};`);

    console.log('\n--- React Context Provider ---');
    console.log(`
// FarertProvider.tsx - Context Provider for App-wide WASM Access
import React, { createContext, useContext, useEffect, useState } from 'react';
import { wasmLoader } from '../../cli/wasm_loader';
import { FarertModule } from '../../cli/types';

interface FarertContextType {
  module: FarertModule | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const FarertContext = createContext<FarertContextType | undefined>(undefined);

export const FarertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FarertContextType>({
    module: null,
    loading: true,
    error: null,
    initialized: false
  });

  useEffect(() => {
    let isMounted = true;

    const initializeWasm = async () => {
      try {
        const module = await wasmLoader.loadModule();
        await wasmLoader.initializeDatabase();
        
        if (isMounted) {
          setState({
            module,
            loading: false,
            error: null,
            initialized: true
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            module: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Initialization failed',
            initialized: false
          });
        }
      }
    };

    initializeWasm();

    return () => {
      isMounted = false;
      if (state.module) {
        try {
          state.module.closeDatabase();
        } catch (error) {
          console.warn('Cleanup error:', error);
        }
      }
    };
  }, []);

  return (
    <FarertContext.Provider value={state}>
      {children}
    </FarertContext.Provider>
  );
};

export const useFarert = () => {
  const context = useContext(FarertContext);
  if (context === undefined) {
    throw new Error('useFarert must be used within a FarertProvider');
  }
  return context;
};`);
    
    console.log('\n');
}

/**
 * Vue.js Integration Examples
 * 
 * Demonstrates Vue 3 Composition API patterns for integrating
 * with the WASM Object Classes.
 */
function demonstrateVueIntegration(): void {
    console.log('=== Vue.js Integration Patterns ===\n');
    
    console.log('--- Vue Composable Implementation ---');
    console.log(`
// composables/useFarert.ts - Vue 3 Composable
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { wasmLoader } from '../../cli/wasm_loader';
import type { FarertModule, FareInfoData } from '../../cli/types';

interface FarertState {
  module: FarertModule | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface CalculationState {
  fare: FareInfoData | null;
  loading: boolean;
  error: string | null;
}

export const useFarert = () => {
  // Reactive state
  const state = ref<FarertState>({
    module: null,
    loading: true,
    error: null,
    initialized: false
  });

  const calculation = ref<CalculationState>({
    fare: null,
    loading: false,
    error: null
  });

  // Computed properties
  const isReady = computed(() => 
    state.value.initialized && !state.value.loading && !state.value.error
  );

  const hasCalculation = computed(() => 
    calculation.value.fare !== null && !calculation.value.error
  );

  // Methods
  const calculateFare = async (routeString: string) => {
    if (!state.value.module || !state.value.initialized) {
      throw new Error('WASM module not initialized');
    }

    calculation.value = { fare: null, loading: true, error: null };

    try {
      const calcRoute = new state.value.module.cCalcRoute();
      calcRoute.setupRoute(routeString);
      
      const fareInfo = calcRoute.calcFare();
      
      calculation.value = {
        fare: fareInfo,
        loading: false,
        error: null
      };

      return fareInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      calculation.value = {
        fare: null,
        loading: false,
        error: errorMessage
      };
      throw error;
    }
  };

  const validateStation = (stationName: string): boolean => {
    if (!state.value.module) return false;
    
    try {
      const stationId = state.value.module.getStationId(stationName);
      return stationId > 0;
    } catch (error) {
      return false;
    }
  };

  const getStationSuggestions = (partial: string): string[] => {
    if (!state.value.module || partial.length < 1) return [];
    
    const commonStations = [
      '東京', '新宿', '渋谷', '池袋', '品川', '上野', '大阪', '京都', '名古屋',
      '横浜', '神戸', '福岡', '仙台', '札幌', '広島'
    ];
    
    return commonStations.filter(station => 
      station.includes(partial) || partial.includes(station)
    ).slice(0, 5);
  };

  // Lifecycle
  onMounted(async () => {
    try {
      state.value.loading = true;
      
      const module = await wasmLoader.loadModule();
      await wasmLoader.initializeDatabase();
      
      state.value = {
        module,
        loading: false,
        error: null,
        initialized: true
      };
    } catch (error) {
      state.value = {
        module: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
        initialized: false
      };
    }
  });

  onUnmounted(() => {
    if (state.value.module) {
      try {
        state.value.module.closeDatabase();
      } catch (error) {
        console.warn('Error closing database:', error);
      }
    }
  });

  return {
    // State
    state: readonly(state),
    calculation: readonly(calculation),
    
    // Computed
    isReady,
    hasCalculation,
    
    // Methods
    calculateFare,
    validateStation,
    getStationSuggestions
  };
};`);

    console.log('\n--- Vue Component Implementation ---');
    console.log(`
<!-- FareCalculator.vue - Vue 3 Component -->
<template>
  <div class="fare-calculator">
    <!-- Loading State -->
    <div v-if="state.loading" class="loading-state">
      <div class="spinner"></div>
      <p>WebAssemblyモジュールを初期化中...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="state.error" class="error-state">
      <h3>エラーが発生しました</h3>
      <p>{{ state.error }}</p>
      <button @click="$router.go(0)">ページを再読み込み</button>
    </div>

    <!-- Main Interface -->
    <div v-else-if="isReady" class="calculator-interface">
      <h2>運賃計算</h2>
      
      <form @submit.prevent="handleSubmit" class="route-form">
        <div class="form-group">
          <label for="startStation">出発駅</label>
          <input
            id="startStation"
            v-model="formData.startStation"
            type="text"
            placeholder="例: 東京"
            :class="{ error: validationErrors.startStation }"
            @input="clearError('startStation')"
            @focus="showSuggestions('start')"
          />
          <div v-if="validationErrors.startStation" class="error-message">
            {{ validationErrors.startStation }}
          </div>
          
          <!-- Station Suggestions -->
          <div v-if="suggestions.start.length > 0 && showStartSuggestions" class="suggestions">
            <div
              v-for="suggestion in suggestions.start"
              :key="suggestion"
              class="suggestion-item"
              @click="selectSuggestion('startStation', suggestion)"
            >
              {{ suggestion }}
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="line">路線名</label>
          <input
            id="line"
            v-model="formData.line"
            type="text"
            placeholder="例: 東海道線"
            :class="{ error: validationErrors.line }"
            @input="clearError('line')"
          />
          <div v-if="validationErrors.line" class="error-message">
            {{ validationErrors.line }}
          </div>
        </div>

        <div class="form-group">
          <label for="endStation">到着駅</label>
          <input
            id="endStation"
            v-model="formData.endStation"
            type="text"
            placeholder="例: 品川"
            :class="{ error: validationErrors.endStation }"
            @input="clearError('endStation')"
            @focus="showSuggestions('end')"
          />
          <div v-if="validationErrors.endStation" class="error-message">
            {{ validationErrors.endStation }}
          </div>
          
          <!-- Station Suggestions -->
          <div v-if="suggestions.end.length > 0 && showEndSuggestions" class="suggestions">
            <div
              v-for="suggestion in suggestions.end"
              :key="suggestion"
              class="suggestion-item"
              @click="selectSuggestion('endStation', suggestion)"
            >
              {{ suggestion }}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          :disabled="calculation.loading"
          class="calculate-button"
        >
          {{ calculation.loading ? '計算中...' : '運賃を計算' }}
        </button>
      </form>

      <!-- Calculation Error -->
      <div v-if="calculation.error" class="calculation-error">
        <h3>計算エラー</h3>
        <p>{{ calculation.error }}</p>
      </div>

      <!-- Calculation Result -->
      <div v-if="hasCalculation" class="calculation-result">
        <h3>計算結果</h3>
        <div class="fare-display">
          <span class="fare-amount">¥{{ calculation.fare.fare.toLocaleString() }}</span>
        </div>
        
        <div v-if="calculation.fare.availCountForFareOfStockDiscount > 0" class="discount-info">
          <p>割引オプション: {{ calculation.fare.availCountForFareOfStockDiscount }}件</p>
        </div>
        
        <div v-if="calculation.fare.isRule114Applied" class="special-rule-info">
          <p>特別ルール114が適用されました</p>
        </div>

        <!-- Route Details -->
        <div class="route-details">
          <h4>ルート詳細</h4>
          <p>{{ formattedRoute }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useFarert } from '../composables/useFarert';

// Composable
const { 
  state, 
  calculation, 
  isReady, 
  hasCalculation, 
  calculateFare, 
  validateStation, 
  getStationSuggestions 
} = useFarert();

// Form state
const formData = ref({
  startStation: '',
  line: '',
  endStation: ''
});

const validationErrors = ref<Record<string, string>>({});

// Suggestions state
const suggestions = ref({
  start: [] as string[],
  end: [] as string[]
});

const showStartSuggestions = ref(false);
const showEndSuggestions = ref(false);

// Computed
const formattedRoute = computed(() => {
  if (!hasCalculation.value) return '';
  return \`\${formData.value.startStation} → \${formData.value.endStation} (\${formData.value.line})\`;
});

// Methods
const clearError = (field: string) => {
  if (validationErrors.value[field]) {
    delete validationErrors.value[field];
  }
};

const showSuggestions = (type: 'start' | 'end') => {
  const field = type === 'start' ? 'startStation' : 'endStation';
  const value = formData.value[field];
  
  if (value.length > 0) {
    suggestions.value[type] = getStationSuggestions(value);
  }
  
  if (type === 'start') {
    showStartSuggestions.value = true;
    showEndSuggestions.value = false;
  } else {
    showEndSuggestions.value = true;
    showStartSuggestions.value = false;
  }
};

const selectSuggestion = (field: keyof typeof formData.value, value: string) => {
  formData.value[field] = value;
  suggestions.value.start = [];
  suggestions.value.end = [];
  showStartSuggestions.value = false;
  showEndSuggestions.value = false;
};

const validateForm = (): boolean => {
  const errors: Record<string, string> = {};
  
  if (!formData.value.startStation.trim()) {
    errors.startStation = '出発駅を入力してください';
  } else if (!validateStation(formData.value.startStation)) {
    errors.startStation = '存在しない駅名です';
  }
  
  if (!formData.value.endStation.trim()) {
    errors.endStation = '到着駅を入力してください';
  } else if (!validateStation(formData.value.endStation)) {
    errors.endStation = '存在しない駅名です';
  }
  
  if (!formData.value.line.trim()) {
    errors.line = '路線名を入力してください';
  }
  
  validationErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  const routeString = \`\${formData.value.startStation} \${formData.value.line} \${formData.value.endStation}\`;
  
  try {
    await calculateFare(routeString);
  } catch (error) {
    console.error('Calculation error:', error);
  }
};

// Watch for input changes to update suggestions
watch(
  () => formData.value.startStation,
  (newValue) => {
    if (newValue.length > 0 && showStartSuggestions.value) {
      suggestions.value.start = getStationSuggestions(newValue);
    }
  }
);

watch(
  () => formData.value.endStation,
  (newValue) => {
    if (newValue.length > 0 && showEndSuggestions.value) {
      suggestions.value.end = getStationSuggestions(newValue);
    }
  }
);
</script>

<style scoped>
.fare-calculator {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.form-group input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 14px;
  margin-top: 5px;
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 10;
}

.suggestion-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.suggestion-item:hover {
  background-color: #f8f9fa;
}

.calculate-button {
  width: 100%;
  padding: 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.calculate-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.calculate-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.calculation-result {
  margin-top: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.fare-display {
  text-align: center;
  margin: 20px 0;
}

.fare-amount {
  font-size: 2.5em;
  font-weight: bold;
  color: #2c3e50;
}

.discount-info, .special-rule-info {
  background-color: #e8f5e8;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.route-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}
</style>`);
    
    console.log('\n');
}

/**
 * Svelte Integration Examples
 * 
 * Demonstrates Svelte patterns including stores and reactive statements
 * for integrating with the WASM Object Classes.
 */
function demonstrateSvelteIntegration(): void {
    console.log('=== Svelte Integration Patterns ===\n');
    
    console.log('--- Svelte Store Implementation ---');
    console.log(`
// stores/farert.ts - Svelte Store
import { writable, derived, get } from 'svelte/store';
import { wasmLoader } from '../../cli/wasm_loader';
import type { FarertModule, FareInfoData } from '../../cli/types';

interface FarertState {
  module: FarertModule | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

interface CalculationState {
  fare: FareInfoData | null;
  loading: boolean;
  error: string | null;
}

// Create stores
export const farertState = writable<FarertState>({
  module: null,
  loading: true,
  error: null,
  initialized: false
});

export const calculationState = writable<CalculationState>({
  fare: null,
  loading: false,
  error: null
});

// Derived stores
export const isReady = derived(
  farertState,
  ($farertState) => $farertState.initialized && !$farertState.loading && !$farertState.error
);

export const hasCalculation = derived(
  calculationState,
  ($calculationState) => $calculationState.fare !== null && !$calculationState.error
);

// Store actions
export const farertActions = {
  async initialize() {
    farertState.update(state => ({ ...state, loading: true, error: null }));

    try {
      const module = await wasmLoader.loadModule();
      await wasmLoader.initializeDatabase();

      farertState.set({
        module,
        loading: false,
        error: null,
        initialized: true
      });
    } catch (error) {
      farertState.update(state => ({
        ...state,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize',
        initialized: false
      }));
    }
  },

  async calculateFare(routeString: string) {
    const state = get(farertState);
    
    if (!state.module || !state.initialized) {
      throw new Error('WASM module not initialized');
    }

    calculationState.set({ fare: null, loading: true, error: null });

    try {
      const calcRoute = new state.module.cCalcRoute();
      calcRoute.setupRoute(routeString);
      
      const fareInfo = calcRoute.calcFare();
      
      calculationState.set({
        fare: fareInfo,
        loading: false,
        error: null
      });

      return fareInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
      calculationState.set({
        fare: null,
        loading: false,
        error: errorMessage
      });
      throw error;
    }
  },

  validateStation(stationName: string): boolean {
    const state = get(farertState);
    if (!state.module) return false;
    
    try {
      const stationId = state.module.getStationId(stationName);
      return stationId > 0;
    } catch (error) {
      return false;
    }
  },

  cleanup() {
    const state = get(farertState);
    if (state.module) {
      try {
        state.module.closeDatabase();
      } catch (error) {
        console.warn('Error closing database:', error);
      }
    }
  }
};`);

    console.log('\n--- Svelte Component Implementation ---');
    console.log(`
<!-- FareCalculator.svelte - Svelte Component -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { farertState, calculationState, isReady, hasCalculation, farertActions } from '../stores/farert';
  
  // Form state
  let formData = {
    startStation: '',
    line: '',
    endStation: ''
  };
  
  let validationErrors: Record<string, string> = {};
  let suggestions = { start: [], end: [] };
  let showStartSuggestions = false;
  let showEndSuggestions = false;
  
  // Reactive statements
  $: formattedRoute = $hasCalculation 
    ? \`\${formData.startStation} → \${formData.endStation} (\${formData.line})\`
    : '';
  
  $: if (formData.startStation && showStartSuggestions) {
    suggestions.start = getStationSuggestions(formData.startStation);
  }
  
  $: if (formData.endStation && showEndSuggestions) {
    suggestions.end = getStationSuggestions(formData.endStation);
  }
  
  // Methods
  function clearError(field: string) {
    if (validationErrors[field]) {
      delete validationErrors[field];
      validationErrors = validationErrors; // Trigger reactivity
    }
  }
  
  function showSuggestions(type: 'start' | 'end') {
    const field = type === 'start' ? 'startStation' : 'endStation';
    const value = formData[field];
    
    if (value.length > 0) {
      suggestions[type] = getStationSuggestions(value);
    }
    
    showStartSuggestions = type === 'start';
    showEndSuggestions = type === 'end';
  }
  
  function selectSuggestion(field: string, value: string) {
    formData[field] = value;
    suggestions.start = [];
    suggestions.end = [];
    showStartSuggestions = false;
    showEndSuggestions = false;
  }
  
  function getStationSuggestions(partial: string): string[] {
    const commonStations = [
      '東京', '新宿', '渋谷', '池袋', '品川', '上野', '大阪', '京都', '名古屋',
      '横浜', '神戸', '福岡', '仙台', '札幌', '広島'
    ];
    
    return commonStations.filter(station => 
      station.includes(partial) || partial.includes(station)
    ).slice(0, 5);
  }
  
  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    if (!formData.startStation.trim()) {
      errors.startStation = '出発駅を入力してください';
    } else if (!farertActions.validateStation(formData.startStation)) {
      errors.startStation = '存在しない駅名です';
    }
    
    if (!formData.endStation.trim()) {
      errors.endStation = '到着駅を入力してください';
    } else if (!farertActions.validateStation(formData.endStation)) {
      errors.endStation = '存在しない駅名です';
    }
    
    if (!formData.line.trim()) {
      errors.line = '路線名を入力してください';
    }
    
    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }
  
  async function handleSubmit() {
    if (!validateForm()) return;
    
    const routeString = \`\${formData.startStation} \${formData.line} \${formData.endStation}\`;
    
    try {
      await farertActions.calculateFare(routeString);
    } catch (error) {
      console.error('Calculation error:', error);
    }
  }
  
  // Lifecycle
  onMount(() => {
    farertActions.initialize();
  });
  
  onDestroy(() => {
    farertActions.cleanup();
  });
</script>

<div class="fare-calculator">
  {#if $farertState.loading}
    <div class="loading-state">
      <div class="spinner"></div>
      <p>WebAssemblyモジュールを初期化中...</p>
    </div>
  {:else if $farertState.error}
    <div class="error-state">
      <h3>エラーが発生しました</h3>
      <p>{$farertState.error}</p>
      <button on:click={() => location.reload()}>ページを再読み込み</button>
    </div>
  {:else if $isReady}
    <div class="calculator-interface">
      <h2>運賃計算</h2>
      
      <form on:submit|preventDefault={handleSubmit} class="route-form">
        <div class="form-group">
          <label for="startStation">出発駅</label>
          <input
            id="startStation"
            bind:value={formData.startStation}
            type="text"
            placeholder="例: 東京"
            class:error={validationErrors.startStation}
            on:input={() => clearError('startStation')}
            on:focus={() => showSuggestions('start')}
          />
          {#if validationErrors.startStation}
            <div class="error-message">{validationErrors.startStation}</div>
          {/if}
          
          {#if suggestions.start.length > 0 && showStartSuggestions}
            <div class="suggestions">
              {#each suggestions.start as suggestion}
                <div 
                  class="suggestion-item"
                  on:click={() => selectSuggestion('startStation', suggestion)}
                  on:keydown
                  role="button"
                  tabindex="0"
                >
                  {suggestion}
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <div class="form-group">
          <label for="line">路線名</label>
          <input
            id="line"
            bind:value={formData.line}
            type="text"
            placeholder="例: 東海道線"
            class:error={validationErrors.line}
            on:input={() => clearError('line')}
          />
          {#if validationErrors.line}
            <div class="error-message">{validationErrors.line}</div>
          {/if}
        </div>

        <div class="form-group">
          <label for="endStation">到着駅</label>
          <input
            id="endStation"
            bind:value={formData.endStation}
            type="text"
            placeholder="例: 品川"
            class:error={validationErrors.endStation}
            on:input={() => clearError('endStation')}
            on:focus={() => showSuggestions('end')}
          />
          {#if validationErrors.endStation}
            <div class="error-message">{validationErrors.endStation}</div>
          {/if}
          
          {#if suggestions.end.length > 0 && showEndSuggestions}
            <div class="suggestions">
              {#each suggestions.end as suggestion}
                <div 
                  class="suggestion-item"
                  on:click={() => selectSuggestion('endStation', suggestion)}
                  on:keydown
                  role="button"
                  tabindex="0"
                >
                  {suggestion}
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <button 
          type="submit" 
          disabled={$calculationState.loading}
          class="calculate-button"
        >
          {$calculationState.loading ? '計算中...' : '運賃を計算'}
        </button>
      </form>

      {#if $calculationState.error}
        <div class="calculation-error">
          <h3>計算エラー</h3>
          <p>{$calculationState.error}</p>
        </div>
      {/if}

      {#if $hasCalculation}
        <div class="calculation-result">
          <h3>計算結果</h3>
          <div class="fare-display">
            <span class="fare-amount">¥{$calculationState.fare.fare.toLocaleString()}</span>
          </div>
          
          {#if $calculationState.fare.availCountForFareOfStockDiscount > 0}
            <div class="discount-info">
              <p>割引オプション: {$calculationState.fare.availCountForFareOfStockDiscount}件</p>
            </div>
          {/if}
          
          {#if $calculationState.fare.isRule114Applied}
            <div class="special-rule-info">
              <p>特別ルール114が適用されました</p>
            </div>
          {/if}

          <div class="route-details">
            <h4>ルート詳細</h4>
            <p>{formattedRoute}</p>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .fare-calculator {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  .loading-state, .error-state {
    text-align: center;
    padding: 40px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .form-group {
    margin-bottom: 20px;
    position: relative;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }

  .form-group input.error {
    border-color: #e74c3c;
  }

  .error-message {
    color: #e74c3c;
    font-size: 14px;
    margin-top: 5px;
  }

  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #ddd;
    border-top: none;
    border-radius: 0 0 4px 4px;
    z-index: 10;
  }

  .suggestion-item {
    padding: 10px;
    cursor: pointer;
    border-bottom: 1px solid #eee;
  }

  .suggestion-item:hover {
    background-color: #f8f9fa;
  }

  .calculate-button {
    width: 100%;
    padding: 12px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
  }

  .calculate-button:hover:not(:disabled) {
    background-color: #2980b9;
  }

  .calculate-button:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  .calculation-result {
    margin-top: 30px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
  }

  .fare-display {
    text-align: center;
    margin: 20px 0;
  }

  .fare-amount {
    font-size: 2.5em;
    font-weight: bold;
    color: #2c3e50;
  }

  .discount-info, .special-rule-info {
    background-color: #e8f5e8;
    padding: 10px;
    border-radius: 4px;
    margin: 10px 0;
  }

  .route-details {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ddd;
  }
</style>`);
    
    console.log('\n');
}

/**
 * TypeScript Service Pattern Examples
 * 
 * Demonstrates framework-agnostic service patterns for managing
 * WASM Object Classes in any TypeScript application.
 */
function demonstrateTypeScriptServicePattern(): void {
    console.log('=== TypeScript Service Pattern ===\n');
    
    console.log('--- Framework-Agnostic Service Implementation ---');
    console.log(`
// services/FarertService.ts - Framework-agnostic service
import { wasmLoader } from '../../cli/wasm_loader';
import type { FarertModule, CalcRouteWrapper, FareInfoData, RouteItemWrapper } from '../../cli/types';

export interface RouteCalculationRequest {
  startStation: string;
  line: string;
  endStation: string;
  options?: {
    enableLongRoute?: boolean;
    enableSpecialRules?: boolean;
    startAsCity?: boolean;
    arriveAsCity?: boolean;
  };
}

export interface RouteCalculationResult {
  success: boolean;
  fare: FareInfoData | null;
  error: string | null;
  routeDetails: {
    segments: RouteSegmentInfo[];
    totalDistance: number;
    estimatedTime: number;
  } | null;
}

export interface RouteSegmentInfo {
  stationName: string;
  lineName: string;
  fare: number;
  distance: number;
}

export interface StationValidationResult {
  isValid: boolean;
  suggestions: string[];
  error?: string;
}

class FarertService {
  private module: FarertModule | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Initialize the WebAssembly module
   * Safe to call multiple times - will return the same promise
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      this.module = await wasmLoader.loadModule();
      await wasmLoader.initializeDatabase();
      this.initialized = true;
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Calculate fare for a route
   */
  async calculateRoute(request: RouteCalculationRequest): Promise<RouteCalculationResult> {
    await this.initialize();

    if (!this.module) {
      return {
        success: false,
        fare: null,
        error: 'WebAssembly module not initialized',
        routeDetails: null
      };
    }

    try {
      const calcRoute = new this.module.cCalcRoute();
      
      // Configure route options
      if (request.options?.enableLongRoute) {
        calcRoute.setLongRoute(true);
      }
      
      if (request.options?.startAsCity) {
        calcRoute.setStartAsCity();
      }
      
      if (request.options?.arriveAsCity) {
        calcRoute.setArriveAsCity();
      }

      // Setup route
      const routeString = \`\${request.startStation} \${request.line} \${request.endStation}\`;
      calcRoute.setupRoute(routeString);

      // Calculate fare
      const fareInfo = calcRoute.calcFare();

      // Get detailed route information
      const routeDetails = this._extractRouteDetails(calcRoute);

      return {
        success: true,
        fare: fareInfo,
        error: null,
        routeDetails
      };

    } catch (error) {
      return {
        success: false,
        fare: null,
        error: error instanceof Error ? error.message : 'Calculation failed',
        routeDetails: null
      };
    }
  }

  /**
   * Validate station name and provide suggestions
   */
  async validateStation(stationName: string): Promise<StationValidationResult> {
    await this.initialize();

    if (!this.module) {
      return {
        isValid: false,
        suggestions: [],
        error: 'Service not initialized'
      };
    }

    try {
      const stationId = this.module.getStationId(stationName);
      
      if (stationId > 0) {
        return {
          isValid: true,
          suggestions: []
        };
      } else {
        return {
          isValid: false,
          suggestions: this._getStationSuggestions(stationName)
        };
      }
    } catch (error) {
      return {
        isValid: false,
        suggestions: this._getStationSuggestions(stationName),
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Get all JR companies
   */
  async getJRCompanies(): Promise<{ id: number; name: string }[]> {
    await this.initialize();

    if (!this.module || !this.module.getJRCompanyIds) {
      return [];
    }

    try {
      const companyIds = this.module.getJRCompanyIds();
      return companyIds.map(id => ({
        id,
        name: this.module!.getCompanyOrPrefectureName?.(id) || \`Company \${id}\`
      }));
    } catch (error) {
      console.error('Failed to get JR companies:', error);
      return [];
    }
  }

  /**
   * Search stations by partial name
   */
  async searchStations(partial: string, limit: number = 10): Promise<string[]> {
    await this.initialize();

    if (!partial || partial.length < 1) {
      return [];
    }

    return this._getStationSuggestions(partial).slice(0, limit);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.module) {
      try {
        this.module.closeDatabase();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    }
    
    this.module = null;
    this.initialized = false;
    this.initializationPromise = null;
  }

  /**
   * Check if service is ready
   */
  get isReady(): boolean {
    return this.initialized && this.module !== null;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      hasModule: this.module !== null,
      isReady: this.isReady
    };
  }

  // Private helper methods
  private _extractRouteDetails(calcRoute: CalcRouteWrapper) {
    const segments: RouteSegmentInfo[] = [];
    let totalDistance = 0;
    let estimatedTime = 0;

    try {
      const routeCount = calcRoute.getRouteCount();
      
      for (let i = 0; i < routeCount; i++) {
        try {
          const routeItem = calcRoute.getRouteItem(i);
          
          if (routeItem && routeItem.isValid() && this.module) {
            const stationName = this.module.getStationName(routeItem.stationId);
            const lineName = this.module.getLineName(routeItem.lineId);
            
            segments.push({
              stationName,
              lineName,
              fare: routeItem.fare,
              distance: routeItem.salesKm
            });
            
            totalDistance += routeItem.salesKm;
            estimatedTime += routeItem.salesKm * 1.5; // Rough time estimate
          }
        } catch (error) {
          // Skip invalid segments
          continue;
        }
      }
    } catch (error) {
      console.warn('Failed to extract route details:', error);
    }

    return {
      segments,
      totalDistance,
      estimatedTime: Math.round(estimatedTime)
    };
  }

  private _getStationSuggestions(partial: string): string[] {
    const commonStations = [
      '東京', '新宿', '渋谷', '池袋', '品川', '上野', '大阪', '京都', '名古屋',
      '横浜', '神戸', '福岡', '仙台', '札幌', '広島', '静岡', '浜松', '岡山',
      '金沢', '新潟', '長野', '松本', '甲府', '宇都宮', '水戸', '千葉'
    ];

    return commonStations.filter(station => 
      station.includes(partial) || 
      partial.includes(station) ||
      this._calculateSimilarity(partial, station) > 0.3
    );
  }

  private _calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const chars1 = Array.from(str1.toLowerCase());
    const chars2 = Array.from(str2.toLowerCase());
    
    let matches = 0;
    const longer = chars1.length > chars2.length ? chars1 : chars2;
    const shorter = chars1.length > chars2.length ? chars2 : chars1;
    
    for (const char of shorter) {
      const index = longer.indexOf(char);
      if (index >= 0) {
        matches++;
        longer.splice(index, 1);
      }
    }
    
    return (matches * 2) / (chars1.length + chars2.length);
  }
}

// Export singleton instance
export const farertService = new FarertService();

// Export class for custom instances
export { FarertService };`);

    console.log('\n--- Service Usage Examples ---');
    console.log(`
// Usage in any TypeScript framework or vanilla application

// Example 1: Simple fare calculation
import { farertService } from './services/FarertService';

async function calculateSimpleFare() {
  try {
    const result = await farertService.calculateRoute({
      startStation: '東京',
      line: '東海道線',
      endStation: '品川'
    });

    if (result.success && result.fare) {
      console.log(\`Fare: ¥\${result.fare.fare}\`);
      console.log(\`Discount options: \${result.fare.availCountForFareOfStockDiscount}\`);
      
      if (result.routeDetails) {
        console.log(\`Total distance: \${result.routeDetails.totalDistance} km\`);
        console.log(\`Estimated time: \${result.routeDetails.estimatedTime} minutes\`);
      }
    } else {
      console.error('Calculation failed:', result.error);
    }
  } catch (error) {
    console.error('Service error:', error);
  }
}

// Example 2: Station validation with suggestions
async function validateAndSuggest() {
  const result = await farertService.validateStation('東京駅');
  
  if (!result.isValid) {
    console.log('Invalid station name');
    console.log('Suggestions:', result.suggestions);
  }
}

// Example 3: Search functionality
async function searchStations(query: string) {
  const stations = await farertService.searchStations(query, 5);
  return stations;
}

// Example 4: Advanced route calculation with options
async function calculateAdvancedRoute() {
  const result = await farertService.calculateRoute({
    startStation: '東京',
    line: '東海道新幹線',
    endStation: '大阪',
    options: {
      enableLongRoute: true,
      enableSpecialRules: true,
      startAsCity: true,
      arriveAsCity: true
    }
  });

  return result;
}

// Example 5: Service cleanup (important for memory management)
window.addEventListener('beforeunload', () => {
  farertService.dispose();
});`);
    
    console.log('\n');
}

/**
 * Main demonstration function
 * Runs all framework integration examples
 */
async function runFrameworkIntegrationExamples(): Promise<void> {
    console.log('🚀 WASM Object Classes - Framework Integration Examples\n');
    console.log('Comprehensive integration patterns for modern web frameworks\n');
    
    // Note: These are code examples, not executable demonstrations
    // since they require specific framework environments
    
    demonstrateReactIntegration();
    demonstrateVueIntegration();
    demonstrateSvelteIntegration();
    demonstrateTypeScriptServicePattern();
    
    console.log('🎉 All framework integration examples completed!');
    console.log('\n🏗️  Framework Integration Summary:');
    console.log('   • React: Custom hooks, context providers, and component patterns');
    console.log('   • Vue 3: Composition API, reactive stores, and component integration');
    console.log('   • Svelte: Reactive stores, component binding, and lifecycle management');
    console.log('   • TypeScript: Framework-agnostic service patterns with full type safety');
    console.log('\n📚 Key Integration Principles:');
    console.log('   • Initialize WebAssembly module once per application lifecycle');
    console.log('   • Use framework-specific state management for reactive updates');
    console.log('   • Implement proper error boundaries and loading states');
    console.log('   • Validate user input before WASM function calls');
    console.log('   • Clean up resources on component unmount/app shutdown');
    console.log('\n🔧 Production Considerations:');
    console.log('   • Implement caching for frequently calculated routes');
    console.log('   • Use service workers for offline functionality');
    console.log('   • Consider code splitting for WASM module lazy loading');
    console.log('   • Monitor memory usage in long-running applications');
    console.log('   • Implement proper error reporting and analytics');
    console.log('\n📚 Next steps:');
    console.log('   • Copy relevant patterns to your framework of choice');
    console.log('   • Customize components and styling for your application design');
    console.log('   • Test integration with your specific build toolchain');
    console.log('   • Implement production monitoring and error handling');
}

// Execute demonstrations if run directly
if (require.main === module) {
    runFrameworkIntegrationExamples().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

// Export for use in other examples
export {
    demonstrateReactIntegration,
    demonstrateVueIntegration,
    demonstrateSvelteIntegration,
    demonstrateTypeScriptServicePattern,
    runFrameworkIntegrationExamples
};