# Farert SDK Utilities

Framework-agnostic utilities for Japanese railway fare calculations and formatting. These utilities are designed to work with React, Vue, Angular, Svelte, or vanilla JavaScript applications.

## Features

- 🎯 **Framework-agnostic**: Works in any JavaScript environment
- 🇯🇵 **Japanese text support**: Proper handling of Japanese station names and routes
- 💰 **Comprehensive fare formatting**: Currency display, breakdowns, and comparisons
- ✅ **Route validation**: Detailed validation with helpful error messages
- 🔧 **Fluent API**: Easy-to-use route builder pattern
- 🌳 **Tree-shakeable**: Import only what you need

## Quick Start

```typescript
import { 
  formatFare, 
  validateRoute, 
  createRouteBuilder,
  formatFareBreakdown 
} from '@farert/sdk/utils';

// Format fare with Japanese yen
const formattedFare = formatFare(1980); // "¥1,980"

// Validate route format
const validation = validateRoute('東京 東海道線 横浜');
if (!validation.isValid) {
  console.error(formatValidationErrors(validation));
}

// Build routes fluently
const route = createRouteBuilder()
  .from('東京')
  .via('東海道線', '横浜')
  .via('根岸線', '大船')
  .build(); // "東京 東海道線 横浜 根岸線 大船"

// Format detailed fare breakdown
const breakdown = formatFareBreakdown(fareInfoData, {
  showDetails: true,
  includeDiscounts: true
});
```

## API Reference

### Fare Formatting

#### `formatFare(fare: number, options?: LocaleOptions): string`

Format fare amount with Japanese yen symbol and localization.

```typescript
formatFare(1980); // "¥1,980"
formatFare(1980, { locale: 'ja-JP', useGrouping: false }); // "¥1980"
formatFare(1980, { locale: 'en-US' }); // "$19.80" (if currency changed)
```

**Options:**
- `locale?: string` - Locale for number formatting (default: 'ja-JP')
- `currency?: string` - Currency code (default: 'JPY')  
- `useGrouping?: boolean` - Use thousands separators (default: true)

#### `formatFareSimple(fare: number): string`

Format fare with simple yen symbol (C++ compatible).

```typescript
formatFareSimple(1980); // "¥1980"
```

#### `formatFareBreakdown(fareInfo: FareInfoData, options?: FareBreakdownOptions): string`

Format detailed fare breakdown with route, discounts, and rules.

```typescript
const breakdown = formatFareBreakdown(fareInfo, {
  showDetails: true,
  includeKilometers: true,
  includeDiscounts: true,
  includeRules: true
});

/* Output:
運賃: ¥1,980
経路: 東京 → 東海道線 → 横浜 → 根岸線 → 大船
営業キロ: 53km
こども運賃: ¥990
IC運賃: ¥1,976
割引運賃:
  定期券割引: ¥1,782
  回数券割引: ¥1,584
適用規則: 規則第114条（長距離逓減）
*/
```

### Station and Route Formatting

#### `formatStationName(stationName: string, stationId?: number, options?: StationNameOptions): string`

Format Japanese station names with proper handling and fallbacks.

```typescript
formatStationName('新宿'); // "新宿"
formatStationName('', 1001, { fallbackToId: true }); // "駅ID:1001"
formatStationName('非常に長い駅名です', undefined, { maxLength: 5 }); // "非常に長い…"
```

#### `formatRouteDescription(routeList: string): string`

Format route description in Japanese with proper arrows.

```typescript
formatRouteDescription('東京-横浜-大船'); // "東京 → 横浜 → 大船"
```

### Route Validation

#### `validateRoute(routeString: string): RouteValidationResult`

Validate route string format with detailed feedback.

```typescript
const validation = validateRoute('東京 東海道線 横浜');

if (validation.isValid) {
  console.log('Route is valid!');
} else {
  console.error('Validation errors:', validation.errors);
  console.warn('Warnings:', validation.warnings);
}
```

**Result structure:**
```typescript
interface RouteValidationResult {
  isValid: boolean;
  errors: RouteValidationError[];
  warnings: RouteValidationWarning[];
  suggestions: string[];
}
```

#### `formatValidationErrors(validation: RouteValidationResult, locale?: 'ja' | 'en'): string`

Format validation errors for user display.

```typescript
const formatted = formatValidationErrors(validation);
/* Output:
❌ エラー:
  1. 駅名「tokyo」が見つかりません
     位置: 1番目の要素
     値: "tokyo"
     解決方法:
       - 正確な漢字駅名を使用してください
       - ひらがな・カタカナではなく漢字で入力してください
*/
```

### Route Builder

#### `createRouteBuilder(): RouteBuilder`

Create a fluent API builder for route construction.

```typescript
const builder = createRouteBuilder();

// Simple route
const route1 = builder
  .from('東京')
  .via('東海道線', '横浜')
  .build();

// Complex route
const route2 = builder
  .reset()
  .from('東京')
  .via('東海道線', '横浜')
  .via('根岸線', '大船')
  .via('東海道線', '藤沢')
  .build();

// Get as array
const routeArray = builder.buildArray(); // ['東京', '東海道線', '横浜', ...]
```

### Utility Functions

#### `isFareReasonable(fare: number): { isReasonable: boolean; reason?: string }`

Check if fare amount is within reasonable bounds.

```typescript
isFareReasonable(1980); // { isReasonable: true }
isFareReasonable(100); // { isReasonable: false, reason: '運賃が最低運賃未満です' }
isFareReasonable(60000); // { isReasonable: false, reason: '運賃が異常に高額です' }
```

#### `formatKilometers(km: number): string`

Format distance with appropriate units.

```typescript
formatKilometers(53); // "53km"
formatKilometers(53.7); // "53.7km" 
formatKilometers(0.5); // "500m"
```

#### `compareFares(fare1: FareInfoData, fare2: FareInfoData, labels?: [string, string]): string`

Compare two fare calculations and highlight differences.

```typescript
const comparison = compareFares(fareA, fareB, ['Direct Route', 'Express Route']);
/* Output:
運賃比較: Direct Route vs Express Route
Direct Route: ¥1980
Express Route: ¥2210
差額: ¥230 (Direct Routeが安い)
*/
```

## Framework Integration Examples

### React

```tsx
import React from 'react';
import { formatFare, formatFareBreakdown, validateRoute } from '@farert/sdk/utils';

function FareDisplay({ fareInfo }: { fareInfo: FareInfoData }) {
  const formattedFare = formatFare(fareInfo.fare);
  const breakdown = formatFareBreakdown(fareInfo, { showDetails: true });
  
  return (
    <div>
      <h3>運賃: {formattedFare}</h3>
      <pre>{breakdown}</pre>
    </div>
  );
}

function RouteInput({ onRouteChange }: { onRouteChange: (route: string) => void }) {
  const [route, setRoute] = React.useState('');
  const [validation, setValidation] = React.useState(null);
  
  const handleRouteChange = (value: string) => {
    setRoute(value);
    const validation = validateRoute(value);
    setValidation(validation);
    
    if (validation.isValid) {
      onRouteChange(value);
    }
  };
  
  return (
    <div>
      <input 
        value={route}
        onChange={(e) => handleRouteChange(e.target.value)}
        placeholder="東京 東海道線 横浜"
      />
      {validation && !validation.isValid && (
        <div className="error">
          {formatValidationErrors(validation)}
        </div>
      )}
    </div>
  );
}
```

### Vue 3

```vue
<template>
  <div>
    <h3>運賃: {{ formattedFare }}</h3>
    <pre>{{ breakdown }}</pre>
    
    <input 
      v-model="route"
      @input="validateRoute"
      placeholder="東京 東海道線 横浜"
    />
    <div v-if="!routeValid" class="error">
      {{ validationErrors }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  formatFare, 
  formatFareBreakdown, 
  validateRoute as validateRouteUtil,
  formatValidationErrors 
} from '@farert/sdk/utils';

const props = defineProps<{ fareInfo: FareInfoData }>();
const route = ref('');
const validation = ref(null);

const formattedFare = computed(() => formatFare(props.fareInfo.fare));
const breakdown = computed(() => formatFareBreakdown(props.fareInfo, { showDetails: true }));
const routeValid = computed(() => validation.value?.isValid ?? true);
const validationErrors = computed(() => 
  validation.value ? formatValidationErrors(validation.value) : ''
);

function validateRoute() {
  validation.value = validateRouteUtil(route.value);
}
</script>
```

### Svelte

```svelte
<script lang="ts">
  import { 
    formatFare, 
    formatFareBreakdown, 
    validateRoute,
    formatValidationErrors 
  } from '@farert/sdk/utils';
  
  export let fareInfo: FareInfoData;
  
  let route = '';
  $: validation = validateRoute(route);
  $: formattedFare = formatFare(fareInfo.fare);
  $: breakdown = formatFareBreakdown(fareInfo, { showDetails: true });
</script>

<div>
  <h3>運賃: {formattedFare}</h3>
  <pre>{breakdown}</pre>
  
  <input 
    bind:value={route}
    placeholder="東京 東海道線 横浜"
  />
  
  {#if !validation.isValid}
    <div class="error">
      <pre>{formatValidationErrors(validation)}</pre>
    </div>
  {/if}
</div>
```

### Angular

```typescript
// fare-display.component.ts
import { Component, Input } from '@angular/core';
import { 
  formatFare, 
  formatFareBreakdown, 
  validateRoute,
  formatValidationErrors,
  type FareInfoData,
  type RouteValidationResult
} from '@farert/sdk/utils';

@Component({
  selector: 'app-fare-display',
  template: `
    <div>
      <h3>運賃: {{ formattedFare }}</h3>
      <pre>{{ breakdown }}</pre>
      
      <input 
        [(ngModel)]="route"
        (input)="onRouteChange()"
        placeholder="東京 東海道線 横浜"
      />
      
      <div *ngIf="!validation?.isValid" class="error">
        <pre>{{ validationErrors }}</pre>
      </div>
    </div>
  `
})
export class FareDisplayComponent {
  @Input() fareInfo!: FareInfoData;
  
  route = '';
  validation: RouteValidationResult | null = null;
  
  get formattedFare(): string {
    return formatFare(this.fareInfo.fare);
  }
  
  get breakdown(): string {
    return formatFareBreakdown(this.fareInfo, { showDetails: true });
  }
  
  get validationErrors(): string {
    return this.validation ? formatValidationErrors(this.validation) : '';
  }
  
  onRouteChange(): void {
    this.validation = validateRoute(this.route);
  }
}
```

### Vanilla JavaScript

```javascript
import { 
  formatFare, 
  formatFareBreakdown, 
  validateRoute,
  formatValidationErrors,
  createRouteBuilder 
} from '@farert/sdk/utils';

// Format fare
const fareElement = document.getElementById('fare');
fareElement.textContent = formatFare(1980);

// Route builder
const builder = createRouteBuilder();
const route = builder
  .from('東京')
  .via('東海道線', '横浜')
  .build();

// Validate route input
const routeInput = document.getElementById('route-input');
const errorDiv = document.getElementById('validation-errors');

routeInput.addEventListener('input', (e) => {
  const validation = validateRoute(e.target.value);
  
  if (validation.isValid) {
    errorDiv.style.display = 'none';
    routeInput.classList.remove('error');
  } else {
    errorDiv.style.display = 'block';
    errorDiv.textContent = formatValidationErrors(validation);
    routeInput.classList.add('error');
  }
});

// Display fare breakdown
function displayFareBreakdown(fareInfo) {
  const breakdown = formatFareBreakdown(fareInfo, {
    showDetails: true,
    includeDiscounts: true,
    includeRules: true
  });
  
  document.getElementById('fare-breakdown').textContent = breakdown;
}
```

## Best Practices

1. **Use TypeScript**: All utilities are fully typed for better development experience
2. **Tree-shake imports**: Import only what you need to minimize bundle size
3. **Handle Japanese text carefully**: Use the provided formatting utilities for proper display
4. **Validate user input**: Always validate route strings before processing
5. **Provide user feedback**: Use formatted error messages for better UX
6. **Cache results**: Consider caching formatted results for better performance

## Error Handling

The utilities are designed to fail gracefully:

- Invalid inputs return safe fallback values
- Validation functions provide detailed error messages
- Japanese text normalization includes fallbacks
- All functions handle edge cases (empty strings, null values, etc.)

```typescript
// Safe fallbacks
formatFare(0); // "¥0" (not an error)
formatStationName(''); // "駅名不明" 
validateRoute('invalid').isValid; // false (with helpful errors)
```

## Performance Considerations

- All utilities are synchronous and lightweight
- String operations are optimized for Japanese text
- Number formatting uses native `Intl` APIs when available
- Validation is performed client-side for immediate feedback
- Functions are designed to be called frequently without performance issues

## Contributing

When extending these utilities:

1. Maintain framework-agnostic design
2. Add comprehensive TypeScript types  
3. Include JSDoc documentation
4. Add unit tests for new functionality
5. Follow the existing naming conventions
6. Ensure Japanese text handling is correct