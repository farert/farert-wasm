/**
 * Performance Optimization and Benchmarking Examples
 * パフォーマンス最適化とベンチマークサンプル
 *
 * This comprehensive example demonstrates performance optimization techniques, memory management
 * patterns, and benchmarking utilities for the Farert WebAssembly API.
 *
 * このサンプルはFarert WebAssembly APIのパフォーマンス最適化技術、メモリ管理パターン、
 * ベンチマークユーティリティを包括的にデモンストレーションします。
 *
 * Features:
 * - Performance monitoring and timing utilities
 * - Memory usage tracking and leak detection
 * - Cache efficiency optimization strategies
 * - Batch processing with progress indicators
 * - Before/after performance comparisons
 * - WebAssembly memory management best practices
 * - Route calculation optimization patterns
 *
 * Execution / 実行方法:
 * node examples/api/performance/performance-optimization.js
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

/**
 * Performance Monitoring Utilities
 * パフォーマンス監視ユーティリティ
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.memoryHistory = [];
        this.operationCount = 0;
        this.startTime = Date.now();
        this.lastMemoryCheck = Date.now();

        // Initialize memory monitoring if available
        if (typeof performance !== 'undefined' && performance.memory) {
            this.memorySupported = true;
        } else {
            this.memorySupported = false;
            console.warn('⚠️ Performance.memory API not available - memory tracking limited');
        }
    }

    /**
     * Start timing an operation
     * 操作のタイミング開始
     */
    startTiming(operationName) {
        const timing = {
            name: operationName,
            startTime: Date.now(),
            startMemory: this.getCurrentMemory(),
            id: Math.random().toString(36).substr(2, 9)
        };

        this.metrics.set(timing.id, timing);
        return timing.id;
    }

    /**
     * End timing an operation and record results
     * 操作のタイミング終了と結果記録
     */
    endTiming(timingId, metadata = {}) {
        const timing = this.metrics.get(timingId);
        if (!timing) {
            console.warn(`⚠️ No timing found for ID: ${timingId}`);
            return null;
        }

        const endTime = Date.now();
        const endMemory = this.getCurrentMemory();

        const result = {
            ...timing,
            endTime,
            duration: endTime - timing.startTime,
            endMemory,
            memoryDelta: endMemory - timing.startMemory,
            metadata,
            operationIndex: ++this.operationCount
        };

        // Store result and clean up active timing
        this.metrics.set(timingId, result);

        return result;
    }

    /**
     * Get current memory usage
     * 現在のメモリ使用量取得
     */
    getCurrentMemory() {
        if (this.memorySupported) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }

        // Fallback for environments without performance.memory
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            return {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                limit: memUsage.rss,
                external: memUsage.external
            };
        }

        return { used: 0, total: 0, limit: 0 };
    }

    /**
     * Record memory snapshot for leak detection
     * メモリリーク検出用のスナップショット記録
     */
    recordMemorySnapshot(label = '') {
        const memory = this.getCurrentMemory();
        const snapshot = {
            timestamp: Date.now(),
            label,
            memory,
            operationCount: this.operationCount
        };

        this.memoryHistory.push(snapshot);

        // Keep only recent history (last 100 snapshots)
        if (this.memoryHistory.length > 100) {
            this.memoryHistory.shift();
        }

        return snapshot;
    }

    /**
     * Analyze memory growth patterns
     * メモリ増加パターンの分析
     */
    analyzeMemoryTrends() {
        if (this.memoryHistory.length < 2) {
            return {
                trend: 'insufficient_data',
                growthRate: 0,
                predictions: []
            };
        }

        const recent = this.memoryHistory.slice(-10);
        const oldest = recent[0];
        const newest = recent[recent.length - 1];

        const timeSpan = newest.timestamp - oldest.timestamp;
        const memoryGrowth = newest.memory.used - oldest.memory.used;
        const growthRate = timeSpan > 0 ? (memoryGrowth / timeSpan) * 1000 : 0; // bytes per second

        let trend = 'stable';
        if (growthRate > 1024) { // 1KB/s
            trend = 'growing';
        } else if (growthRate < -1024) {
            trend = 'decreasing';
        }

        const analysis = {
            trend,
            growthRate,
            totalGrowth: memoryGrowth,
            timeSpan,
            sampleCount: recent.length,
            predictions: this.generateMemoryPredictions(growthRate, newest.memory)
        };

        return analysis;
    }

    /**
     * Generate memory usage predictions
     * メモリ使用量予測の生成
     */
    generateMemoryPredictions(growthRate, currentMemory) {
        const predictions = [];
        const timeIntervals = [60, 300, 600, 1800]; // 1min, 5min, 10min, 30min

        for (const interval of timeIntervals) {
            const predictedGrowth = growthRate * interval;
            const predictedUsage = currentMemory.used + predictedGrowth;
            const utilizationPercent = (predictedUsage / currentMemory.limit) * 100;

            predictions.push({
                timeInterval: interval,
                predictedUsage,
                utilizationPercent,
                warning: utilizationPercent > 80,
                critical: utilizationPercent > 95
            });
        }

        return predictions;
    }

    /**
     * Get comprehensive performance summary
     * 包括的パフォーマンス要約の取得
     */
    getSummary() {
        const allTimings = Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
        const memoryAnalysis = this.analyzeMemoryTrends();

        if (allTimings.length === 0) {
            return {
                operationCount: 0,
                totalTime: 0,
                averageTime: 0,
                memoryAnalysis,
                recommendations: ['No operations have been timed yet']
            };
        }

        const totalTime = allTimings.reduce((sum, t) => sum + t.duration, 0);
        const averageTime = totalTime / allTimings.length;
        const fastestOperation = allTimings.reduce((min, t) => t.duration < min.duration ? t : min);
        const slowestOperation = allTimings.reduce((max, t) => t.duration > max.duration ? t : max);

        // Group operations by name for analysis
        const operationGroups = allTimings.reduce((groups, timing) => {
            if (!groups[timing.name]) {
                groups[timing.name] = [];
            }
            groups[timing.name].push(timing);
            return groups;
        }, {});

        const operationSummary = Object.entries(operationGroups).map(([name, timings]) => {
            const avgDuration = timings.reduce((sum, t) => sum + t.duration, 0) / timings.length;
            const totalMemoryDelta = timings.reduce((sum, t) => sum + (t.memoryDelta?.used || 0), 0);

            return {
                name,
                count: timings.length,
                averageDuration: avgDuration,
                totalDuration: timings.reduce((sum, t) => sum + t.duration, 0),
                totalMemoryDelta,
                averageMemoryDelta: totalMemoryDelta / timings.length
            };
        });

        const recommendations = this.generateOptimizationRecommendations(operationSummary, memoryAnalysis);

        return {
            operationCount: allTimings.length,
            totalTime,
            averageTime,
            fastestOperation,
            slowestOperation,
            operationSummary,
            memoryAnalysis,
            sessionDuration: Date.now() - this.startTime,
            recommendations
        };
    }

    /**
     * Generate optimization recommendations
     * 最適化推奨事項の生成
     */
    generateOptimizationRecommendations(operationSummary, memoryAnalysis) {
        const recommendations = [];

        // Performance recommendations
        const slowOperations = operationSummary.filter(op => op.averageDuration > 100);
        if (slowOperations.length > 0) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                issue: `Slow operations detected: ${slowOperations.map(op => op.name).join(', ')}`,
                suggestion: 'Consider caching results, optimizing algorithms, or using batch processing'
            });
        }

        // Memory recommendations
        if (memoryAnalysis.trend === 'growing' && memoryAnalysis.growthRate > 1024) {
            recommendations.push({
                type: 'memory',
                priority: 'critical',
                issue: `Memory growth detected: ${(memoryAnalysis.growthRate / 1024).toFixed(2)} KB/s`,
                suggestion: 'Review object lifecycle management, implement cleanup routines, check for memory leaks'
            });
        }

        const highMemoryOperations = operationSummary.filter(op => op.averageMemoryDelta > 1024 * 1024); // 1MB
        if (highMemoryOperations.length > 0) {
            recommendations.push({
                type: 'memory',
                priority: 'medium',
                issue: `High memory usage operations: ${highMemoryOperations.map(op => op.name).join(', ')}`,
                suggestion: 'Optimize memory usage, implement object pooling, or process data in smaller chunks'
            });
        }

        // Frequency recommendations
        const frequentOperations = operationSummary.filter(op => op.count > 10);
        if (frequentOperations.length > 0) {
            recommendations.push({
                type: 'caching',
                priority: 'medium',
                issue: `Frequently called operations: ${frequentOperations.map(op => `${op.name} (${op.count}x)`).join(', ')}`,
                suggestion: 'Implement caching strategies to reduce redundant calculations'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                type: 'success',
                priority: 'info',
                issue: 'No significant performance issues detected',
                suggestion: 'Performance appears to be within acceptable ranges'
            });
        }

        return recommendations;
    }

    /**
     * Export performance data for analysis
     * 分析用パフォーマンスデータのエクスポート
     */
    exportData() {
        return {
            startTime: this.startTime,
            endTime: Date.now(),
            metrics: Array.from(this.metrics.values()),
            memoryHistory: this.memoryHistory,
            summary: this.getSummary()
        };
    }
}

/**
 * Memory Management Utilities
 * メモリ管理ユーティリティ
 */
class MemoryManager {
    constructor() {
        this.activeObjects = new Set();
        this.cleanupCallbacks = [];
        this.gcForced = false;
    }

    /**
     * Register an object for cleanup tracking
     * クリーンアップ追跡用オブジェクトの登録
     */
    registerObject(obj, cleanupCallback) {
        const id = Math.random().toString(36).substr(2, 9);
        this.activeObjects.add({ id, obj, cleanupCallback, createdAt: Date.now() });
        return id;
    }

    /**
     * Force garbage collection if available
     * ガベージコレクションの強制実行（利用可能な場合）
     */
    forceGarbageCollection() {
        if (typeof global !== 'undefined' && global.gc) {
            console.log('🗑️ Forcing garbage collection...');
            global.gc();
            this.gcForced = true;
            return true;
        } else if (typeof window !== 'undefined' && window.gc) {
            console.log('🗑️ Forcing garbage collection...');
            window.gc();
            this.gcForced = true;
            return true;
        } else {
            console.log('ℹ️ Garbage collection not available (run with --expose-gc flag)');
            return false;
        }
    }

    /**
     * Clean up all tracked objects
     * 追跡されているオブジェクトの全クリーンアップ
     */
    cleanup() {
        console.log(`🧹 Cleaning up ${this.activeObjects.size} tracked objects...`);

        for (const objInfo of this.activeObjects) {
            try {
                if (objInfo.cleanupCallback) {
                    objInfo.cleanupCallback();
                }
            } catch (error) {
                console.warn(`⚠️ Cleanup error for object ${objInfo.id}:`, error.message);
            }
        }

        this.activeObjects.clear();

        // Run additional cleanup callbacks
        for (const callback of this.cleanupCallbacks) {
            try {
                callback();
            } catch (error) {
                console.warn(`⚠️ Cleanup callback error:`, error.message);
            }
        }

        // Force garbage collection after cleanup
        this.forceGarbageCollection();
    }

    /**
     * Add a cleanup callback
     * クリーンアップコールバックの追加
     */
    addCleanupCallback(callback) {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Get memory statistics
     * メモリ統計の取得
     */
    getMemoryStats() {
        const current = this.getCurrentMemory();
        return {
            activeObjects: this.activeObjects.size,
            memoryUsage: current,
            gcForced: this.gcForced,
            utilizationPercent: current.total > 0 ? (current.used / current.total) * 100 : 0
        };
    }

    getCurrentMemory() {
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
}

/**
 * Batch Processing Utilities with Progress Tracking
 * 進捗追跡付きバッチ処理ユーティリティ
 */
class BatchProcessor {
    constructor(batchSize = 100) {
        this.batchSize = batchSize;
        this.progressCallbacks = [];
    }

    /**
     * Process items in batches with progress reporting
     * 進捗報告付きのバッチ処理
     */
    async processBatch(items, processor, options = {}) {
        const {
            batchSize = this.batchSize,
            delayBetweenBatches = 10,
            memoryThreshold = 0.8,
            progressCallback = null
        } = options;

        const totalItems = items.length;
        const totalBatches = Math.ceil(totalItems / batchSize);
        const results = [];
        let processedItems = 0;

        console.log(`📦 Starting batch processing: ${totalItems} items in ${totalBatches} batches`);
        console.log(`📦 バッチ処理開始: ${totalItems}項目を${totalBatches}バッチで処理`);

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            const batchStart = batchIndex * batchSize;
            const batchEnd = Math.min(batchStart + batchSize, totalItems);
            const batch = items.slice(batchStart, batchEnd);

            console.log(`\n🔄 Processing batch ${batchIndex + 1}/${totalBatches} (items ${batchStart + 1}-${batchEnd})`);

            const batchStartTime = Date.now();

            try {
                // Process current batch
                const batchResults = await this.processBatchItems(batch, processor);
                results.push(...batchResults);
                processedItems += batch.length;

                const batchDuration = Date.now() - batchStartTime;
                const progressPercent = (processedItems / totalItems) * 100;

                // Memory check
                const memoryStats = this.getMemoryStats();
                const memoryUsage = memoryStats.utilizationPercent;

                console.log(`✅ Batch ${batchIndex + 1} completed in ${batchDuration}ms`);
                console.log(`📊 Progress: ${progressPercent.toFixed(1)}% (${processedItems}/${totalItems})`);
                console.log(`💾 Memory: ${memoryUsage.toFixed(1)}% used`);

                // Call progress callback if provided
                if (progressCallback) {
                    progressCallback({
                        batchIndex,
                        totalBatches,
                        processedItems,
                        totalItems,
                        progressPercent,
                        batchDuration,
                        memoryUsage,
                        estimatedTimeRemaining: this.estimateTimeRemaining(batchIndex, totalBatches, batchDuration)
                    });
                }

                // Memory pressure check
                if (memoryUsage > memoryThreshold * 100) {
                    console.log(`⚠️ Memory usage high (${memoryUsage.toFixed(1)}%), forcing garbage collection`);
                    this.forceGarbageCollection();

                    // Additional delay for memory recovery
                    await this.delay(delayBetweenBatches * 3);
                }

                // Delay between batches to prevent overwhelming the system
                if (batchIndex < totalBatches - 1 && delayBetweenBatches > 0) {
                    await this.delay(delayBetweenBatches);
                }

            } catch (error) {
                console.error(`❌ Batch ${batchIndex + 1} failed:`, error.message);

                // Record partial results and continue
                results.push({
                    batchIndex,
                    error: error.message,
                    processedItems: 0
                });
            }
        }

        console.log(`\n🎉 Batch processing completed: ${results.length} results processed`);
        return results;
    }

    /**
     * Process individual batch items
     * 個別バッチ項目の処理
     */
    async processBatchItems(batch, processor) {
        const results = [];

        for (let i = 0; i < batch.length; i++) {
            try {
                const result = await processor(batch[i], i);
                results.push(result);
            } catch (error) {
                console.warn(`⚠️ Item ${i} in batch failed:`, error.message);
                results.push({ error: error.message, item: batch[i] });
            }
        }

        return results;
    }

    /**
     * Estimate remaining time
     * 残り時間の推定
     */
    estimateTimeRemaining(currentBatch, totalBatches, avgBatchDuration) {
        const remainingBatches = totalBatches - currentBatch - 1;
        return remainingBatches * avgBatchDuration;
    }

    /**
     * Utility delay function
     * ユーティリティ遅延関数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Force garbage collection
     * ガベージコレクション強制実行
     */
    forceGarbageCollection() {
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
        } else if (typeof window !== 'undefined' && window.gc) {
            window.gc();
        }
    }

    /**
     * Get current memory statistics
     * 現在のメモリ統計取得
     */
    getMemoryStats() {
        if (typeof performance !== 'undefined' && performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                utilizationPercent: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100
            };
        }

        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            return {
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                utilizationPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100
            };
        }

        return { used: 0, total: 0, utilizationPercent: 0 };
    }
}

/**
 * Performance Comparison Framework
 * パフォーマンス比較フレームワーク
 */
class PerformanceComparator {
    constructor() {
        this.benchmarks = new Map();
    }

    /**
     * Run a performance comparison between multiple approaches
     * 複数のアプローチ間でのパフォーマンス比較実行
     */
    async compare(testName, approaches, testData, options = {}) {
        const {
            iterations = 10,
            warmupRuns = 2,
            memoryTracking = true,
            resultValidation = null
        } = options;

        console.log(`\n🏁 Starting performance comparison: ${testName}`);
        console.log(`📊 Approaches: ${Object.keys(approaches).join(', ')}`);
        console.log(`🔄 Iterations: ${iterations} (with ${warmupRuns} warmup runs)`);

        const results = new Map();

        for (const [approachName, approachFunction] of Object.entries(approaches)) {
            console.log(`\n🧪 Testing approach: ${approachName}`);

            // Warmup runs
            console.log(`🔥 Performing ${warmupRuns} warmup runs...`);
            for (let w = 0; w < warmupRuns; w++) {
                try {
                    await approachFunction(testData);
                } catch (error) {
                    console.warn(`⚠️ Warmup run ${w + 1} failed:`, error.message);
                }
            }

            // Force garbage collection before measurement
            this.forceGarbageCollection();

            // Actual measurement runs
            const measurements = [];
            let validResults = 0;

            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                const startMemory = this.getCurrentMemory();

                try {
                    const result = await approachFunction(testData);

                    const endTime = Date.now();
                    const endMemory = this.getCurrentMemory();

                    const measurement = {
                        iteration: i + 1,
                        duration: endTime - startTime,
                        startMemory,
                        endMemory,
                        memoryDelta: endMemory.used - startMemory.used,
                        result,
                        success: true
                    };

                    // Validate result if validation function provided
                    if (resultValidation) {
                        try {
                            const isValid = resultValidation(result, testData);
                            measurement.valid = isValid;
                            if (isValid) validResults++;
                        } catch (validationError) {
                            measurement.valid = false;
                            measurement.validationError = validationError.message;
                        }
                    } else {
                        measurement.valid = true;
                        validResults++;
                    }

                    measurements.push(measurement);

                } catch (error) {
                    measurements.push({
                        iteration: i + 1,
                        duration: -1,
                        error: error.message,
                        success: false,
                        valid: false
                    });
                }

                // Small delay between iterations
                await this.delay(10);
            }

            // Calculate statistics
            const successfulMeasurements = measurements.filter(m => m.success && m.valid);
            const durations = successfulMeasurements.map(m => m.duration);
            const memoryDeltas = successfulMeasurements.map(m => m.memoryDelta);

            const stats = {
                approachName,
                totalRuns: iterations,
                successfulRuns: successfulMeasurements.length,
                validResults,
                successRate: (successfulMeasurements.length / iterations) * 100,
                measurements,

                // Duration statistics
                averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
                minDuration: durations.length > 0 ? Math.min(...durations) : 0,
                maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
                medianDuration: this.calculateMedian(durations),
                standardDeviation: this.calculateStandardDeviation(durations),

                // Memory statistics
                averageMemoryDelta: memoryDeltas.length > 0 ? memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length : 0,
                maxMemoryDelta: memoryDeltas.length > 0 ? Math.max(...memoryDeltas) : 0,
                minMemoryDelta: memoryDeltas.length > 0 ? Math.min(...memoryDeltas) : 0
            };

            results.set(approachName, stats);

            console.log(`📊 ${approachName} results:`);
            console.log(`   Average: ${stats.averageDuration.toFixed(2)}ms`);
            console.log(`   Range: ${stats.minDuration}ms - ${stats.maxDuration}ms`);
            console.log(`   Success rate: ${stats.successRate.toFixed(1)}%`);
            console.log(`   Memory delta: ${this.formatBytes(stats.averageMemoryDelta)}`);
        }

        // Generate comparison report
        const comparisonReport = this.generateComparisonReport(testName, results);
        this.benchmarks.set(testName, comparisonReport);

        return comparisonReport;
    }

    /**
     * Generate a detailed comparison report
     * 詳細な比較レポートの生成
     */
    generateComparisonReport(testName, results) {
        const approaches = Array.from(results.values());
        const fastestApproach = approaches.reduce((fastest, current) =>
            current.averageDuration < fastest.averageDuration ? current : fastest
        );

        const comparisons = approaches.map(approach => {
            const speedRatio = approach.averageDuration / fastestApproach.averageDuration;
            const isWinner = approach === fastestApproach;

            return {
                ...approach,
                speedRatio,
                isWinner,
                performance: isWinner ? 'best' : speedRatio < 1.5 ? 'good' : speedRatio < 3.0 ? 'fair' : 'poor'
            };
        });

        const report = {
            testName,
            timestamp: Date.now(),
            fastestApproach: fastestApproach.approachName,
            approaches: comparisons,
            insights: this.generateInsights(comparisons)
        };

        return report;
    }

    /**
     * Generate insights from comparison results
     * 比較結果からの洞察生成
     */
    generateInsights(approaches) {
        const insights = [];

        // Performance insights
        const performanceDiffs = approaches.map(a => a.speedRatio).sort((a, b) => a - b);
        const maxDiff = performanceDiffs[performanceDiffs.length - 1];

        if (maxDiff > 3) {
            insights.push({
                type: 'performance',
                level: 'critical',
                message: `Significant performance difference detected: slowest approach is ${maxDiff.toFixed(1)}x slower than fastest`
            });
        } else if (maxDiff > 1.5) {
            insights.push({
                type: 'performance',
                level: 'moderate',
                message: `Noticeable performance difference: slowest approach is ${maxDiff.toFixed(1)}x slower than fastest`
            });
        }

        // Memory insights
        const memoryUsages = approaches.map(a => a.averageMemoryDelta);
        const maxMemory = Math.max(...memoryUsages);
        const minMemory = Math.min(...memoryUsages);

        if (maxMemory > 1024 * 1024) { // 1MB
            insights.push({
                type: 'memory',
                level: 'warning',
                message: `High memory usage detected: ${this.formatBytes(maxMemory)} per operation`
            });
        }

        if (maxMemory > minMemory * 2) {
            insights.push({
                type: 'memory',
                level: 'info',
                message: `Memory usage varies significantly between approaches: ${this.formatBytes(minMemory)} to ${this.formatBytes(maxMemory)}`
            });
        }

        // Reliability insights
        const reliabilityIssues = approaches.filter(a => a.successRate < 95);
        if (reliabilityIssues.length > 0) {
            insights.push({
                type: 'reliability',
                level: 'critical',
                message: `Reliability issues detected: ${reliabilityIssues.map(a => `${a.approachName} (${a.successRate.toFixed(1)}%)`).join(', ')}`
            });
        }

        return insights;
    }

    /**
     * Calculate median value
     * 中央値の計算
     */
    calculateMedian(values) {
        if (values.length === 0) return 0;

        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);

        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Calculate standard deviation
     * 標準偏差の計算
     */
    calculateStandardDeviation(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;

        return Math.sqrt(avgSquaredDiff);
    }

    /**
     * Format bytes for human reading
     * 人間が読める形式でのバイトフォーマット
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getCurrentMemory() {
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
     * Export all benchmark results
     * 全ベンチマーク結果のエクスポート
     */
    exportResults() {
        return {
            timestamp: Date.now(),
            benchmarks: Array.from(this.benchmarks.entries()).map(([name, report]) => ({
                name,
                ...report
            }))
        };
    }
}

/**
 * Demonstration Functions
 * デモンストレーション関数
 */

/**
 * Demonstrate basic performance monitoring
 * 基本的なパフォーマンス監視のデモンストレーション
 */
async function demonstratePerformanceMonitoring(module) {
    console.log("=== Performance Monitoring Demonstration ===");
    console.log("=== パフォーマンス監視デモンストレーション ===\n");

    const monitor = new PerformanceMonitor();

    // Test various operations with performance monitoring
    const testStations = ["東京", "新宿", "横浜", "大阪", "名古屋"];

    for (const stationName of testStations) {
        // Time station lookup
        const lookupId = monitor.startTiming('station_lookup');
        const stationId = module.getStationId(stationName);
        monitor.endTiming(lookupId, { stationName, stationId });

        if (stationId > 0) {
            // Time name retrieval
            const nameId = monitor.startTiming('station_name_retrieval');
            const retrievedName = module.getStationName(stationId);
            monitor.endTiming(nameId, { stationId, retrievedName });

            // Time route creation and fare calculation
            const routeId = monitor.startTiming('route_calculation');
            try {
                module.createRoute();
                module.addRouteBegin(stationId);

                // Add a destination (use Tokyo if not already Tokyo)
                const destStation = stationName !== "東京" ? "東京" : "新宿";
                const destId = module.getStationId(destStation);
                if (destId > 0) {
                    module.addRoute(1, destId); // Line ID 1 is commonly available
                    const fare = module.calculateFare();
                    monitor.endTiming(routeId, {
                        origin: stationName,
                        destination: destStation,
                        fare,
                        success: fare > 0
                    });
                } else {
                    monitor.endTiming(routeId, { error: 'Destination not found' });
                }
            } catch (error) {
                monitor.endTiming(routeId, { error: error.message });
            }
        }

        // Record memory snapshot
        monitor.recordMemorySnapshot(`After processing ${stationName}`);
    }

    // Generate and display performance summary
    const summary = monitor.getSummary();

    console.log("📊 Performance Monitoring Results:");
    console.log("📊 パフォーマンス監視結果:\n");

    console.log(`Total operations: ${summary.operationCount}`);
    console.log(`Average duration: ${summary.averageTime.toFixed(2)}ms`);
    console.log(`Session duration: ${summary.sessionDuration}ms`);
    console.log(`Memory trend: ${summary.memoryAnalysis.trend}`);
    console.log(`Growth rate: ${(summary.memoryAnalysis.growthRate / 1024).toFixed(2)} KB/s\n`);

    console.log("Operation Summary:");
    summary.operationSummary.forEach(op => {
        console.log(`  ${op.name}: ${op.count}x, avg ${op.averageDuration.toFixed(2)}ms`);
    });

    console.log("\nRecommendations:");
    summary.recommendations.forEach(rec => {
        const emoji = rec.priority === 'critical' ? '🚨' : rec.priority === 'high' ? '⚠️' : 'ℹ️';
        console.log(`  ${emoji} [${rec.type}] ${rec.issue}`);
        console.log(`     ${rec.suggestion}`);
    });

    return monitor;
}

/**
 * Demonstrate memory management and cleanup
 * メモリ管理とクリーンアップのデモンストレーション
 */
async function demonstrateMemoryManagement(module) {
    console.log("\n=== Memory Management Demonstration ===");
    console.log("=== メモリ管理デモンストレーション ===\n");

    const memoryManager = new MemoryManager();
    const initialMemory = memoryManager.getCurrentMemory();

    console.log("🔢 Initial memory state:");
    console.log(`   Used: ${memoryManager.constructor.prototype.formatBytes ? memoryManager.constructor.prototype.formatBytes(initialMemory.used) : initialMemory.used + ' bytes'}`);
    console.log(`   Total: ${memoryManager.constructor.prototype.formatBytes ? memoryManager.constructor.prototype.formatBytes(initialMemory.total) : initialMemory.total + ' bytes'}\n`);

    // Create multiple route objects to demonstrate memory usage
    console.log("📈 Creating multiple route objects...");
    const routes = [];

    for (let i = 0; i < 50; i++) {
        try {
            // Create route object
            module.createRoute();

            // Add some stations
            const stationId = module.getStationId("東京");
            if (stationId > 0) {
                module.addRouteBegin(stationId);
                const destId = module.getStationId("新宿");
                if (destId > 0) {
                    module.addRoute(1, destId);
                }
            }

            // Register for cleanup tracking
            const cleanupId = memoryManager.registerObject(
                { routeId: i },
                () => {
                    // Cleanup callback - in real scenario, would cleanup the route
                    console.log(`   Cleaning up route ${i}`);
                }
            );

            routes.push({ id: i, cleanupId });

            // Memory snapshot every 10 objects
            if ((i + 1) % 10 === 0) {
                const currentMemory = memoryManager.getCurrentMemory();
                const memoryIncrease = currentMemory.used - initialMemory.used;
                console.log(`   Created ${i + 1} routes, memory increase: ${(memoryIncrease / 1024).toFixed(2)} KB`);
            }

        } catch (error) {
            console.warn(`⚠️ Failed to create route ${i}:`, error.message);
        }
    }

    const afterCreationMemory = memoryManager.getCurrentMemory();
    const memoryIncrease = afterCreationMemory.used - initialMemory.used;

    console.log(`\n📊 After creating ${routes.length} routes:`);
    console.log(`   Memory increase: ${(memoryIncrease / 1024).toFixed(2)} KB`);
    console.log(`   Average per route: ${(memoryIncrease / routes.length / 1024).toFixed(2)} KB`);

    // Demonstrate cleanup
    console.log("\n🧹 Performing cleanup...");
    memoryManager.cleanup();

    // Force garbage collection and measure
    const gcSuccess = memoryManager.forceGarbageCollection();

    // Wait a bit for GC to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    const afterCleanupMemory = memoryManager.getCurrentMemory();
    const memoryRecovered = afterCreationMemory.used - afterCleanupMemory.used;

    console.log("\n📉 After cleanup and GC:");
    console.log(`   Memory recovered: ${(memoryRecovered / 1024).toFixed(2)} KB`);
    console.log(`   Recovery rate: ${((memoryRecovered / memoryIncrease) * 100).toFixed(1)}%`);
    console.log(`   GC available: ${gcSuccess ? 'Yes' : 'No'}`);

    const stats = memoryManager.getMemoryStats();
    console.log("\n📋 Final memory statistics:");
    console.log(`   Active objects: ${stats.activeObjects}`);
    console.log(`   Memory utilization: ${stats.utilizationPercent.toFixed(1)}%`);

    return memoryManager;
}

/**
 * Demonstrate batch processing with progress indicators
 * 進捗インジケータ付きバッチ処理のデモンストレーション
 */
async function demonstrateBatchProcessing(module) {
    console.log("\n=== Batch Processing Demonstration ===");
    console.log("=== バッチ処理デモンストレーション ===\n");

    const batchProcessor = new BatchProcessor(10); // Small batches for demonstration

    // Create test data - station combinations for route calculations
    const testStations = ["東京", "新宿", "横浜", "大阪", "名古屋", "京都", "神戸", "さいたま新都心"];
    const stationPairs = [];

    // Generate all possible pairs
    for (let i = 0; i < testStations.length; i++) {
        for (let j = i + 1; j < testStations.length; j++) {
            stationPairs.push({
                origin: testStations[i],
                destination: testStations[j],
                pairId: `${i}-${j}`
            });
        }
    }

    console.log(`📊 Generated ${stationPairs.length} station pairs for batch processing`);

    // Define the processing function
    const routeProcessor = async (stationPair, index) => {
        try {
            // Get station IDs
            const originId = module.getStationId(stationPair.origin);
            const destId = module.getStationId(stationPair.destination);

            if (originId <= 0 || destId <= 0) {
                return {
                    ...stationPair,
                    success: false,
                    error: 'Station not found',
                    originId,
                    destId
                };
            }

            // Create route and calculate fare
            module.createRoute();
            module.addRouteBegin(originId);
            module.addRoute(1, destId); // Using line ID 1

            const fare = module.calculateFare();
            const fareString = module.getFareString();

            return {
                ...stationPair,
                success: true,
                originId,
                destId,
                fare,
                fareString,
                processedAt: Date.now()
            };

        } catch (error) {
            return {
                ...stationPair,
                success: false,
                error: error.message
            };
        }
    };

    // Define progress callback
    const progressCallback = (progress) => {
        const bar = '█'.repeat(Math.floor(progress.progressPercent / 5)) +
                   '░'.repeat(20 - Math.floor(progress.progressPercent / 5));

        console.log(`   [${bar}] ${progress.progressPercent.toFixed(1)}% - ETA: ${Math.floor(progress.estimatedTimeRemaining / 1000)}s - Memory: ${progress.memoryUsage.toFixed(1)}%`);
    };

    // Process in batches
    const results = await batchProcessor.processBatch(
        stationPairs,
        routeProcessor,
        {
            batchSize: 8,
            delayBetweenBatches: 50,
            memoryThreshold: 0.8,
            progressCallback
        }
    );

    // Analyze results
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    console.log("\n📊 Batch Processing Results:");
    console.log(`   Total processed: ${results.length}`);
    console.log(`   Successful: ${successfulResults.length} (${(successfulResults.length / results.length * 100).toFixed(1)}%)`);
    console.log(`   Failed: ${failedResults.length} (${(failedResults.length / results.length * 100).toFixed(1)}%)`);

    if (successfulResults.length > 0) {
        const fares = successfulResults.map(r => r.fare).filter(f => f > 0);
        if (fares.length > 0) {
            const avgFare = fares.reduce((a, b) => a + b, 0) / fares.length;
            const minFare = Math.min(...fares);
            const maxFare = Math.max(...fares);

            console.log("\n💰 Fare Analysis:");
            console.log(`   Average fare: ¥${avgFare.toFixed(0)}`);
            console.log(`   Range: ¥${minFare} - ¥${maxFare}`);
        }
    }

    if (failedResults.length > 0) {
        console.log("\n❌ Common failure reasons:");
        const errorCounts = failedResults.reduce((counts, result) => {
            const error = result.error || 'Unknown error';
            counts[error] = (counts[error] || 0) + 1;
            return counts;
        }, {});

        Object.entries(errorCounts).forEach(([error, count]) => {
            console.log(`   ${error}: ${count} occurrences`);
        });
    }

    return { results, processor: batchProcessor };
}

/**
 * Demonstrate performance comparison between different approaches
 * 異なるアプローチ間でのパフォーマンス比較デモンストレーション
 */
async function demonstratePerformanceComparison(module) {
    console.log("\n=== Performance Comparison Demonstration ===");
    console.log("=== パフォーマンス比較デモンストレーション ===\n");

    const comparator = new PerformanceComparator();

    // Test data
    const testStations = ["東京", "新宿", "横浜"];

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

        'batch_lookup': async (stations) => {
            // Simulate batch processing approach
            const results = [];
            const batchSize = 2;

            for (let i = 0; i < stations.length; i += batchSize) {
                const batch = stations.slice(i, i + batchSize);
                const batchResults = [];

                for (const station of batch) {
                    const id = module.getStationId(station);
                    const name = id > 0 ? module.getStationName(id) : null;
                    batchResults.push({ station, id, name });
                }

                results.push(...batchResults);

                // Small delay to simulate batch processing overhead
                await new Promise(resolve => setTimeout(resolve, 1));
            }

            return results;
        }
    };

    // Result validation function
    const validateResults = (results, originalStations) => {
        if (!Array.isArray(results) || results.length !== originalStations.length) {
            return false;
        }

        return results.every((result, index) => {
            return result.station === originalStations[index] &&
                   typeof result.id === 'number' &&
                   (result.id <= 0 || typeof result.name === 'string');
        });
    };

    // Run station lookup comparison
    const stationLookupReport = await comparator.compare(
        'Station Lookup Performance',
        stationLookupApproaches,
        testStations,
        {
            iterations: 20,
            warmupRuns: 3,
            resultValidation: validateResults
        }
    );

    console.log("📊 Station Lookup Comparison Results:");
    console.log(`   Winner: ${stationLookupReport.fastestApproach}`);

    stationLookupReport.approaches.forEach(approach => {
        const performance = approach.isWinner ? '🥇' : approach.performance === 'good' ? '🥈' : '🥉';
        console.log(`   ${performance} ${approach.approachName}: ${approach.averageDuration.toFixed(2)}ms (${approach.speedRatio.toFixed(2)}x)`);
    });

    // Display insights
    if (stationLookupReport.insights.length > 0) {
        console.log("\n💡 Performance Insights:");
        stationLookupReport.insights.forEach(insight => {
            const emoji = insight.level === 'critical' ? '🚨' : insight.level === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`   ${emoji} ${insight.message}`);
        });
    }

    // Test route calculation approaches
    const routeCalculationApproaches = {
        'standard_route': async (stationPair) => {
            const [origin, destination] = stationPair;
            module.createRoute();
            module.addRouteBegin(module.getStationId(origin));
            module.addRoute(1, module.getStationId(destination));
            return module.calculateFare();
        },

        'optimized_route': async (stationPair) => {
            const [origin, destination] = stationPair;

            // Pre-validate stations
            const originId = module.getStationId(origin);
            const destId = module.getStationId(destination);

            if (originId <= 0 || destId <= 0) {
                return -1; // Early return for invalid stations
            }

            module.createRoute();
            module.addRouteBegin(originId);
            module.addRoute(1, destId);
            return module.calculateFare();
        }
    };

    const routeTestData = ["東京", "横浜"];

    const routeCalculationReport = await comparator.compare(
        'Route Calculation Performance',
        routeCalculationApproaches,
        routeTestData,
        {
            iterations: 15,
            warmupRuns: 2,
            resultValidation: (result) => typeof result === 'number'
        }
    );

    console.log("\n🛤️ Route Calculation Comparison Results:");
    console.log(`   Winner: ${routeCalculationReport.fastestApproach}`);

    routeCalculationReport.approaches.forEach(approach => {
        const performance = approach.isWinner ? '🥇' : approach.performance === 'good' ? '🥈' : '🥉';
        console.log(`   ${performance} ${approach.approachName}: ${approach.averageDuration.toFixed(2)}ms (${approach.speedRatio.toFixed(2)}x)`);
    });

    // Export comparison results
    const exportData = comparator.exportResults();
    console.log(`\n📁 Comparison data exported: ${exportData.benchmarks.length} benchmarks recorded`);

    return { comparator, reports: [stationLookupReport, routeCalculationReport] };
}

/**
 * Main demonstration function
 * メインデモンストレーション関数
 */
async function main() {
    console.log("Performance Optimization and Benchmarking Examples");
    console.log("==================================================");
    console.log("This example demonstrates comprehensive performance optimization techniques,");
    console.log("memory management patterns, and benchmarking utilities for the Farert API.\n");

    console.log("このサンプルはFarert APIの包括的なパフォーマンス最適化技術、");
    console.log("メモリ管理パターン、ベンチマークユーティリティをデモンストレーションします。\n");

    try {
        // Initialize WebAssembly module
        console.log("🔧 Initializing WebAssembly module...");
        const module = await wasmLoader.loadModule();
        console.log("✅ WebAssembly module loaded successfully\n");

        // Initialize database
        console.log("🗄️ Initializing database connection...");
        module.openDatabase();
        console.log("✅ Database connection established\n");

        // Run all demonstrations
        console.log("🚀 Starting performance optimization demonstrations...\n");

        const performanceMonitor = await demonstratePerformanceMonitoring(module);
        const memoryManager = await demonstrateMemoryManagement(module);
        const batchResults = await demonstrateBatchProcessing(module);
        const comparisonResults = await demonstratePerformanceComparison(module);

        // Final summary
        console.log("\n🎉 === Performance Optimization Examples Complete ===");
        console.log("🎉 === パフォーマンス最適化サンプル完了 ===\n");

        console.log("📊 Session Summary:");
        const finalSummary = performanceMonitor.getSummary();
        console.log(`   Total operations monitored: ${finalSummary.operationCount}`);
        console.log(`   Average operation time: ${finalSummary.averageTime.toFixed(2)}ms`);
        console.log(`   Memory trend: ${finalSummary.memoryAnalysis.trend}`);
        console.log(`   Batch processing success rate: ${((batchResults.results.filter(r => r.success).length / batchResults.results.length) * 100).toFixed(1)}%`);
        console.log(`   Performance comparisons conducted: ${comparisonResults.reports.length}`);

        console.log("\n🎯 Key Takeaways:");
        console.log("   • Performance monitoring is essential for optimization");
        console.log("   • Memory management prevents leaks and improves stability");
        console.log("   • Batch processing scales operations efficiently");
        console.log("   • Performance comparisons guide optimization decisions");
        console.log("   • Regular benchmarking ensures consistent performance");

        console.log("\n🔧 Optimization Recommendations:");
        finalSummary.recommendations.slice(0, 3).forEach(rec => {
            console.log(`   • ${rec.suggestion}`);
        });

        // Cleanup
        console.log("\n🧹 Performing final cleanup...");
        memoryManager.cleanup();

    } catch (error) {
        console.error("💥 Fatal error occurred during execution:");
        console.error(error);
        process.exit(1);
    }
}

// Export utilities for standalone use
module.exports = {
    PerformanceMonitor,
    MemoryManager,
    BatchProcessor,
    PerformanceComparator,

    // Demonstration functions
    demonstratePerformanceMonitoring,
    demonstrateMemoryManagement,
    demonstrateBatchProcessing,
    demonstratePerformanceComparison,

    // Main function
    main
};

// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}