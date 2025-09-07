/**
 * Demonstration of Fare Formatting Utilities
 * Shows how to use the framework-agnostic utilities
 */

import {
  formatFare,
  formatFareSimple,
  formatFareBreakdown,
  formatStationName,
  formatRouteDescription,
  validateRoute,
  formatValidationErrors,
  createRouteBuilder,
  isFareReasonable,
  formatKilometers,
  compareFares
} from './fare-utils';
import { FareInfoData } from '../../cli/types';

// Demo function to showcase utility usage
export function demonstrateFareUtils(): void {
  console.log('=== Farert SDK Utilities Demonstration ===\n');

  // 1. Fare Formatting
  console.log('1. Fare Formatting:');
  console.log(`Basic fare: ${formatFare(1980)}`);
  console.log(`Simple fare: ${formatFareSimple(1980)}`);
  console.log(`Large fare: ${formatFare(123456)}`);
  console.log(`Zero fare: ${formatFare(0)}\n`);

  // 2. Station Name Formatting
  console.log('2. Station Name Formatting:');
  console.log(`Station: ${formatStationName('東京')}`);
  console.log(`Long station: ${formatStationName('非常に長い駅名です', undefined, { maxLength: 5 })}`);
  console.log(`Empty with fallback: ${formatStationName('', 1001, { fallbackToId: true })}\n`);

  // 3. Route Description Formatting
  console.log('3. Route Description Formatting:');
  console.log(`Route: ${formatRouteDescription('東京-横浜-大船')}`);
  console.log(`Empty route: ${formatRouteDescription('')}\n`);

  // 4. Route Validation
  console.log('4. Route Validation:');
  
  const validRoute = '東京 東海道線 横浜';
  const validValidation = validateRoute(validRoute);
  console.log(`Valid route "${validRoute}": ${validValidation.isValid}`);
  
  const invalidRoute = '東京 横浜';
  const invalidValidation = validateRoute(invalidRoute);
  console.log(`Invalid route "${invalidRoute}": ${invalidValidation.isValid}`);
  if (!invalidValidation.isValid) {
    console.log('Validation errors:');
    console.log(formatValidationErrors(invalidValidation));
  }
  console.log();

  // 5. Route Builder
  console.log('5. Route Builder:');
  const builder = createRouteBuilder();
  const route = builder
    .from('東京')
    .via('東海道線', '横浜')
    .via('根岸線', '大船')
    .build();
  console.log(`Built route: ${route}`);
  console.log(`As array: [${builder.buildArray().join(', ')}]\n`);

  // 6. Fare Reasonableness Check
  console.log('6. Fare Reasonableness Check:');
  const reasonable = isFareReasonable(1980);
  console.log(`¥1,980 is reasonable: ${reasonable.isReasonable}`);
  
  const tooLow = isFareReasonable(100);
  console.log(`¥100 is reasonable: ${tooLow.isReasonable} (${tooLow.reason})`);
  
  const tooHigh = isFareReasonable(60000);
  console.log(`¥60,000 is reasonable: ${tooHigh.isReasonable} (${tooHigh.reason})\n`);

  // 7. Distance Formatting
  console.log('7. Distance Formatting:');
  console.log(`53km: ${formatKilometers(53)}`);
  console.log(`53.7km: ${formatKilometers(53.7)}`);
  console.log(`0.5km: ${formatKilometers(0.5)}\n`);

  // 8. Fare Breakdown (using mock data)
  console.log('8. Fare Breakdown:');
  const mockFareInfo: FareInfoData = {
    result: 0,
    fare: 1980,
    isRule114Applied: true,
    availCountForFareOfStockDiscount: 2,
    beginStationId: 1001,
    endStationId: 2001,
    routeList: '東京 → 東海道線 → 横浜 → 根岸線 → 大船',
    fareForIC: 1976,
    childFare: 990,
    academicFare: 1584,
    totalSalesKm: 53,
    ticketAvailDays: 1,
    isRoundtrip: false,
    isSpecificFare: false,
    fareForStockDiscount: (index: number) => {
      const discounts = [1782, 1584];
      return discounts[index] || 0;
    },
    fareForStockDiscountTitle: (index: number) => {
      const titles = ['定期券割引', '回数券割引'];
      return titles[index] || '';
    }
  } as FareInfoData;

  const breakdown = formatFareBreakdown(mockFareInfo, {
    showDetails: true,
    includeKilometers: true,
    includeDiscounts: true,
    includeRules: true
  });
  console.log(breakdown);
  console.log();

  // 9. Fare Comparison
  console.log('9. Fare Comparison:');
  const fare1: FareInfoData = { ...mockFareInfo, fare: 1980, routeList: '東京 → 横浜（直行）' };
  const fare2: FareInfoData = { ...mockFareInfo, fare: 2210, routeList: '東京 → 品川 → 横浜' };
  
  const comparison = compareFares(fare1, fare2, ['直行ルート', '経由ルート']);
  console.log(comparison);

  console.log('\n=== Demonstration Complete ===');
}

// Export demo function for use in other files
export default demonstrateFareUtils;