# Security Input Validator

Comprehensive security validation system for the Farert Frontend API Layer SDK that prevents injection attacks, validates Japanese text correctly, and provides robust input sanitization for all API parameters.

## Overview

The Security Input Validator is designed to protect the Frontend API Layer from various attack vectors while maintaining excellent developer experience and complete TypeScript type safety. It provides specialized validation for Japanese railway station names, route parameters, search queries, and other inputs.

## Key Features

### 🔒 Security Protection
- **SQL Injection Prevention** - Detects and blocks SQL injection attempts
- **XSS Attack Prevention** - Prevents cross-site scripting through input validation
- **Command Injection Protection** - Blocks command injection patterns
- **Prototype Pollution Prevention** - Protects against prototype pollution attacks
- **Unicode Attack Prevention** - Handles malicious Unicode sequences safely

### 🇯🇵 Japanese Text Support
- **Complete Japanese Character Support** - Validates Hiragana, Katakana, and Kanji
- **Unicode Normalization** - Properly handles Unicode normalization forms
- **Mixed Script Validation** - Supports mixed Japanese-ASCII text for station names
- **Encoding Safety** - Prevents encoding-based attacks

### ⚡ Performance & Reliability
- **Rate Limiting** - Built-in rate limiting to prevent abuse
- **Performance Monitoring** - Tracks validation performance metrics
- **Memory Safe** - Bounded execution time and memory usage
- **Circuit Breaker Pattern** - Prevents cascading failures

### 🛠️ Developer Experience
- **TypeScript First** - Complete type safety with strict mode support
- **Comprehensive Error Messages** - User-friendly error messages without exposing internals
- **Configurable Security Levels** - Adjust security strictness for different environments
- **Framework Agnostic** - Works with any JavaScript framework

## Quick Start

### Basic Usage

```typescript
import { createInputValidator } from '@farert/sdk/security';

const validator = createInputValidator();

// Validate station names
const stationResult = validator.validateStationName('東京');
if (stationResult.isValid) {
  console.log('Safe station name:', stationResult.sanitizedValue);
} else {
  console.error('Validation errors:', stationResult.errors);
}

// Validate search queries
const searchResult = validator.validateSearchQuery('新宿駅');
if (searchResult.isValid) {
  // Safe to use in search
  performSearch(searchResult.sanitizedValue);
}
```

### Factory Functions

```typescript
import { 
  createStrictInputValidator,
  createPermissiveInputValidator 
} from '@farert/sdk/security';

// For production environments
const strictValidator = createStrictInputValidator({
  maxStringLength: 100,
  rateLimiting: { maxRequestsPerMinute: 60 }
});

// For development environments
const devValidator = createPermissiveInputValidator({
  maxStringLength: 1000,
  rateLimiting: { enabled: false }
});
```

## Validation Methods

### Station Validation

```typescript
// Station name validation
const nameResult = validator.validateStationName('渋谷');
// Returns: { isValid: true, sanitizedValue: '渋谷', errors: [], warnings: [] }

// Station ID validation
const idResult = validator.validateStationId(1130101);
// Returns: { isValid: true, sanitizedValue: 1130101, errors: [], warnings: [] }
```

### Route Validation

```typescript
// Route segments validation
const segments = [
  {
    stationId: 1130101,
    stationName: '東京',
    stationKana: 'とうきょう',
    isTransfer: false
  },
  {
    stationId: 1130201,
    stationName: '新宿',
    stationKana: 'しんじゅく',
    lineId: 11302,
    isTransfer: true
  }
];

const routeResult = validator.validateRouteSegments(segments);
if (routeResult.isValid) {
  // Safe to use validated segments
  calculateFare(routeResult.sanitizedValue);
}
```

### Search Validation

```typescript
// Search query validation with XSS protection
const queryResult = validator.validateSearchQuery('東京駅');
if (queryResult.isValid) {
  // Safe to use in database queries
  searchStations(queryResult.sanitizedValue);
}

// Pagination validation
const paginationResult = validator.validatePaginationParams({
  page: 1,
  limit: 20,
  sortBy: 'name',
  sortOrder: 'asc'
});
```

## Security Features

### Attack Prevention

The validator automatically detects and prevents common attack patterns:

```typescript
// SQL Injection attempts are blocked
const sqlResult = validator.validateStationName("'; DROP TABLE stations; --");
// Returns: { isValid: false, errors: [{ securityType: 'sql_injection', ... }] }

// XSS attempts are blocked
const xssResult = validator.validateSearchQuery('<script>alert("xss")</script>');
// Returns: { isValid: false, errors: [{ securityType: 'xss_attempt', ... }] }

// Command injection attempts are blocked
const cmdResult = validator.validateSearchQuery('$(rm -rf /)');
// Returns: { isValid: false, errors: [{ securityType: 'command_injection', ... }] }
```

### Japanese Text Validation

```typescript
// Validates proper Japanese characters
validator.isValidJapaneseText('東京駅'); // true
validator.isValidJapaneseText('とうきょうえき'); // true
validator.isValidJapaneseText('トウキョウエキ'); // true
validator.isValidJapaneseText('Tokyo Station'); // false (warning, not error)
validator.isValidJapaneseText('<script>'); // false (security error)
```

### String Sanitization

```typescript
// Automatic sanitization
const sanitized = validator.sanitizeString('東\u200B京\uFEFF'); // Removes zero-width chars
// Result: '東京'

const normalized = validator.sanitizeString('ﾄｳｷｮｳ'); // Normalizes half-width katakana
// Result: 'トウキョウ'
```

## Configuration Options

### Validator Options

```typescript
import { InputValidator, SecurityLevel } from '@farert/sdk/security';

const validator = new InputValidator({
  // String length limits
  maxStringLength: 1000,
  maxArrayLength: 100,
  
  // Japanese text features
  enableJapaneseValidation: true,
  enableUnicodeNormalization: true,
  
  // Security settings
  securityLevelThreshold: SecurityLevel.SUSPICIOUS,
  
  // Performance monitoring
  enablePerformanceMonitoring: true,
  
  // Rate limiting
  rateLimiting: {
    enabled: true,
    maxRequestsPerMinute: 100,
    windowSizeMs: 60000
  },
  
  // Custom security patterns
  customPatterns: {
    dangerous: [/custom-dangerous-pattern/i],
    suspicious: [/custom-suspicious-pattern/i],
    allowed: [/custom-allowed-pattern/i]
  }
});
```

### Security Levels

```typescript
import { SecurityLevel } from '@farert/sdk/security';

// SecurityLevel.SAFE - No issues detected
// SecurityLevel.MONITORED - Minor warnings, track usage
// SecurityLevel.SUSPICIOUS - Potential security concerns
// SecurityLevel.BLOCKED - Definite security violations
```

## Error Handling

### Validation Errors

```typescript
const result = validator.validateStationName('malicious-input');

if (!result.isValid) {
  result.errors.forEach(error => {
    console.error(`Field: ${error.field}`);
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    console.error(`Security Type: ${error.securityType}`);
    console.error(`Suggestions: ${error.suggestions.join(', ')}`);
  });
}
```

### Security Warnings

```typescript
const result = validator.validateStationName('Tokyo'); // English input

result.warnings.forEach(warning => {
  console.warn(`Type: ${warning.type}`);
  console.warn(`Message: ${warning.message}`);
  console.warn(`Risk Level: ${warning.riskLevel}`);
  console.warn(`Recommendation: ${warning.recommendation}`);
});
```

## Performance Monitoring

### Performance Statistics

```typescript
// Enable performance monitoring
const validator = createInputValidator({ 
  enablePerformanceMonitoring: true 
});

// Perform some validations
validator.validateStationName('東京');
validator.validateStationId(1130101);

// Get performance stats
const stats = validator.getPerformanceStats();
console.log(stats);
// {
//   stationName: { count: 1, avgTime: 2.5, maxTime: 2.5 },
//   stationId: { count: 1, avgTime: 1.2, maxTime: 1.2 }
// }

// Clear stats when needed
validator.clearPerformanceStats();
```

### Rate Limiting Status

```typescript
// Check rate limiting status
const status = validator.getRateLimitStatus();
console.log(status);
// {
//   stationName: { requests: 45, remaining: 15 },
//   searchQuery: { requests: 12, remaining: 48 }
// }
```

## Integration Examples

### Svelte Integration

```svelte
<script lang="ts">
  import { createInputValidator } from '@farert/sdk/security';
  
  const validator = createInputValidator();
  let stationInput = '';
  let validationResult = null;
  
  $: {
    if (stationInput.trim()) {
      validationResult = validator.validateStationName(stationInput);
    }
  }
</script>

<input 
  bind:value={stationInput} 
  placeholder="駅名を入力してください"
  class:error={validationResult && !validationResult.isValid}
/>

{#if validationResult && !validationResult.isValid}
  <div class="error-messages">
    {#each validationResult.errors as error}
      <p class="error">{error.message}</p>
    {/each}
  </div>
{/if}
```

### React Integration

```tsx
import React, { useState, useMemo } from 'react';
import { createInputValidator } from '@farert/sdk/security';

function StationInput() {
  const [stationName, setStationName] = useState('');
  const validator = useMemo(() => createInputValidator(), []);
  
  const validationResult = useMemo(() => {
    return stationName.trim() ? validator.validateStationName(stationName) : null;
  }, [stationName, validator]);
  
  return (
    <div>
      <input
        value={stationName}
        onChange={(e) => setStationName(e.target.value)}
        placeholder="駅名を入力してください"
        className={validationResult && !validationResult.isValid ? 'error' : ''}
      />
      
      {validationResult && !validationResult.isValid && (
        <div className="error-messages">
          {validationResult.errors.map((error, index) => (
            <p key={index} className="error">{error.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Vue Integration

```vue
<template>
  <div>
    <input
      v-model="stationName"
      placeholder="駅名を入力してください"
      :class="{ error: validationResult && !validationResult.isValid }"
    />
    
    <div v-if="validationResult && !validationResult.isValid" class="error-messages">
      <p v-for="error in validationResult.errors" :key="error.code" class="error">
        {{ error.message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { createInputValidator } from '@farert/sdk/security';

const stationName = ref('');
const validator = createInputValidator();

const validationResult = computed(() => {
  return stationName.value.trim() 
    ? validator.validateStationName(stationName.value) 
    : null;
});
</script>
```

## API Reference

### InputValidator Class

#### Constructor
```typescript
new InputValidator(options?: ValidatorOptions)
```

#### Station Validation Methods
- `validateStationName(name: string): ValidationResult`
- `validateStationId(id: number): ValidationResult`

#### Route Validation Methods
- `validateRouteSegments(segments: RouteSegment[], options?: RouteValidationOptions): ValidationResult`
- `validateRouteOptions(options: any): ValidationResult`

#### Search Validation Methods
- `validateSearchQuery(query: string): ValidationResult`
- `validatePaginationParams(params: PaginationParams): ValidationResult`

#### Utility Methods
- `sanitizeString(input: string): string`
- `isValidJapaneseText(text: string): boolean`
- `checkStringLength(text: string, maxLength: number): boolean`

#### Performance Methods
- `getPerformanceStats(): Record<string, PerformanceStats>`
- `clearPerformanceStats(): void`
- `getRateLimitStatus(): Record<string, RateLimitStatus>`

### Factory Functions

- `createInputValidator(options?: ValidatorOptions): InputValidator`
- `createStrictInputValidator(options?: ValidatorOptions): InputValidator`
- `createPermissiveInputValidator(options?: ValidatorOptions): InputValidator`

### Type Definitions

#### ValidationResult
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedValue?: any;
  warnings: ValidationWarning[];
  metadata: {
    validationTime: number;
    originalLength: number;
    sanitizedLength?: number;
    securityLevel: SecurityLevel;
  };
}
```

#### ValidationError
```typescript
interface ValidationError {
  field: string;
  code: ValidationErrorCode;
  message: string;
  severity: 'error' | 'warning';
  securityType?: SecurityViolationType;
  suggestions: string[];
}
```

## Best Practices

### 1. Use Appropriate Security Level
```typescript
// Production: Use strict validator
const prodValidator = createStrictInputValidator();

// Development: Use permissive validator with monitoring
const devValidator = createPermissiveInputValidator({
  enablePerformanceMonitoring: true
});
```

### 2. Always Check Validation Results
```typescript
// ✅ Good: Always check validation result
const result = validator.validateStationName(userInput);
if (result.isValid) {
  // Use sanitized value
  processStation(result.sanitizedValue);
} else {
  // Handle errors appropriately
  showValidationErrors(result.errors);
}

// ❌ Bad: Using unsanitized input
processStation(userInput); // Potential security risk
```

### 3. Handle Security Violations Appropriately
```typescript
const result = validator.validateSearchQuery(query);
if (!result.isValid) {
  const securityViolations = result.errors.filter(error => error.securityType);
  
  if (securityViolations.length > 0) {
    // Log security incident
    console.warn('Security violation detected:', securityViolations);
    
    // Show user-friendly error
    showError('検索クエリに無効な文字が含まれています。');
    
    // Don't process the request
    return;
  }
}
```

### 4. Monitor Performance in Production
```typescript
const validator = createInputValidator({ 
  enablePerformanceMonitoring: true 
});

// Periodically check performance
setInterval(() => {
  const stats = validator.getPerformanceStats();
  
  // Alert if validation is taking too long
  Object.entries(stats).forEach(([operation, data]) => {
    if (data.avgTime > 10) { // 10ms threshold
      console.warn(`Validation performance issue: ${operation} averaging ${data.avgTime}ms`);
    }
  });
}, 60000); // Check every minute
```

## Security Considerations

1. **Input Validation is First Line of Defense** - Always validate at input boundaries
2. **Don't Rely Solely on Client-Side Validation** - Server-side validation is still required
3. **Monitor Security Violations** - Log and monitor blocked attempts
4. **Regular Security Pattern Updates** - Keep attack patterns updated
5. **Rate Limiting** - Use rate limiting to prevent abuse
6. **Performance Monitoring** - Monitor for DoS attempts through complex validation

## License

This security module is part of the Farert WebAssembly SDK and is licensed under GPL-3.0.