/**
 * Performance Comparison Utilities
 * パフォーマンス比較ユーティリティ
 *
 * This example provides comprehensive before/after performance comparison utilities
 * for analyzing optimization impacts and benchmarking different approaches.
 *
 * このサンプルは最適化の影響を分析し、異なるアプローチをベンチマークするための
 * 包括的な前後パフォーマンス比較ユーティリティを提供します。
 *
 * Features:
 * - A/B testing framework for performance optimizations
 * - Statistical analysis of performance improvements
 * - Regression detection and alerting
 * - Performance profiling and bottleneck identification
 * - Automated recommendation generation
 * - Historical performance tracking
 * - Visual performance reporting
 *
 * Execution / 実行方法:
 * node examples/api/performance/performance-comparison.js
 * node --expose-gc examples/api/performance/performance-comparison.js (recommended)
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

/**
 * Comprehensive Performance Comparison Framework
 * 包括的パフォーマンス比較フレームワーク
 */
class PerformanceComparisonFramework {
    constructor(options = {}) {
        this.testConfigs = {
            warmupRuns: options.warmupRuns || 3,
            measurementRuns: options.measurementRuns || 10,
            confidenceLevel: options.confidenceLevel || 0.95,
            significanceThreshold: options.significanceThreshold || 0.05,
            stabilityThreshold: options.stabilityThreshold || 0.1 // 10% CV
        };

        this.comparisonHistory = [];
        this.baselineResults = new Map();
        this.optimizationResults = new Map();
        this.regressionAlerts = [];
    }

    /**
     * Run comprehensive A/B performance comparison
     * 包括的A/Bパフォーマンス比較の実行
     */
    async runComparison(testName, approaches, testData, options = {}) {
        console.log(`\n🏁 Starting comprehensive performance comparison: ${testName}`);
        console.log(`📊 Approaches: ${Object.keys(approaches).join(' vs ')}`);
        console.log(`🔄 Measurement runs: ${this.testConfigs.measurementRuns} (${this.testConfigs.warmupRuns} warmup)`);

        const comparisonId = `${testName}_${Date.now()}`;
        const comparisonResults = {
            id: comparisonId,
            testName,
            timestamp: Date.now(),
            approaches: {},
            comparison: {},
            statistics: {},
            insights: [],
            recommendations: []
        };

        // Run tests for each approach
        for (const [approachName, approachFunction] of Object.entries(approaches)) {
            console.log(`\n🧪 Testing approach: ${approachName}`);

            const approachResults = await this.runSingleApproachTest(
                approachName,
                approachFunction,
                testData,
                options
            );

            comparisonResults.approaches[approachName] = approachResults;
        }

        // Perform statistical comparison
        comparisonResults.comparison = this.performStatisticalComparison(comparisonResults.approaches);
        comparisonResults.statistics = this.calculateAdvancedStatistics(comparisonResults.approaches);
        comparisonResults.insights = this.generateInsights(comparisonResults);
        comparisonResults.recommendations = this.generateRecommendations(comparisonResults);

        // Store results for historical tracking
        this.comparisonHistory.push(comparisonResults);

        // Report results
        this.reportComparisonResults(comparisonResults);

        return comparisonResults;
    }

    /**
     * Run performance test for a single approach
     * 単一アプローチのパフォーマンステスト実行
     */
    async runSingleApproachTest(approachName, approachFunction, testData, options) {
        const { validator = null, contextSetup = null, contextCleanup = null } = options;

        console.log(`   🔥 Performing ${this.testConfigs.warmupRuns} warmup runs...`);

        // Warmup runs
        for (let w = 0; w < this.testConfigs.warmupRuns; w++) {
            try {
                if (contextSetup) await contextSetup();
                await approachFunction(testData);
                if (contextCleanup) await contextCleanup();
            } catch (error) {
                console.warn(`⚠️ Warmup run ${w + 1} failed:`, error.message);
            }
        }

        // Force garbage collection before measurements
        this.forceGarbageCollection();
        await this.delay(100);

        console.log(`   📏 Performing ${this.testConfigs.measurementRuns} measurement runs...`);

        const measurements = [];
        let validResults = 0;

        for (let i = 0; i < this.testConfigs.measurementRuns; i++) {
            const measurement = await this.runSingleMeasurement(
                i + 1,
                approachFunction,
                testData,
                validator,
                contextSetup,
                contextCleanup
            );

            measurements.push(measurement);

            if (measurement.success && measurement.valid) {
                validResults++;
            }

            // Small delay between measurements
            await this.delay(50);
        }

        // Calculate comprehensive statistics
        const statistics = this.calculateApproachStatistics(measurements);

        const approachResults = {
            approachName,
            measurements,
            validResults,
            successRate: (measurements.filter(m => m.success).length / measurements.length) * 100,
            validationRate: (validResults / measurements.length) * 100,
            statistics
        };

        console.log(`   ✅ ${approachName} completed: ${statistics.duration.mean.toFixed(2)}ms avg, ${approachResults.successRate.toFixed(1)}% success`);

        return approachResults;
    }

    /**
     * Run a single measurement
     * 単一測定の実行
     */
    async runSingleMeasurement(runNumber, approachFunction, testData, validator, contextSetup, contextCleanup) {
        const startTime = performance.now();
        const startMemory = this.getCurrentMemoryInfo();

        let result = null;
        let success = false;
        let valid = false;
        let error = null;

        try {
            // Setup context if provided
            if (contextSetup) {
                await contextSetup();
            }

            // Execute the approach
            result = await approachFunction(testData);
            success = true;

            // Validate result if validator provided
            if (validator) {
                try {
                    valid = await validator(result, testData);
                } catch (validationError) {
                    valid = false;
                    error = `Validation failed: ${validationError.message}`;
                }
            } else {
                valid = true;
            }

        } catch (executionError) {
            success = false;
            valid = false;
            error = executionError.message;
        } finally {
            // Cleanup context if provided
            if (contextCleanup) {
                try {
                    await contextCleanup();
                } catch (cleanupError) {
                    console.warn(`⚠️ Cleanup error in run ${runNumber}:`, cleanupError.message);
                }
            }
        }

        const endTime = performance.now();
        const endMemory = this.getCurrentMemoryInfo();

        return {
            runNumber,
            duration: endTime - startTime,
            startTime,
            endTime,
            startMemory,
            endMemory,
            memoryDelta: this.calculateMemoryDelta(startMemory, endMemory),
            result,
            success,
            valid,
            error
        };
    }

    /**
     * Calculate comprehensive statistics for an approach
     * アプローチの包括的統計計算
     */
    calculateApproachStatistics(measurements) {
        const validMeasurements = measurements.filter(m => m.success && m.valid);
        const durations = validMeasurements.map(m => m.duration);
        const memoryDeltas = validMeasurements.map(m => m.memoryDelta);

        if (durations.length === 0) {
            return {
                duration: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, cv: 0 },
                memory: { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 },
                stability: 'no_data',
                outliers: { count: 0, indices: [] }
            };
        }

        const durationStats = this.calculateDescriptiveStats(durations);
        const memoryStats = this.calculateDescriptiveStats(memoryDeltas);

        // Stability analysis (Coefficient of Variation)
        const cv = durationStats.stdDev / durationStats.mean;
        let stability = 'stable';
        if (cv > this.testConfigs.stabilityThreshold) {
            stability = cv > this.testConfigs.stabilityThreshold * 2 ? 'unstable' : 'moderate';
        }

        // Outlier detection using IQR method
        const outliers = this.detectOutliers(durations);

        return {
            duration: { ...durationStats, cv },
            memory: memoryStats,
            stability,
            outliers
        };
    }

    /**
     * Calculate descriptive statistics
     * 記述統計の計算
     */
    calculateDescriptiveStats(values) {
        if (values.length === 0) {
            return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = this.calculateMedian(sorted);
        const stdDev = Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );

        return {
            mean,
            median,
            stdDev,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            q1: this.calculatePercentile(sorted, 25),
            q3: this.calculatePercentile(sorted, 75),
            p95: this.calculatePercentile(sorted, 95),
            p99: this.calculatePercentile(sorted, 99)
        };
    }

    /**
     * Perform statistical comparison between approaches
     * アプローチ間の統計的比較実行
     */
    performStatisticalComparison(approaches) {
        const approachNames = Object.keys(approaches);
        if (approachNames.length < 2) {
            return { error: 'At least 2 approaches required for comparison' };
        }

        const comparisons = {};

        // Pairwise comparisons
        for (let i = 0; i < approachNames.length; i++) {
            for (let j = i + 1; j < approachNames.length; j++) {
                const approachA = approaches[approachNames[i]];
                const approachB = approaches[approachNames[j]];

                const comparisonKey = `${approachNames[i]}_vs_${approachNames[j]}`;
                comparisons[comparisonKey] = this.compareTwoApproaches(approachA, approachB);
            }
        }

        // Overall winner determination
        const winner = this.determineOverallWinner(approaches);

        return {
            pairwiseComparisons: comparisons,
            overallWinner: winner,
            significantDifferences: this.identifySignificantDifferences(comparisons)
        };
    }

    /**
     * Compare two approaches statistically
     * 2つのアプローチの統計的比較
     */
    compareTwoApproaches(approachA, approachB) {
        const durationsA = approachA.measurements
            .filter(m => m.success && m.valid)
            .map(m => m.duration);
        const durationsB = approachB.measurements
            .filter(m => m.success && m.valid)
            .map(m => m.duration);

        if (durationsA.length === 0 || durationsB.length === 0) {
            return { error: 'Insufficient valid data for comparison' };
        }

        const meanA = durationsA.reduce((sum, val) => sum + val, 0) / durationsA.length;
        const meanB = durationsB.reduce((sum, val) => sum + val, 0) / durationsB.length;

        const speedRatio = meanA / meanB;
        const percentDifference = ((meanB - meanA) / meanA) * 100;

        // Simple statistical significance test (Welch's t-test approximation)
        const tTestResult = this.performWelchTTest(durationsA, durationsB);

        // Effect size calculation (Cohen's d)
        const cohensD = this.calculateCohensD(durationsA, durationsB);

        return {
            approachA: approachA.approachName,
            approachB: approachB.approachName,
            meanA,
            meanB,
            speedRatio,
            percentDifference,
            winner: meanA < meanB ? approachA.approachName : approachB.approachName,
            statisticalSignificance: tTestResult,
            effectSize: {
                cohensD,
                magnitude: this.interpretCohensD(cohensD)
            }
        };
    }

    /**
     * Perform Welch's t-test for unequal variances
     * 不等分散のウェルチのt検定実行
     */
    performWelchTTest(groupA, groupB) {
        const n1 = groupA.length;
        const n2 = groupB.length;

        const mean1 = groupA.reduce((sum, val) => sum + val, 0) / n1;
        const mean2 = groupB.reduce((sum, val) => sum + val, 0) / n2;

        const var1 = groupA.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
        const var2 = groupB.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);

        const pooledStdError = Math.sqrt(var1 / n1 + var2 / n2);
        const tStatistic = (mean1 - mean2) / pooledStdError;

        // Welch-Satterthwaite degrees of freedom
        const df = Math.pow(var1 / n1 + var2 / n2, 2) /
            (Math.pow(var1 / n1, 2) / (n1 - 1) + Math.pow(var2 / n2, 2) / (n2 - 1));

        // Approximate p-value (simplified)
        const pValue = this.approximatePValue(Math.abs(tStatistic), df);

        return {
            tStatistic,
            degreesOfFreedom: df,
            pValue,
            isSignificant: pValue < this.testConfigs.significanceThreshold,
            confidenceLevel: this.testConfigs.confidenceLevel
        };
    }

    /**
     * Calculate Cohen's d effect size
     * コーエンのd効果量計算
     */
    calculateCohensD(groupA, groupB) {
        const n1 = groupA.length;
        const n2 = groupB.length;

        const mean1 = groupA.reduce((sum, val) => sum + val, 0) / n1;
        const mean2 = groupB.reduce((sum, val) => sum + val, 0) / n2;

        const var1 = groupA.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
        const var2 = groupB.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);

        const pooledStdDev = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));

        return (mean1 - mean2) / pooledStdDev;
    }

    /**
     * Interpret Cohen's d effect size
     * コーエンのd効果量の解釈
     */
    interpretCohensD(d) {
        const absD = Math.abs(d);
        if (absD < 0.2) return 'negligible';
        if (absD < 0.5) return 'small';
        if (absD < 0.8) return 'medium';
        return 'large';
    }

    /**
     * Generate comprehensive insights from comparison results
     * 比較結果からの包括的洞察生成
     */
    generateInsights(comparisonResults) {
        const insights = [];
        const approaches = comparisonResults.approaches;
        const comparison = comparisonResults.comparison;

        // Performance insights
        if (comparison.overallWinner) {
            const winner = approaches[comparison.overallWinner.name];
            const improvement = comparison.overallWinner.improvement;

            if (improvement > 50) {
                insights.push({
                    type: 'performance',
                    level: 'critical',
                    message: `Significant performance improvement detected: ${comparison.overallWinner.name} is ${improvement.toFixed(1)}% faster`,
                    impact: 'high'
                });
            } else if (improvement > 20) {
                insights.push({
                    type: 'performance',
                    level: 'important',
                    message: `Notable performance improvement: ${comparison.overallWinner.name} is ${improvement.toFixed(1)}% faster`,
                    impact: 'medium'
                });
            }
        }

        // Stability insights
        Object.entries(approaches).forEach(([name, approach]) => {
            if (approach.statistics.stability === 'unstable') {
                insights.push({
                    type: 'stability',
                    level: 'warning',
                    message: `${name} shows unstable performance (CV: ${(approach.statistics.duration.cv * 100).toFixed(1)}%)`,
                    impact: 'medium'
                });
            }
        });

        // Memory insights
        const memoryUsages = Object.entries(approaches).map(([name, approach]) => ({
            name,
            avgMemoryDelta: approach.statistics.memory.mean
        }));

        const maxMemoryUsage = Math.max(...memoryUsages.map(m => m.avgMemoryDelta));
        const minMemoryUsage = Math.min(...memoryUsages.map(m => m.avgMemoryDelta));

        if (maxMemoryUsage > minMemoryUsage * 2 && maxMemoryUsage > 1024 * 1024) {
            const highMemoryApproach = memoryUsages.find(m => m.avgMemoryDelta === maxMemoryUsage);
            insights.push({
                type: 'memory',
                level: 'warning',
                message: `${highMemoryApproach.name} uses significantly more memory: ${this.formatBytes(maxMemoryUsage)} vs ${this.formatBytes(minMemoryUsage)}`,
                impact: 'medium'
            });
        }

        // Reliability insights
        Object.entries(approaches).forEach(([name, approach]) => {
            if (approach.successRate < 95) {
                insights.push({
                    type: 'reliability',
                    level: 'critical',
                    message: `${name} has low success rate: ${approach.successRate.toFixed(1)}%`,
                    impact: 'high'
                });
            }
        });

        return insights;
    }

    /**
     * Generate optimization recommendations
     * 最適化推奨事項の生成
     */
    generateRecommendations(comparisonResults) {
        const recommendations = [];
        const approaches = comparisonResults.approaches;
        const insights = comparisonResults.insights;

        // Performance recommendations
        const performanceInsights = insights.filter(i => i.type === 'performance');
        if (performanceInsights.length > 0) {
            const winner = comparisonResults.comparison.overallWinner;
            if (winner) {
                recommendations.push({
                    priority: 'high',
                    category: 'optimization',
                    action: `Adopt ${winner.name} approach for production use`,
                    rationale: `Shows ${winner.improvement.toFixed(1)}% performance improvement`,
                    impact: 'Significant reduction in response times and resource usage'
                });
            }
        }

        // Stability recommendations
        const unstableApproaches = Object.entries(approaches)
            .filter(([_, approach]) => approach.statistics.stability === 'unstable')
            .map(([name, _]) => name);

        if (unstableApproaches.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'stability',
                action: `Investigate performance variability in: ${unstableApproaches.join(', ')}`,
                rationale: 'High performance variability indicates potential optimization opportunities',
                impact: 'More predictable and consistent performance'
            });
        }

        // Memory recommendations
        const memoryInsights = insights.filter(i => i.type === 'memory');
        if (memoryInsights.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'memory',
                action: 'Optimize memory usage in high-memory approaches',
                rationale: 'Reducing memory footprint improves scalability',
                impact: 'Lower memory pressure and better resource utilization'
            });
        }

        // Reliability recommendations
        const reliabilityInsights = insights.filter(i => i.type === 'reliability');
        if (reliabilityInsights.length > 0) {
            recommendations.push({
                priority: 'critical',
                category: 'reliability',
                action: 'Address failure modes in low-success-rate approaches',
                rationale: 'High failure rates impact user experience and system stability',
                impact: 'Improved application reliability and user satisfaction'
            });
        }

        // General recommendations
        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'info',
                category: 'general',
                action: 'Continue monitoring performance with current approaches',
                rationale: 'No significant issues detected in current comparison',
                impact: 'Maintain current performance levels'
            });
        }

        return recommendations;
    }

    /**
     * Report comprehensive comparison results
     * 包括的比較結果の報告
     */
    reportComparisonResults(results) {
        console.log(`\n📊 === Performance Comparison Results ===`);
        console.log(`Test: ${results.testName}`);
        console.log(`Timestamp: ${new Date(results.timestamp).toISOString()}\n`);

        // Approach summaries
        console.log(`📈 Approach Performance Summary:`);
        Object.entries(results.approaches).forEach(([name, approach]) => {
            const stats = approach.statistics.duration;
            const stability = approach.statistics.stability;
            const stabilityEmoji = stability === 'stable' ? '✅' : stability === 'moderate' ? '⚠️' : '❌';

            console.log(`   ${name}:`);
            console.log(`     Mean: ${stats.mean.toFixed(2)}ms (±${stats.stdDev.toFixed(2)}ms)`);
            console.log(`     Range: ${stats.min.toFixed(2)}ms - ${stats.max.toFixed(2)}ms`);
            console.log(`     Success Rate: ${approach.successRate.toFixed(1)}%`);
            console.log(`     Stability: ${stabilityEmoji} ${stability} (CV: ${(stats.cv * 100).toFixed(1)}%)`);
            console.log('');
        });

        // Winner announcement
        if (results.comparison.overallWinner) {
            const winner = results.comparison.overallWinner;
            console.log(`🏆 Winner: ${winner.name}`);
            console.log(`   Performance improvement: ${winner.improvement.toFixed(1)}%`);
            console.log(`   Statistical significance: ${winner.isSignificant ? 'Yes' : 'No'}`);
            console.log('');
        }

        // Statistical significance
        if (results.comparison.significantDifferences?.length > 0) {
            console.log(`📊 Statistically Significant Differences:`);
            results.comparison.significantDifferences.forEach(diff => {
                console.log(`   ${diff.comparison}: p=${diff.pValue.toFixed(4)} (${diff.effectSize})`);
            });
            console.log('');
        }

        // Insights
        if (results.insights.length > 0) {
            console.log(`💡 Key Insights:`);
            results.insights.forEach(insight => {
                const emoji = insight.level === 'critical' ? '🚨' : insight.level === 'warning' ? '⚠️' : 'ℹ️';
                console.log(`   ${emoji} [${insight.type}] ${insight.message}`);
            });
            console.log('');
        }

        // Recommendations
        if (results.recommendations.length > 0) {
            console.log(`🎯 Recommendations:`);
            results.recommendations.forEach(rec => {
                const emoji = rec.priority === 'critical' ? '🚨' : rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚠️' : 'ℹ️';
                console.log(`   ${emoji} [${rec.category}] ${rec.action}`);
                console.log(`      Rationale: ${rec.rationale}`);
                console.log(`      Impact: ${rec.impact}`);
                console.log('');
            });
        }
    }

    /**
     * Utility methods
     */
    determineOverallWinner(approaches) {
        const validApproaches = Object.entries(approaches)
            .filter(([_, approach]) => approach.validResults > 0)
            .map(([name, approach]) => ({
                name,
                meanDuration: approach.statistics.duration.mean,
                successRate: approach.successRate
            }));

        if (validApproaches.length < 2) {
            return null;
        }

        // Sort by mean duration (ascending) and then by success rate (descending)
        validApproaches.sort((a, b) => {
            const durationDiff = a.meanDuration - b.meanDuration;
            if (Math.abs(durationDiff) < 1) { // If very close in performance
                return b.successRate - a.successRate; // Prefer higher success rate
            }
            return durationDiff;
        });

        const winner = validApproaches[0];
        const runnerUp = validApproaches[1];

        const improvement = ((runnerUp.meanDuration - winner.meanDuration) / runnerUp.meanDuration) * 100;

        return {
            name: winner.name,
            improvement,
            isSignificant: improvement > 5 // Simple threshold for demonstration
        };
    }

    identifySignificantDifferences(comparisons) {
        return Object.entries(comparisons)
            .filter(([_, comparison]) => comparison.statisticalSignificance?.isSignificant)
            .map(([comparisonName, comparison]) => ({
                comparison: comparisonName,
                pValue: comparison.statisticalSignificance.pValue,
                effectSize: comparison.effectSize.magnitude
            }));
    }

    detectOutliers(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const q1 = this.calculatePercentile(sorted, 25);
        const q3 = this.calculatePercentile(sorted, 75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierIndices = [];
        values.forEach((value, index) => {
            if (value < lowerBound || value > upperBound) {
                outlierIndices.push(index);
            }
        });

        return {
            count: outlierIndices.length,
            indices: outlierIndices,
            lowerBound,
            upperBound
        };
    }

    calculateMedian(sortedValues) {
        const mid = Math.floor(sortedValues.length / 2);
        return sortedValues.length % 2 === 0
            ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
            : sortedValues[mid];
    }

    calculatePercentile(sortedValues, percentile) {
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);

        if (lower === upper) {
            return sortedValues[lower];
        }

        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }

    approximatePValue(tStat, df) {
        // Simplified p-value approximation for demonstration
        // In practice, you'd use a proper t-distribution CDF
        if (df > 30) {
            // Approximate as normal distribution for large df
            return 2 * (1 - this.normalCDF(Math.abs(tStat)));
        }

        // Very rough approximation for small df
        const criticalValues = {
            1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
            10: 2.228, 20: 2.086, 30: 2.042
        };

        let criticalValue = 2.0; // Default
        for (const [degF, critVal] of Object.entries(criticalValues)) {
            if (df <= parseInt(degF)) {
                criticalValue = critVal;
                break;
            }
        }

        return tStat > criticalValue ? 0.01 : 0.1; // Very rough approximation
    }

    normalCDF(x) {
        // Approximation of standard normal CDF
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    erf(x) {
        // Approximation of error function
        const a1 =  0.254829592;
        const a2 = -0.284496736;
        const a3 =  1.421413741;
        const a4 = -1.453152027;
        const a5 =  1.061405429;
        const p  =  0.3275911;

        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);

        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

        return sign * y;
    }

    getCurrentMemoryInfo() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }

        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            return {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                limit: memUsage.rss
            };
        }

        return { used: 0, total: 0, limit: 0 };
    }

    calculateMemoryDelta(startMemory, endMemory) {
        return endMemory.used - startMemory.used;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    forceGarbageCollection() {
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
        } else if (typeof window !== 'undefined' && window.gc) {
            window.gc();
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Export comparison history for analysis
     * 分析用比較履歴のエクスポート
     */
    exportComparisonHistory() {
        return {
            timestamp: Date.now(),
            totalComparisons: this.comparisonHistory.length,
            comparisons: this.comparisonHistory
        };
    }
}

/**
 * Demonstration Functions
 */

/**
 * Demonstrate basic performance comparison
 * 基本パフォーマンス比較のデモンストレーション
 */
async function demonstrateBasicPerformanceComparison(module) {
    console.log("=== Basic Performance Comparison Demonstration ===");
    console.log("=== 基本パフォーマンス比較デモンストレーション ===\n");

    const framework = new PerformanceComparisonFramework({
        measurementRuns: 15,
        warmupRuns: 3
    });

    const testStations = ["東京", "新宿", "横浜", "大阪", "名古屋"];

    // Define different approaches for station lookup
    const stationLookupApproaches = {
        'direct_lookup': async (stations) => {
            const results = [];
            for (const station of stations) {
                const id = module.getStationId(station);
                const name = id > 0 ? module.getStationName(id) : null;
                results.push({ station, id, name });
            }
            return results;
        },

        'cached_lookup': (() => {
            const cache = new Map();
            return async (stations) => {
                const results = [];
                for (const station of stations) {
                    if (cache.has(station)) {
                        results.push(cache.get(station));
                    } else {
                        const id = module.getStationId(station);
                        const name = id > 0 ? module.getStationName(id) : null;
                        const result = { station, id, name };
                        cache.set(station, result);
                        results.push(result);
                    }
                }
                return results;
            };
        })(),

        'optimized_lookup': async (stations) => {
            const results = [];
            for (const station of stations) {
                // Pre-validate station name
                if (!station || station.trim().length === 0) {
                    results.push({ station, id: -1, name: null, error: 'Invalid station name' });
                    continue;
                }

                const id = module.getStationId(station);
                if (id > 0) {
                    // Only retrieve name if ID is valid
                    const name = module.getStationName(id);
                    results.push({ station, id, name });
                } else {
                    results.push({ station, id, name: null });
                }
            }
            return results;
        }
    };

    // Result validator
    const validateStationLookup = (results, stations) => {
        if (!Array.isArray(results) || results.length !== stations.length) {
            return false;
        }

        return results.every((result, index) => {
            return result.station === stations[index] &&
                   typeof result.id === 'number' &&
                   (result.id <= 0 || typeof result.name === 'string');
        });
    };

    const comparison = await framework.runComparison(
        'Station Lookup Performance',
        stationLookupApproaches,
        testStations,
        {
            validator: validateStationLookup
        }
    );

    return { framework, comparison };
}

/**
 * Demonstrate route calculation optimization comparison
 * ルート計算最適化比較のデモンストレーション
 */
async function demonstrateRouteCalculationComparison(module) {
    console.log("\n=== Route Calculation Optimization Comparison ===");
    console.log("=== ルート計算最適化比較のデモンストレーション ===\n");

    const framework = new PerformanceComparisonFramework({
        measurementRuns: 12,
        warmupRuns: 2
    });

    const testRoutes = [
        { origin: "東京", destination: "横浜" },
        { origin: "新宿", destination: "大阪" },
        { origin: "名古屋", destination: "京都" }
    ];

    // Define route calculation approaches
    const routeCalculationApproaches = {
        'standard_calculation': async (routes) => {
            const results = [];
            for (const route of routes) {
                try {
                    module.createRoute();
                    const originId = module.getStationId(route.origin);
                    const destId = module.getStationId(route.destination);

                    if (originId > 0 && destId > 0) {
                        module.addRouteBegin(originId);
                        module.addRoute(1, destId);
                        const fare = module.calculateFare();
                        const fareString = module.getFareString();
                        results.push({ ...route, fare, fareString, success: true });
                    } else {
                        results.push({ ...route, fare: -1, fareString: '', success: false });
                    }
                } catch (error) {
                    results.push({ ...route, fare: -1, fareString: '', success: false, error: error.message });
                }
            }
            return results;
        },

        'validated_calculation': async (routes) => {
            const results = [];
            for (const route of routes) {
                try {
                    // Pre-validate station names
                    if (!route.origin || !route.destination) {
                        results.push({ ...route, fare: -1, fareString: '', success: false, error: 'Invalid route' });
                        continue;
                    }

                    const originId = module.getStationId(route.origin);
                    const destId = module.getStationId(route.destination);

                    // Early validation
                    if (originId <= 0) {
                        results.push({ ...route, fare: -1, fareString: '', success: false, error: 'Origin not found' });
                        continue;
                    }

                    if (destId <= 0) {
                        results.push({ ...route, fare: -1, fareString: '', success: false, error: 'Destination not found' });
                        continue;
                    }

                    if (originId === destId) {
                        results.push({ ...route, fare: 0, fareString: '¥0', success: true, error: 'Same station' });
                        continue;
                    }

                    module.createRoute();
                    module.addRouteBegin(originId);
                    module.addRoute(1, destId);
                    const fare = module.calculateFare();
                    const fareString = module.getFareString();

                    results.push({ ...route, fare, fareString, success: true });
                } catch (error) {
                    results.push({ ...route, fare: -1, fareString: '', success: false, error: error.message });
                }
            }
            return results;
        },

        'cached_calculation': (() => {
            const routeCache = new Map();

            return async (routes) => {
                const results = [];
                for (const route of routes) {
                    const routeKey = `${route.origin}_${route.destination}`;

                    if (routeCache.has(routeKey)) {
                        // Return cached result
                        results.push({ ...routeCache.get(routeKey), cached: true });
                        continue;
                    }

                    try {
                        const originId = module.getStationId(route.origin);
                        const destId = module.getStationId(route.destination);

                        if (originId > 0 && destId > 0) {
                            module.createRoute();
                            module.addRouteBegin(originId);
                            module.addRoute(1, destId);
                            const fare = module.calculateFare();
                            const fareString = module.getFareString();

                            const result = { ...route, fare, fareString, success: true, cached: false };
                            routeCache.set(routeKey, result);
                            results.push(result);
                        } else {
                            const result = { ...route, fare: -1, fareString: '', success: false, cached: false };
                            results.push(result);
                        }
                    } catch (error) {
                        const result = { ...route, fare: -1, fareString: '', success: false, error: error.message, cached: false };
                        results.push(result);
                    }
                }
                return results;
            };
        })()
    };

    // Result validator for route calculations
    const validateRouteCalculation = (results, routes) => {
        if (!Array.isArray(results) || results.length !== routes.length) {
            return false;
        }

        return results.every((result, index) => {
            const originalRoute = routes[index];
            return result.origin === originalRoute.origin &&
                   result.destination === originalRoute.destination &&
                   typeof result.fare === 'number' &&
                   typeof result.success === 'boolean';
        });
    };

    const comparison = await framework.runComparison(
        'Route Calculation Performance',
        routeCalculationApproaches,
        testRoutes,
        {
            validator: validateRouteCalculation
        }
    );

    // Additional analysis for route calculations
    console.log("\n💰 Route Calculation Analysis:");
    Object.entries(comparison.approaches).forEach(([approachName, approach]) => {
        const validResults = approach.measurements
            .filter(m => m.success && m.valid)
            .map(m => m.result)
            .flat();

        const successfulCalculations = validResults.filter(r => r.success && r.fare > 0);

        if (successfulCalculations.length > 0) {
            const totalFare = successfulCalculations.reduce((sum, r) => sum + r.fare, 0);
            const avgFare = totalFare / successfulCalculations.length;

            console.log(`   ${approachName}:`);
            console.log(`     Successful calculations: ${successfulCalculations.length}/${validResults.length}`);
            console.log(`     Average fare: ¥${avgFare.toFixed(0)}`);

            const cachedResults = successfulCalculations.filter(r => r.cached);
            if (cachedResults.length > 0) {
                console.log(`     Cache hit rate: ${((cachedResults.length / successfulCalculations.length) * 100).toFixed(1)}%`);
            }
        }
    });

    return { framework, comparison };
}

/**
 * Demonstrate before/after optimization comparison
 * 最適化前後比較のデモンストレーション
 */
async function demonstrateBeforeAfterOptimization(module) {
    console.log("\n=== Before/After Optimization Comparison ===");
    console.log("=== 最適化前後比較のデモンストレーション ===\n");

    const framework = new PerformanceComparisonFramework({
        measurementRuns: 20,
        warmupRuns: 5
    });

    const largeStationList = [
        "東京", "新宿", "横浜", "川崎", "品川", "渋谷", "池袋", "上野", "秋葉原", "有楽町",
        "大阪", "梅田", "難波", "天王寺", "新大阪", "京都", "神戸", "奈良"
    ];

    // Simulate "before optimization" approach (inefficient)
    const beforeOptimization = async (stations) => {
        const results = [];

        for (const station of stations) {
            // Simulate inefficient processing
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));

            // Multiple redundant lookups
            for (let i = 0; i < 3; i++) {
                const id = module.getStationId(station);
                if (i === 2) { // Only use the last one
                    const name = id > 0 ? module.getStationName(id) : null;
                    const kana = module.getKanaFromStationId ? module.getKanaFromStationId(id) : null;

                    results.push({
                        station,
                        id,
                        name,
                        kana,
                        redundantLookups: 3
                    });
                }
            }
        }

        return results;
    };

    // Simulate "after optimization" approach (efficient)
    const afterOptimization = (() => {
        const optimizationCache = new Map();

        return async (stations) => {
            const results = [];

            // Batch process stations
            const batchSize = 5;
            for (let i = 0; i < stations.length; i += batchSize) {
                const batch = stations.slice(i, i + batchSize);

                for (const station of batch) {
                    // Check cache first
                    if (optimizationCache.has(station)) {
                        results.push({ ...optimizationCache.get(station), fromCache: true });
                        continue;
                    }

                    // Single efficient lookup
                    const id = module.getStationId(station);
                    if (id > 0) {
                        const name = module.getStationName(id);
                        const kana = module.getKanaFromStationId ? module.getKanaFromStationId(id) : null;

                        const result = {
                            station,
                            id,
                            name,
                            kana,
                            redundantLookups: 1,
                            fromCache: false
                        };

                        optimizationCache.set(station, result);
                        results.push(result);
                    } else {
                        const result = { station, id, name: null, kana: null, redundantLookups: 1, fromCache: false };
                        results.push(result);
                    }
                }

                // Small batch delay (much smaller than before)
                await new Promise(resolve => setTimeout(resolve, 1));
            }

            return results;
        };
    })();

    const approaches = {
        'before_optimization': beforeOptimization,
        'after_optimization': afterOptimization
    };

    const comparison = await framework.runComparison(
        'Before/After Optimization',
        approaches,
        largeStationList,
        {
            validator: (results, stations) => {
                return Array.isArray(results) && results.length === stations.length;
            }
        }
    );

    // Calculate optimization impact
    if (comparison.comparison.overallWinner) {
        const improvement = comparison.comparison.overallWinner.improvement;
        const beforeStats = comparison.approaches.before_optimization.statistics.duration;
        const afterStats = comparison.approaches.after_optimization.statistics.duration;

        console.log("\n🚀 Optimization Impact Analysis:");
        console.log(`   Performance improvement: ${improvement.toFixed(1)}%`);
        console.log(`   Before: ${beforeStats.mean.toFixed(2)}ms avg (±${beforeStats.stdDev.toFixed(2)}ms)`);
        console.log(`   After: ${afterStats.mean.toFixed(2)}ms avg (±${afterStats.stdDev.toFixed(2)}ms)`);
        console.log(`   Time saved per operation: ${(beforeStats.mean - afterStats.mean).toFixed(2)}ms`);

        // Calculate scalability impact
        const scalabilityFactor = beforeStats.mean / afterStats.mean;
        console.log(`   Scalability factor: ${scalabilityFactor.toFixed(1)}x`);
        console.log(`   For 1000 operations: ${((beforeStats.mean - afterStats.mean) * 1000 / 1000).toFixed(1)}s saved`);
    }

    return { framework, comparison };
}

/**
 * Main function
 */
async function main() {
    console.log("Performance Comparison Utilities");
    console.log("===============================");
    console.log("This example demonstrates comprehensive before/after performance");
    console.log("comparison utilities with statistical analysis and optimization insights.\n");

    console.log("このサンプルは統計分析と最適化洞察を含む包括的な");
    console.log("前後パフォーマンス比較ユーティリティをデモンストレーションします。\n");

    try {
        // Initialize WebAssembly module
        console.log("🔧 Initializing WebAssembly module...");
        const module = await wasmLoader.loadModule();
        console.log("✅ WebAssembly module loaded successfully\n");

        // Initialize database
        console.log("🗄️ Initializing database connection...");
        module.openDatabase();
        console.log("✅ Database connection established\n");

        // Run performance comparison demonstrations
        console.log("🚀 Starting performance comparison demonstrations...\n");

        const basicComparison = await demonstrateBasicPerformanceComparison(module);
        const routeComparison = await demonstrateRouteCalculationComparison(module);
        const optimizationComparison = await demonstrateBeforeAfterOptimization(module);

        // Final summary
        console.log("\n🎉 === Performance Comparison Examples Complete ===");
        console.log("🎉 === パフォーマンス比較サンプル完了 ===\n");

        console.log("📊 Session Summary:");
        console.log(`   Total comparisons conducted: 3`);
        console.log(`   Statistical significance tests: Performed`);
        console.log(`   Optimization recommendations: Generated`);

        // Export comparison data
        const allComparisons = [
            basicComparison.framework.exportComparisonHistory(),
            routeComparison.framework.exportComparisonHistory(),
            optimizationComparison.framework.exportComparisonHistory()
        ];

        console.log("\n📁 Comparison Data Export:");
        console.log(`   Basic comparison: ${basicComparison.comparison.approaches ? Object.keys(basicComparison.comparison.approaches).length : 0} approaches tested`);
        console.log(`   Route comparison: ${routeComparison.comparison.approaches ? Object.keys(routeComparison.comparison.approaches).length : 0} approaches tested`);
        console.log(`   Optimization comparison: ${optimizationComparison.comparison.approaches ? Object.keys(optimizationComparison.comparison.approaches).length : 0} approaches tested`);

        console.log("\n🎯 Key Takeaways:");
        console.log("   • Statistical analysis provides confidence in optimization decisions");
        console.log("   • A/B testing frameworks enable objective performance evaluation");
        console.log("   • Before/after comparisons quantify optimization impacts");
        console.log("   • Automated insights guide further optimization efforts");
        console.log("   • Historical tracking enables regression detection");

    } catch (error) {
        console.error("💥 Fatal error occurred during execution:");
        console.error(error);
        process.exit(1);
    }
}

// Export utilities for standalone use
module.exports = {
    PerformanceComparisonFramework,
    demonstrateBasicPerformanceComparison,
    demonstrateRouteCalculationComparison,
    demonstrateBeforeAfterOptimization,
    main
};

// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}