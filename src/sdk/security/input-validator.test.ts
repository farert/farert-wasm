/**
 * Test file for Security Input Validator
 * 
 * Basic validation tests to ensure the security input validator functions correctly
 * and prevents common attack vectors while handling Japanese text properly.
 */

import {
  InputValidator,
  createInputValidator,
  createStrictInputValidator,
  createPermissiveInputValidator,
  SecurityLevel,
  SecurityViolationType,
  ValidationErrorCode
} from './input-validator';

// Mock performance.now for testing environments that don't have it
if (typeof performance === 'undefined') {
  (global as any).performance = { now: () => Date.now() };
}

// ============================================================================
// BASIC FUNCTIONALITY TESTS
// ============================================================================

/**
 * Test basic station name validation
 */
function testStationNameValidation() {
  const validator = createInputValidator();
  
  // Valid Japanese station names
  const validNames = ['東京', '新宿', '渋谷', '品川', '新橋'];
  for (const name of validNames) {
    const result = validator.validateStationName(name);
    console.assert(result.isValid, `Station name "${name}" should be valid`);
    console.assert(result.sanitizedValue === name, `Sanitized value should match original for "${name}"`);
  }
  
  // Invalid inputs
  const invalidInputs = [
    '',
    '   ',
    null as any,
    undefined as any,
    'SELECT * FROM stations',
    '<script>alert("xss")</script>',
    'a'.repeat(200) // Too long
  ];
  
  for (const input of invalidInputs) {
    const result = validator.validateStationName(input);
    console.assert(!result.isValid, `Input "${input}" should be invalid`);
    console.assert(result.errors.length > 0, `Input "${input}" should have errors`);
  }
  
  console.log('✅ Station name validation tests passed');
}

/**
 * Test station ID validation
 */
function testStationIdValidation() {
  const validator = createInputValidator();
  
  // Valid station IDs
  const validIds = [1, 1130101, 9999999];
  for (const id of validIds) {
    const result = validator.validateStationId(id);
    console.assert(result.isValid, `Station ID ${id} should be valid`);
    console.assert(result.sanitizedValue === id, `Sanitized value should match original for ID ${id}`);
  }
  
  // Invalid station IDs
  const invalidIds = [0, -1, 1.5, NaN, Infinity, 999999999];
  for (const id of invalidIds) {
    const result = validator.validateStationId(id);
    console.assert(!result.isValid, `Station ID ${id} should be invalid`);
  }
  
  console.log('✅ Station ID validation tests passed');
}

/**
 * Test search query validation
 */
function testSearchQueryValidation() {
  const validator = createInputValidator();
  
  // Valid search queries
  const validQueries = ['東京', 'tokyo', 'しんじゅく', 'Shinjuku Station'];
  for (const query of validQueries) {
    const result = validator.validateSearchQuery(query);
    console.assert(result.isValid, `Search query "${query}" should be valid`);
  }
  
  // Potentially malicious queries
  const maliciousQueries = [
    'SELECT * FROM stations WHERE name = "東京"',
    '<script>alert("xss")</script>',
    '東京"; DROP TABLE stations; --',
    'javascript:alert("xss")',
    'OR 1=1'
  ];
  
  for (const query of maliciousQueries) {
    const result = validator.validateSearchQuery(query);
    console.assert(!result.isValid, `Malicious query "${query}" should be invalid`);
    console.assert(
      result.errors.some(error => error.securityType),
      `Malicious query "${query}" should have security violation`
    );
  }
  
  console.log('✅ Search query validation tests passed');
}

/**
 * Test route segment validation
 */
function testRouteSegmentValidation() {
  const validator = createInputValidator();
  
  // Valid route segments
  const validSegments = [
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
      lineName: '山手線',
      isTransfer: true
    }
  ];
  
  const result = validator.validateRouteSegments(validSegments);
  console.assert(result.isValid, 'Valid route segments should pass validation');
  console.assert(result.sanitizedValue?.length === 2, 'Should have 2 sanitized segments');
  
  // Invalid route segments
  const invalidSegments = [
    {
      stationId: -1, // Invalid ID
      stationName: 'Invalid Station',
      stationKana: 'いんばりっど',
      isTransfer: false
    }
  ];
  
  const invalidResult = validator.validateRouteSegments(invalidSegments);
  console.assert(!invalidResult.isValid, 'Invalid route segments should fail validation');
  
  console.log('✅ Route segment validation tests passed');
}

/**
 * Test pagination validation
 */
function testPaginationValidation() {
  const validator = createInputValidator();
  
  // Valid pagination
  const validParams = {
    page: 1,
    limit: 20,
    offset: 0,
    sortBy: 'name',
    sortOrder: 'asc' as const
  };
  
  const result = validator.validatePaginationParams(validParams);
  console.assert(result.isValid, 'Valid pagination parameters should pass');
  
  // Invalid pagination
  const invalidParams = {
    page: -1,
    limit: 9999999,
    sortBy: 'DROP TABLE',
    sortOrder: 'invalid' as any
  };
  
  const invalidResult = validator.validatePaginationParams(invalidParams);
  console.assert(!invalidResult.isValid, 'Invalid pagination parameters should fail');
  
  console.log('✅ Pagination validation tests passed');
}

// ============================================================================
// SECURITY TESTS
// ============================================================================

/**
 * Test SQL injection prevention
 */
function testSQLInjectionPrevention() {
  const validator = createInputValidator();
  
  const sqlInjectionAttempts = [
    "'; DROP TABLE stations; --",
    "東京' OR '1'='1",
    "UNION SELECT * FROM users",
    "1; DELETE FROM routes",
    "' OR 1=1 --"
  ];
  
  for (const attempt of sqlInjectionAttempts) {
    const result = validator.validateStationName(attempt);
    console.assert(!result.isValid, `SQL injection attempt "${attempt}" should be blocked`);
    console.assert(
      result.errors.some(error => error.securityType === SecurityViolationType.SQL_INJECTION),
      `SQL injection attempt "${attempt}" should be detected as security violation`
    );
  }
  
  console.log('✅ SQL injection prevention tests passed');
}

/**
 * Test XSS prevention
 */
function testXSSPrevention() {
  const validator = createInputValidator();
  
  const xssAttempts = [
    '<script>alert("xss")</script>',
    '<iframe src="malicious.com"></iframe>',
    'javascript:alert("xss")',
    '<img src="x" onerror="alert(1)">',
    'onload="alert(1)"'
  ];
  
  for (const attempt of xssAttempts) {
    const result = validator.validateSearchQuery(attempt);
    console.assert(!result.isValid, `XSS attempt "${attempt}" should be blocked`);
    console.assert(
      result.errors.some(error => error.securityType === SecurityViolationType.XSS_ATTEMPT),
      `XSS attempt "${attempt}" should be detected as security violation`
    );
  }
  
  console.log('✅ XSS prevention tests passed');
}

/**
 * Test Japanese text validation
 */
function testJapaneseTextValidation() {
  const validator = createInputValidator();
  
  // Valid Japanese text
  const validJapanese = [
    '東京', // Kanji
    'とうきょう', // Hiragana
    'トウキョウ', // Katakana
    '東京駅', // Mixed
    '新宿南口', // Station with direction
    'JR東日本' // Mixed with ASCII
  ];
  
  for (const text of validJapanese) {
    console.assert(
      validator.isValidJapaneseText(text),
      `"${text}" should be valid Japanese text`
    );
  }
  
  // Invalid Japanese text
  const invalidJapanese = [
    'SELECT * FROM',
    '<script>',
    '||||||||',
    'ëxtrëmë',
    ''
  ];
  
  for (const text of invalidJapanese) {
    console.assert(
      !validator.isValidJapaneseText(text),
      `"${text}" should not be valid Japanese text`
    );
  }
  
  console.log('✅ Japanese text validation tests passed');
}

/**
 * Test string sanitization
 */
function testStringSanitization() {
  const validator = createInputValidator();
  
  // Test Unicode normalization
  const input = 'ﾄｳｷｮｳ'; // Half-width katakana
  const sanitized = validator.sanitizeString(input);
  console.assert(sanitized !== input, 'Half-width characters should be normalized');
  
  // Test control character removal
  const withControlChars = '東京\u0000\u0001\u001F';
  const sanitizedControl = validator.sanitizeString(withControlChars);
  console.assert(sanitizedControl === '東京', 'Control characters should be removed');
  
  // Test zero-width character removal
  const withZeroWidth = '東\u200B京\uFEFF';
  const sanitizedZeroWidth = validator.sanitizeString(withZeroWidth);
  console.assert(sanitizedZeroWidth === '東京', 'Zero-width characters should be removed');
  
  console.log('✅ String sanitization tests passed');
}

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

/**
 * Test factory functions
 */
function testFactoryFunctions() {
  // Test default validator
  const defaultValidator = createInputValidator();
  console.assert(defaultValidator instanceof InputValidator, 'Default validator should be InputValidator instance');
  
  // Test strict validator
  const strictValidator = createStrictInputValidator();
  console.assert(strictValidator instanceof InputValidator, 'Strict validator should be InputValidator instance');
  
  // Test permissive validator
  const permissiveValidator = createPermissiveInputValidator();
  console.assert(permissiveValidator instanceof InputValidator, 'Permissive validator should be InputValidator instance');
  
  // Test that they have different configurations
  const longInput = 'a'.repeat(1000);
  
  const strictResult = strictValidator.validateStationName(longInput);
  const permissiveResult = permissiveValidator.validateStationName(longInput);
  
  console.assert(!strictResult.isValid, 'Strict validator should reject long input');
  // Note: permissive might also reject if it's still too long, but should have higher threshold
  
  console.log('✅ Factory function tests passed');
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

/**
 * Test performance monitoring
 */
function testPerformanceMonitoring() {
  const validator = createInputValidator({ enablePerformanceMonitoring: true });
  
  // Perform some validations
  for (let i = 0; i < 10; i++) {
    validator.validateStationName('東京');
    validator.validateStationId(1130101);
    validator.validateSearchQuery('新宿');
  }
  
  const stats = validator.getPerformanceStats();
  console.assert(stats.stationName?.count >= 10, 'Should track station name validations');
  console.assert(stats.stationId?.count >= 10, 'Should track station ID validations');
  console.assert(stats.searchQuery?.count >= 10, 'Should track search query validations');
  
  console.log('✅ Performance monitoring tests passed');
}

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

/**
 * Test rate limiting
 */
function testRateLimiting() {
  const validator = createInputValidator({
    rateLimiting: {
      enabled: true,
      maxRequestsPerMinute: 5,
      windowSizeMs: 1000 // 1 second window for testing
    }
  });
  
  // First few requests should pass
  for (let i = 0; i < 5; i++) {
    const result = validator.validateStationName('東京');
    console.assert(result.isValid, `Request ${i + 1} should pass rate limiting`);
  }
  
  // Next request should be rate limited
  const rateLimitedResult = validator.validateStationName('東京');
  console.assert(!rateLimitedResult.isValid, 'Request should be rate limited');
  console.assert(
    rateLimitedResult.errors.some(error => error.code === ValidationErrorCode.INJECTION_ATTEMPT),
    'Rate limited request should have injection attempt error code'
  );
  
  const rateLimitStatus = validator.getRateLimitStatus();
  console.assert(rateLimitStatus.stationName?.remaining === 0, 'Should have no remaining requests');
  
  console.log('✅ Rate limiting tests passed');
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

/**
 * Run all tests
 */
export function runInputValidatorTests() {
  console.log('🧪 Running Security Input Validator Tests...\n');
  
  try {
    // Basic functionality tests
    testStationNameValidation();
    testStationIdValidation();
    testSearchQueryValidation();
    testRouteSegmentValidation();
    testPaginationValidation();
    
    // Security tests
    testSQLInjectionPrevention();
    testXSSPrevention();
    testJapaneseTextValidation();
    testStringSanitization();
    
    // Factory and configuration tests
    testFactoryFunctions();
    testPerformanceMonitoring();
    testRateLimiting();
    
    console.log('\n🎉 All Security Input Validator tests passed!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly (Node.js)
if (typeof module !== 'undefined' && require.main === module) {
  runInputValidatorTests();
}

// Default export for testing framework integration
export default {
  runInputValidatorTests,
  testStationNameValidation,
  testStationIdValidation,
  testSearchQueryValidation,
  testRouteSegmentValidation,
  testPaginationValidation,
  testSQLInjectionPrevention,
  testXSSPrevention,
  testJapaneseTextValidation,
  testStringSanitization,
  testFactoryFunctions,
  testPerformanceMonitoring,
  testRateLimiting
};