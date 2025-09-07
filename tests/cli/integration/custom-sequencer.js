/**
 * Custom Test Sequencer for CLI Integration Tests - Task 15
 * Controls test execution order to optimize performance and resource usage
 */

const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

class CLIIntegrationTestSequencer extends Sequencer {
  /**
   * Order tests by priority and resource requirements
   * 1. Quick help/environment tests first
   * 2. Individual route calculations
   * 3. C++ compatibility tests  
   * 4. Performance validation tests
   * 5. Error scenario tests
   * 6. Complete test suite execution last
   */
  sort(tests) {
    const testOrder = [
      // Phase 1: Quick validation tests (low resource usage)
      'cli-integration.test.ts',
      
      // Phase 2: C++ compatibility tests (medium resource usage)  
      'cpp-comparison.test.ts',
      
      // Phase 3: Error scenarios (low-medium resource usage)
      'error-scenarios.test.ts',
      
      // Phase 4: Performance tests (high resource usage, run last)
      'performance-validation.test.ts'
    ];
    
    return tests.sort((testA, testB) => {
      const getTestPriority = (testPath) => {
        const fileName = path.basename(testPath);
        const index = testOrder.findIndex(order => fileName.includes(order.replace('.test.ts', '')));
        return index === -1 ? 999 : index;
      };
      
      const priorityA = getTestPriority(testA.path);
      const priorityB = getTestPriority(testB.path);
      
      // Primary sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Secondary sort by file name for consistent ordering
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = CLIIntegrationTestSequencer;