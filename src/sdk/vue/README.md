# Vue Compatibility Layer for Farert SDK

Vue 3 compatibility layer providing composables and plugin integration for the Farert WebAssembly Railway Calculation SDK.

## Features

- **Vue 3 Composition API Integration**: Native Vue composables with reactive state management
- **Plugin System**: Global SDK instance registration with dependency injection
- **TypeScript-First**: Complete type safety with Vue 3+ type definitions
- **Performance Optimized**: Proper debouncing, caching, and request cancellation
- **Automatic Cleanup**: Lifecycle management with `onUnmounted` hooks
- **Secondary Support**: Clean wrapping of existing Svelte-first core SDK

## Installation & Setup

### 1. Plugin Registration

```ts
// main.ts
import { createApp } from 'vue';
import { FarertSDKPlugin } from '@farert/sdk/vue';
import App from './App.vue';

const app = createApp(App);

// Basic setup
app.use(FarertSDKPlugin, {
  autoInitialize: true,
  development: true
});

app.mount('#app');
```

### 2. Custom Configuration

```ts
// Advanced plugin configuration
app.use(FarertSDKPlugin, {
  config: {
    caching: { 
      enabled: true, 
      maxSize: 2000, 
      ttl: 600000 // 10 minutes
    },
    performance: { 
      enabled: true, 
      trackingLevel: 'detailed' 
    },
    errorHandling: {
      retryAttempts: 3,
      retryDelay: 1500,
      enableFuzzyMatching: true
    }
  },
  production: true,
  globalPropertyName: '$railway',
  onInitialized: (sdk) => {
    console.log('Railway SDK initialized successfully');
  },
  onError: (error) => {
    console.error('SDK initialization failed:', error);
  }
});
```

## Core Composables

### useFarertSDK()

Main composable for accessing the SDK instance and state.

```vue
<script setup>
import { useFarertSDK } from '@farert/sdk/vue';

const { sdk, isReady, error, isLoading, reinitialize } = useFarertSDK();
</script>

<template>
  <div v-if="isLoading">Loading railway system...</div>
  <div v-else-if="error" class="error">
    Error: {{ error.message }}
    <button @click="reinitialize">Retry</button>
  </div>
  <div v-else-if="isReady">
    Railway system ready!
  </div>
</template>
```

### useStationSearch()

Reactive station search with debouncing and caching.

```vue
<script setup>
import { ref } from 'vue';
import { useStationSearch } from '@farert/sdk/vue';

const searchQuery = ref('');

const { 
  results, 
  isLoading, 
  error,
  hasMore,
  totalCount,
  loadMore,
  clearResults
} = useStationSearch(searchQuery, {
  debounceMs: 300,
  limit: 10,
  autoSearch: true,
  includeKana: true,
  fuzzyThreshold: 0.7
});
</script>

<template>
  <div>
    <input 
      v-model="searchQuery" 
      placeholder="駅名を入力..."
      class="station-search"
    />
    
    <div v-if="isLoading">検索中...</div>
    <div v-if="error" class="error">{{ error.message }}</div>
    
    <div v-if="results.length > 0" class="results">
      <div class="count">{{ totalCount }}件中{{ results.length }}件表示</div>
      
      <ul class="station-list">
        <li 
          v-for="result in results" 
          :key="result.station.id"
          class="station-item"
          @click="selectStation(result.station)"
        >
          <span class="name">{{ result.station.name }}</span>
          <span class="prefecture">({{ result.station.prefecture }})</span>
          <span class="score">{{ (result.score * 100).toFixed(0) }}%</span>
        </li>
      </ul>
      
      <button v-if="hasMore" @click="loadMore" :disabled="isLoading">
        さらに読み込む
      </button>
    </div>
  </div>
</template>
```

### useFareCalculation()

Route fare calculation with validation and history.

```vue
<script setup>
import { ref, watch } from 'vue';
import { useFareCalculation, formatFare } from '@farert/sdk/vue';

const route = ref("東京 東海道線 横浜");

const { 
  calculateFare, 
  result, 
  isCalculating, 
  error,
  validate,
  history,
  clearResult
} = useFareCalculation();

const handleCalculate = async () => {
  const validation = await validate(route.value);
  
  if (validation.isValid) {
    await calculateFare(route.value);
  } else {
    console.error('Invalid route:', validation.errors);
  }
};

// Watch for results
watch(result, (newResult) => {
  if (newResult) {
    console.log(`Fare: ${newResult.totalFare}円`);
  }
});
</script>

<template>
  <div>
    <input v-model="route" placeholder="ルートを入力..." />
    
    <button 
      @click="handleCalculate" 
      :disabled="isCalculating || !route"
      class="calculate-btn"
    >
      {{ isCalculating ? '計算中...' : '運賃計算' }}
    </button>
    
    <div v-if="error" class="error">{{ error.message }}</div>
    
    <div v-if="result" class="result">
      <h3>計算結果</h3>
      <p>運賃: {{ formatFare(result.totalFare) }}円</p>
      <p>距離: {{ result.route.totalDistance }}km</p>
      <p>所要時間: {{ result.route.estimatedTime }}分</p>
      
      <button @click="clearResult">結果をクリア</button>
    </div>
    
    <div v-if="history.length > 0" class="history">
      <h3>履歴 ({{ history.length }}件)</h3>
      <ul>
        <li v-for="(item, index) in history" :key="index">
          {{ item.route.description }} - {{ formatFare(item.totalFare) }}円
        </li>
      </ul>
    </div>
  </div>
</template>
```

### useRouteBuilder()

Interactive route building with validation.

```vue
<script setup>
import { ref, computed } from 'vue';
import { useRouteBuilder } from '@farert/sdk/vue';

const { 
  segments, 
  addStation, 
  removeStation, 
  clearRoute, 
  validation,
  isValidating,
  getOptimizationSuggestions
} = useRouteBuilder();

const newStationId = ref('');
const isValid = computed(() => validation.value?.isValid ?? false);

const handleAddStation = async () => {
  if (newStationId.value) {
    await addStation(parseInt(newStationId.value));
    newStationId.value = '';
  }
};
</script>

<template>
  <div class="route-builder">
    <h2>ルート作成</h2>
    
    <!-- Current route -->
    <div v-if="segments.length > 0" class="current-route">
      <ol class="segments">
        <li v-for="(segment, index) in segments" :key="index">
          {{ segment.stationName }}
          <button @click="removeStation(index)">削除</button>
        </li>
      </ol>
      <button @click="clearRoute">ルートをクリア</button>
    </div>
    
    <!-- Add station -->
    <div class="add-station">
      <input 
        v-model="newStationId" 
        type="number" 
        placeholder="駅ID"
      />
      <button @click="handleAddStation" :disabled="!newStationId">
        追加
      </button>
    </div>
    
    <!-- Validation -->
    <div v-if="validation" class="validation">
      <div v-if="isValidating">検証中...</div>
      <div v-else-if="isValid" class="valid">✅ 有効なルート</div>
      <div v-else class="invalid">
        ❌ 無効なルート
        <ul>
          <li v-for="error in validation.errors" :key="error.code">
            {{ error.message }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
```

### useReferenceData()

Access to companies, prefectures, and lines data.

```vue
<script setup>
import { computed } from 'vue';
import { useReferenceData } from '@farert/sdk/vue';

const { 
  companies, 
  prefectures, 
  lines,
  isLoading,
  error,
  refresh,
  getCompany
} = useReferenceData();

const jrCompanies = computed(() => 
  companies.value.filter(c => c.type === 'JR')
);

const privateCompanies = computed(() => 
  companies.value.filter(c => c.type === 'PRIVATE')
);
</script>

<template>
  <div v-if="isLoading">Loading reference data...</div>
  <div v-else-if="error">Error: {{ error.message }}</div>
  <div v-else>
    <section>
      <h2>JR Companies ({{ jrCompanies.length }})</h2>
      <ul>
        <li v-for="company in jrCompanies" :key="company.id">
          {{ company.name }}
        </li>
      </ul>
    </section>
    
    <section>
      <h2>Private Companies ({{ privateCompanies.length }})</h2>
      <ul>
        <li v-for="company in privateCompanies" :key="company.id">
          {{ company.name }}
        </li>
      </ul>
    </section>
    
    <button @click="refresh">Refresh Data</button>
  </div>
</template>
```

## Global Property Access

Alternative access via global property (when using plugin):

```vue
<script setup>
import { getCurrentInstance } from 'vue';

const instance = getCurrentInstance();
const sdk = instance?.appContext.config.globalProperties.$farert;

// Use SDK directly
const calculateRoute = async () => {
  if (sdk.value) {
    const result = await sdk.value.calculateFare("東京 東海道線 横浜");
    console.log('Result:', result);
  }
};
</script>
```

## TypeScript Integration

Full TypeScript support with Vue 3:

```ts
// types/vue.d.ts
import type { FarertSDK } from '@farert/sdk/vue';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $farert: ComputedRef<FarertSDK | null>;
    $initializeFarertSDK: () => Promise<void>;
  }
}
```

## Performance Considerations

- **Debouncing**: All search composables include configurable debouncing
- **Caching**: Automatic result caching with configurable TTL
- **Request Cancellation**: AbortController integration for cleanup
- **Memory Management**: Proper Vue reactivity and lifecycle cleanup
- **Lazy Loading**: Reference data loads only when needed

## Error Handling

All composables provide comprehensive error handling:

```vue
<script setup>
const { result, error, isLoading } = useFareCalculation();

watch(error, (newError) => {
  if (newError) {
    console.error('Calculation error:', {
      message: newError.message,
      code: newError.code,
      retryable: newError.retryable,
      context: newError.context
    });
    
    if (newError.retryable) {
      // Implement retry logic
    }
  }
});
</script>
```

## Best Practices

1. **Always check SDK readiness** before performing operations
2. **Use reactive refs** for query parameters to enable automatic updates
3. **Implement proper error handling** with user-friendly messages
4. **Leverage caching** by reusing search queries when possible
5. **Clean up resources** using the built-in lifecycle management
6. **Use computed properties** for derived data to maintain reactivity

## Compatibility

- **Vue 3.0+**: Full Composition API support
- **TypeScript**: Complete type safety with strict mode
- **SSR**: Compatible with Nuxt.js and other SSR frameworks
- **Build Systems**: Works with Vite, Vue CLI, and custom webpack setups