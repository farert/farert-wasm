/**
 * Batch Processing with Progress Indicators
 * 進捗インジケータ付きバッチ処理
 *
 * This example demonstrates efficient batch processing techniques for large datasets
 * with comprehensive progress tracking, memory monitoring, and error handling.
 *
 * このサンプルは大容量データセットの効率的なバッチ処理技術を、包括的な進捗追跡、
 * メモリ監視、エラーハンドリングと共にデモンストレーションします。
 *
 * Features:
 * - Intelligent batch size optimization
 * - Real-time progress tracking with ETA calculations
 * - Memory pressure monitoring and adaptive processing
 * - Comprehensive error handling and recovery
 * - Performance metrics and throughput analysis
 * - Parallel processing capabilities
 * - Result aggregation and reporting
 *
 * Execution / 実行方法:
 * node examples/api/performance/batch-processing.js
 * node --expose-gc examples/api/performance/batch-processing.js (recommended)
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

/**
 * Advanced Batch Processor with Adaptive Processing
 * 適応的処理機能付き高度バッチプロセッサ
 */
class AdvancedBatchProcessor {
    constructor(options = {}) {
        this.baseBatchSize = options.batchSize || 50;
        this.minBatchSize = options.minBatchSize || 10;
        this.maxBatchSize = options.maxBatchSize || 200;
        this.memoryThreshold = options.memoryThreshold || 0.85;
        this.adaptiveSizing = options.adaptiveSizing !== false;
        this.errorThreshold = options.errorThreshold || 0.1; // 10% error rate
        this.parallelWorkers = options.parallelWorkers || 1;

        this.stats = {
            totalItems: 0,
            processedItems: 0,
            successfulItems: 0,
            failedItems: 0,
            totalBatches: 0,
            completedBatches: 0,
            startTime: null,
            endTime: null,
            processingTimes: [],
            batchSizes: [],
            memoryUsages: [],
            errors: []
        };

        this.progressCallbacks = [];
        this.memoryHistory = [];
        this.currentBatchSize = this.baseBatchSize;
        this.isProcessing = false;
    }

    /**
     * Add progress callback
     * 進捗コールバックの追加
     */
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    /**
     * Process items in adaptive batches
     * 適応的バッチでのアイテム処理
     */
    async processBatch(items, processor, options = {}) {
        if (this.isProcessing) {
            throw new Error('Batch processing already in progress');
        }

        this.isProcessing = true;
        this.stats.totalItems = items.length;
        this.stats.startTime = Date.now();

        const {
            concurrency = this.parallelWorkers,
            retryAttempts = 2,
            retryDelay = 1000,
            progressInterval = 1000,
            memoryCheckInterval = 5
        } = options;

        console.log(`📦 Starting adaptive batch processing:`);
        console.log(`   Total items: ${items.length}`);
        console.log(`   Initial batch size: ${this.currentBatchSize}`);
        console.log(`   Concurrency: ${concurrency}`);
        console.log(`   Memory threshold: ${(this.memoryThreshold * 100).toFixed(1)}%\n`);

        try {
            const results = [];
            let itemIndex = 0;

            // Start progress monitoring
            const progressTimer = setInterval(() => {
                this.reportProgress();
            }, progressInterval);

            while (itemIndex < items.length) {
                const batchStart = itemIndex;
                const batchEnd = Math.min(itemIndex + this.currentBatchSize, items.length);
                const batch = items.slice(batchStart, batchEnd);

                this.stats.totalBatches++;
                const batchStartTime = Date.now();

                console.log(`\n🔄 Processing batch ${this.stats.totalBatches} (items ${batchStart + 1}-${batchEnd})`);
                console.log(`   Batch size: ${batch.length}`);

                try {
                    // Memory check before processing
                    if (this.stats.totalBatches % memoryCheckInterval === 0) {
                        await this.checkMemoryPressure();
                    }

                    // Process batch with concurrency if specified
                    const batchResults = concurrency > 1 ?
                        await this.processBatchParallel(batch, processor, concurrency, retryAttempts, retryDelay) :
                        await this.processBatchSequential(batch, processor, retryAttempts, retryDelay);

                    // Record batch completion
                    const batchDuration = Date.now() - batchStartTime;
                    this.recordBatchCompletion(batch.length, batchDuration, batchResults);

                    results.push(...batchResults);
                    itemIndex = batchEnd;

                    // Adaptive batch size adjustment
                    if (this.adaptiveSizing) {
                        this.adjustBatchSize(batchDuration, batchResults);
                    }

                    // Progress notification
                    this.notifyProgress({
                        batchIndex: this.stats.completedBatches,
                        totalBatches: Math.ceil(this.stats.totalItems / this.currentBatchSize),
                        processedItems: this.stats.processedItems,
                        totalItems: this.stats.totalItems,
                        batchDuration,
                        currentBatchSize: this.currentBatchSize,
                        estimatedTimeRemaining: this.calculateETA()
                    });

                } catch (error) {
                    console.error(`❌ Batch ${this.stats.totalBatches} failed:`, error.message);
                    this.stats.errors.push({
                        batchIndex: this.stats.totalBatches,
                        error: error.message,
                        timestamp: Date.now(),
                        itemsInBatch: batch.length
                    });

                    // Record failed items
                    this.stats.failedItems += batch.length;
                    this.stats.processedItems += batch.length;

                    // Add placeholder results for failed items
                    const failedResults = batch.map(item => ({
                        item,
                        success: false,
                        error: error.message,
                        retryAttempts: 0
                    }));
                    results.push(...failedResults);

                    itemIndex = batchEnd;

                    // Check if error rate is too high
                    const errorRate = this.stats.failedItems / this.stats.processedItems;
                    if (errorRate > this.errorThreshold) {
                        console.warn(`⚠️ Error rate (${(errorRate * 100).toFixed(1)}%) exceeds threshold, stopping processing`);
                        break;
                    }
                }

                // Inter-batch delay for system recovery
                await this.delay(50);
            }

            // Stop progress monitoring
            clearInterval(progressTimer);

            // Final statistics
            this.stats.endTime = Date.now();
            this.finalizeStats();

            // Final progress report
            this.reportFinalResults(results);

            return results;

        } catch (error) {
            this.isProcessing = false;
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process batch items sequentially
     * バッチアイテムの順次処理
     */
    async processBatchSequential(batch, processor, retryAttempts, retryDelay) {
        const results = [];

        for (let i = 0; i < batch.length; i++) {
            const item = batch[i];
            let success = false;
            let result = null;
            let attempts = 0;

            while (!success && attempts <= retryAttempts) {
                try {
                    attempts++;
                    result = await processor(item, i, attempts);
                    success = true;
                    this.stats.successfulItems++;

                } catch (error) {
                    if (attempts <= retryAttempts) {
                        console.warn(`⚠️ Item ${i} failed (attempt ${attempts}), retrying...`);
                        await this.delay(retryDelay);
                    } else {
                        console.error(`❌ Item ${i} failed after ${attempts} attempts:`, error.message);
                        result = { error: error.message, item };
                        this.stats.failedItems++;
                    }
                }
            }

            results.push({
                item,
                result,
                success,
                attempts,
                index: i
            });

            this.stats.processedItems++;
        }

        return results;
    }

    /**
     * Process batch items in parallel
     * バッチアイテムの並列処理
     */
    async processBatchParallel(batch, processor, concurrency, retryAttempts, retryDelay) {
        const results = new Array(batch.length);
        const promises = [];

        for (let i = 0; i < batch.length; i += concurrency) {
            const chunk = batch.slice(i, Math.min(i + concurrency, batch.length));
            const chunkPromises = chunk.map(async (item, chunkIndex) => {
                const globalIndex = i + chunkIndex;
                let success = false;
                let result = null;
                let attempts = 0;

                while (!success && attempts <= retryAttempts) {
                    try {
                        attempts++;
                        result = await processor(item, globalIndex, attempts);
                        success = true;
                        this.stats.successfulItems++;

                    } catch (error) {
                        if (attempts <= retryAttempts) {
                            await this.delay(retryDelay);
                        } else {
                            result = { error: error.message, item };
                            this.stats.failedItems++;
                        }
                    }
                }

                results[globalIndex] = {
                    item,
                    result,
                    success,
                    attempts,
                    index: globalIndex
                };

                this.stats.processedItems++;
                return results[globalIndex];
            });

            promises.push(...chunkPromises);

            // Wait for current chunk to complete before starting next
            await Promise.all(chunkPromises);
        }

        return results;
    }

    /**
     * Check memory pressure and adjust processing
     * メモリ圧迫チェックと処理調整
     */
    async checkMemoryPressure() {
        const memoryInfo = this.getCurrentMemoryInfo();
        const utilizationPercent = this.calculateMemoryUtilization(memoryInfo);

        this.memoryHistory.push({
            timestamp: Date.now(),
            utilization: utilizationPercent,
            batchIndex: this.stats.completedBatches
        });

        console.log(`   💾 Memory utilization: ${utilizationPercent.toFixed(1)}%`);

        if (utilizationPercent > this.memoryThreshold * 100) {
            console.log('   ⚠️ Memory pressure detected, taking corrective action...');

            // Reduce batch size
            if (this.adaptiveSizing && this.currentBatchSize > this.minBatchSize) {
                this.currentBatchSize = Math.max(
                    this.minBatchSize,
                    Math.floor(this.currentBatchSize * 0.7)
                );
                console.log(`   📉 Reduced batch size to ${this.currentBatchSize}`);
            }

            // Force garbage collection
            this.forceGarbageCollection();

            // Wait for memory recovery
            await this.delay(500);

            const afterMemory = this.getCurrentMemoryInfo();
            const afterUtilization = this.calculateMemoryUtilization(afterMemory);
            console.log(`   ✅ Memory utilization after cleanup: ${afterUtilization.toFixed(1)}%`);
        }
    }

    /**
     * Adjust batch size based on performance
     * パフォーマンスに基づくバッチサイズ調整
     */
    adjustBatchSize(batchDuration, batchResults) {
        const successRate = batchResults.filter(r => r.success).length / batchResults.length;
        const throughput = batchResults.length / (batchDuration / 1000); // items per second

        // Target processing time per batch (5-15 seconds)
        const targetMinTime = 5000;
        const targetMaxTime = 15000;

        let adjustment = 1.0;

        if (batchDuration < targetMinTime && successRate > 0.95) {
            // Batch completed too quickly with high success rate - increase size
            adjustment = 1.2;
        } else if (batchDuration > targetMaxTime || successRate < 0.9) {
            // Batch took too long or had low success rate - decrease size
            adjustment = 0.8;
        }

        const newBatchSize = Math.round(this.currentBatchSize * adjustment);
        this.currentBatchSize = Math.max(
            this.minBatchSize,
            Math.min(this.maxBatchSize, newBatchSize)
        );

        if (adjustment !== 1.0) {
            console.log(`   📊 Adjusted batch size: ${this.currentBatchSize} (${adjustment > 1 ? '+' : ''}${((adjustment - 1) * 100).toFixed(0)}%)`);
        }
    }

    /**
     * Record batch completion statistics
     * バッチ完了統計の記録
     */
    recordBatchCompletion(batchSize, duration, results) {
        this.stats.completedBatches++;
        this.stats.processingTimes.push(duration);
        this.stats.batchSizes.push(batchSize);

        const successfulItems = results.filter(r => r.success).length;
        const throughput = successfulItems / (duration / 1000);

        console.log(`   ✅ Batch completed in ${duration}ms`);
        console.log(`   📊 Success rate: ${((successfulItems / batchSize) * 100).toFixed(1)}%`);
        console.log(`   🚀 Throughput: ${throughput.toFixed(1)} items/sec`);
    }

    /**
     * Calculate estimated time of arrival (ETA)
     * 到達予定時刻の計算
     */
    calculateETA() {
        if (this.stats.processingTimes.length === 0) {
            return null;
        }

        const avgBatchTime = this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length;
        const remainingItems = this.stats.totalItems - this.stats.processedItems;
        const remainingBatches = Math.ceil(remainingItems / this.currentBatchSize);

        return remainingBatches * avgBatchTime;
    }

    /**
     * Report current progress
     * 現在の進捗報告
     */
    reportProgress() {
        const progressPercent = (this.stats.processedItems / this.stats.totalItems) * 100;
        const elapsed = Date.now() - this.stats.startTime;
        const eta = this.calculateETA();

        const progressBar = this.generateProgressBar(progressPercent);

        console.log(`\n📊 Progress Update:`);
        console.log(`   [${progressBar}] ${progressPercent.toFixed(1)}%`);
        console.log(`   Processed: ${this.stats.processedItems}/${this.stats.totalItems} items`);
        console.log(`   Elapsed: ${this.formatDuration(elapsed)}`);
        if (eta) {
            console.log(`   ETA: ${this.formatDuration(eta)}`);
        }
        console.log(`   Success rate: ${((this.stats.successfulItems / Math.max(1, this.stats.processedItems)) * 100).toFixed(1)}%`);

        if (this.stats.processingTimes.length > 0) {
            const avgBatchTime = this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length;
            const throughput = this.stats.successfulItems / (elapsed / 1000);
            console.log(`   Avg batch time: ${avgBatchTime.toFixed(0)}ms`);
            console.log(`   Throughput: ${throughput.toFixed(1)} items/sec`);
        }
    }

    /**
     * Generate visual progress bar
     * 視覚的進捗バーの生成
     */
    generateProgressBar(percent, width = 30) {
        const completed = Math.floor((percent / 100) * width);
        const remaining = width - completed;

        const completedBar = '█'.repeat(completed);
        const remainingBar = '░'.repeat(remaining);

        return completedBar + remainingBar;
    }

    /**
     * Notify progress callbacks
     * 進捗コールバックの通知
     */
    notifyProgress(progressData) {
        for (const callback of this.progressCallbacks) {
            try {
                callback(progressData);
            } catch (error) {
                console.warn('Progress callback error:', error.message);
            }
        }
    }

    /**
     * Finalize processing statistics
     * 処理統計の最終化
     */
    finalizeStats() {
        const totalDuration = this.stats.endTime - this.stats.startTime;
        const avgBatchTime = this.stats.processingTimes.length > 0 ?
            this.stats.processingTimes.reduce((a, b) => a + b, 0) / this.stats.processingTimes.length : 0;

        this.stats.totalDuration = totalDuration;
        this.stats.averageBatchTime = avgBatchTime;
        this.stats.overallThroughput = this.stats.successfulItems / (totalDuration / 1000);
        this.stats.successRate = (this.stats.successfulItems / this.stats.totalItems) * 100;
        this.stats.errorRate = (this.stats.failedItems / this.stats.totalItems) * 100;
    }

    /**
     * Report final results
     * 最終結果の報告
     */
    reportFinalResults(results) {
        console.log(`\n🎉 Batch Processing Complete!`);
        console.log(`🎉 バッチ処理完了!\n`);

        console.log(`📊 Final Statistics:`);
        console.log(`   Total items: ${this.stats.totalItems}`);
        console.log(`   Processed items: ${this.stats.processedItems}`);
        console.log(`   Successful items: ${this.stats.successfulItems}`);
        console.log(`   Failed items: ${this.stats.failedItems}`);
        console.log(`   Total batches: ${this.stats.totalBatches}`);
        console.log(`   Completed batches: ${this.stats.completedBatches}`);

        console.log(`\n⏱️ Timing:`);
        console.log(`   Total duration: ${this.formatDuration(this.stats.totalDuration)}`);
        console.log(`   Average batch time: ${this.stats.averageBatchTime.toFixed(0)}ms`);
        console.log(`   Overall throughput: ${this.stats.overallThroughput.toFixed(1)} items/sec`);

        console.log(`\n📈 Performance:`);
        console.log(`   Success rate: ${this.stats.successRate.toFixed(1)}%`);
        console.log(`   Error rate: ${this.stats.errorRate.toFixed(1)}%`);

        if (this.adaptiveSizing) {
            const minBatchSize = Math.min(...this.stats.batchSizes);
            const maxBatchSize = Math.max(...this.stats.batchSizes);
            const avgBatchSize = this.stats.batchSizes.reduce((a, b) => a + b, 0) / this.stats.batchSizes.length;

            console.log(`\n🔧 Batch Size Adaptation:`);
            console.log(`   Initial batch size: ${this.baseBatchSize}`);
            console.log(`   Final batch size: ${this.currentBatchSize}`);
            console.log(`   Range: ${minBatchSize} - ${maxBatchSize}`);
            console.log(`   Average: ${avgBatchSize.toFixed(1)}`);
        }

        if (this.stats.errors.length > 0) {
            console.log(`\n❌ Error Summary (${this.stats.errors.length} batch errors):`);
            this.stats.errors.slice(0, 5).forEach((error, index) => {
                console.log(`   ${index + 1}. Batch ${error.batchIndex}: ${error.error}`);
            });
            if (this.stats.errors.length > 5) {
                console.log(`   ... and ${this.stats.errors.length - 5} more errors`);
            }
        }
    }

    /**
     * Utility methods
     */
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

    calculateMemoryUtilization(memoryInfo) {
        if (memoryInfo.total > 0) {
            return (memoryInfo.used / memoryInfo.total) * 100;
        }
        return 0;
    }

    forceGarbageCollection() {
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
            return true;
        } else if (typeof window !== 'undefined' && window.gc) {
            window.gc();
            return true;
        }
        return false;
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get comprehensive processing statistics
     * 包括的処理統計の取得
     */
    getStatistics() {
        return {
            ...this.stats,
            memoryHistory: [...this.memoryHistory],
            currentBatchSize: this.currentBatchSize,
            isProcessing: this.isProcessing
        };
    }
}

/**
 * Demonstration Functions
 */

/**
 * Demonstrate basic batch processing with progress tracking
 * 進捗追跡付き基本バッチ処理のデモンストレーション
 */
async function demonstrateBasicBatchProcessing(module) {
    console.log("=== Basic Batch Processing Demonstration ===");
    console.log("=== 基本バッチ処理デモンストレーション ===\n");

    const processor = new AdvancedBatchProcessor({
        batchSize: 20,
        memoryThreshold: 0.8,
        adaptiveSizing: true
    });

    // Generate test data - station combinations for route calculations
    const testData = [];
    const stations = ["東京", "新宿", "横浜", "大阪", "名古屋", "京都", "神戸", "広島", "福岡"];

    // Create station pairs for route calculations
    for (let i = 0; i < stations.length; i++) {
        for (let j = i + 1; j < stations.length; j++) {
            testData.push({
                origin: stations[i],
                destination: stations[j],
                id: `${i}-${j}`
            });
        }
    }

    console.log(`📊 Generated ${testData.length} route calculation tasks`);

    // Add progress callback
    processor.onProgress((progress) => {
        // Custom progress handling can be added here
        if (progress.batchIndex % 5 === 0) {
            console.log(`   🎯 Milestone: Completed ${progress.batchIndex} batches`);
        }
    });

    // Define processing function
    const routeProcessor = async (routeData, index, attempt) => {
        try {
            // Simulate varying processing complexity
            const complexity = Math.random() * 100;
            if (complexity > 90) {
                // Simulate occasional complex calculations
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            const originId = module.getStationId(routeData.origin);
            const destId = module.getStationId(routeData.destination);

            if (originId <= 0 || destId <= 0) {
                throw new Error('Station not found');
            }

            // Create route
            module.createRoute();
            module.addRouteBegin(originId);
            module.addRoute(1, destId); // Using line ID 1

            const fare = module.calculateFare();
            const fareString = module.getFareString();

            // Simulate occasional failures for testing error handling
            if (Math.random() > 0.95 && attempt === 1) {
                throw new Error('Simulated processing error');
            }

            return {
                ...routeData,
                originId,
                destId,
                fare,
                fareString,
                processedAt: Date.now(),
                processingAttempt: attempt
            };

        } catch (error) {
            // Add some context to the error
            error.message = `Route ${routeData.origin} → ${routeData.destination}: ${error.message}`;
            throw error;
        }
    };

    // Process the batch
    const results = await processor.processBatch(testData, routeProcessor, {
        retryAttempts: 2,
        retryDelay: 500,
        progressInterval: 2000
    });

    // Analyze results
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);

    console.log("\n📊 Processing Results Analysis:");
    console.log(`   Successful routes: ${successfulResults.length} (${((successfulResults.length / results.length) * 100).toFixed(1)}%)`);
    console.log(`   Failed routes: ${failedResults.length} (${((failedResults.length / results.length) * 100).toFixed(1)}%)`);

    if (successfulResults.length > 0) {
        const fares = successfulResults.map(r => r.result.fare).filter(f => f > 0);
        if (fares.length > 0) {
            const avgFare = fares.reduce((a, b) => a + b, 0) / fares.length;
            const minFare = Math.min(...fares);
            const maxFare = Math.max(...fares);

            console.log("\n💰 Fare Analysis:");
            console.log(`   Average fare: ¥${avgFare.toFixed(0)}`);
            console.log(`   Fare range: ¥${minFare} - ¥${maxFare}`);

            // Show some example results
            console.log("\n🎯 Sample Results:");
            successfulResults.slice(0, 5).forEach((result, index) => {
                const r = result.result;
                console.log(`   ${index + 1}. ${r.origin} → ${r.destination}: ¥${r.fare}`);
            });
        }
    }

    if (failedResults.length > 0) {
        console.log("\n❌ Error Analysis:");
        const errorTypes = failedResults.reduce((types, result) => {
            const errorType = result.result?.error || 'Unknown error';
            types[errorType] = (types[errorType] || 0) + 1;
            return types;
        }, {});

        Object.entries(errorTypes).forEach(([error, count]) => {
            console.log(`   ${error}: ${count} occurrences`);
        });
    }

    return { processor, results };
}

/**
 * Demonstrate parallel batch processing
 * 並列バッチ処理のデモンストレーション
 */
async function demonstrateParallelBatchProcessing(module) {
    console.log("\n=== Parallel Batch Processing Demonstration ===");
    console.log("=== 並列バッチ処理デモンストレーション ===\n");

    const processor = new AdvancedBatchProcessor({
        batchSize: 30,
        parallelWorkers: 3,
        adaptiveSizing: false, // Fixed batch size for parallel comparison
        memoryThreshold: 0.85
    });

    // Generate station lookup tasks
    const allStations = [
        "東京", "新宿", "横浜", "川崎", "品川", "渋谷", "池袋", "上野", "秋葉原", "有楽町",
        "大阪", "梅田", "難波", "天王寺", "新大阪", "京都", "神戸", "奈良", "和歌山", "姫路",
        "名古屋", "栄", "金山", "千種", "大曽根", "札幌", "函館", "旭川", "釧路", "帯広",
        "福岡", "博多", "天神", "小倉", "久留米", "仙台", "青森", "盛岡", "秋田", "山形"
    ];

    const lookupTasks = allStations.map((station, index) => ({
        stationName: station,
        taskId: index + 1,
        priority: Math.random() > 0.7 ? 'high' : 'normal'
    }));

    console.log(`📊 Generated ${lookupTasks.length} station lookup tasks`);
    console.log(`🔄 Using ${processor.parallelWorkers} parallel workers`);

    // Define parallel processing function
    const stationLookupProcessor = async (task, index, attempt) => {
        const startTime = Date.now();

        try {
            // Simulate work complexity based on priority
            if (task.priority === 'high') {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            }

            const stationId = module.getStationId(task.stationName);

            if (stationId <= 0) {
                throw new Error('Station not found in database');
            }

            // Get additional station information
            const stationName = module.getStationName(stationId);
            let kanaReading = "読み取得不可";

            if (module.getKanaFromStationId) {
                kanaReading = module.getKanaFromStationId(stationId) || "読み不明";
            }

            // Check if it's a junction station
            const isJunctionResult = module.isJunction(stationId);
            const isJunction = (isJunctionResult === 1 || isJunctionResult === true);

            const processingTime = Date.now() - startTime;

            return {
                taskId: task.taskId,
                stationName: task.stationName,
                stationId,
                retrievedName: stationName,
                kanaReading,
                isJunction,
                priority: task.priority,
                processingTime,
                workerAttempt: attempt
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            error.message = `Station lookup for "${task.stationName}" failed: ${error.message}`;
            error.processingTime = processingTime;
            throw error;
        }
    };

    // Process with parallel workers
    const results = await processor.processBatch(lookupTasks, stationLookupProcessor, {
        concurrency: 3,
        retryAttempts: 1,
        retryDelay: 200,
        progressInterval: 1500
    });

    // Analyze parallel processing results
    const successfulLookups = results.filter(r => r.success);
    const failedLookups = results.filter(r => !r.success);

    console.log("\n📊 Parallel Processing Analysis:");
    console.log(`   Successful lookups: ${successfulLookups.length}`);
    console.log(`   Failed lookups: ${failedLookups.length}`);

    if (successfulLookups.length > 0) {
        const processingTimes = successfulLookups.map(r => r.result.processingTime);
        const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
        const minTime = Math.min(...processingTimes);
        const maxTime = Math.max(...processingTimes);

        console.log(`\n⏱️ Processing Time Analysis:`);
        console.log(`   Average: ${avgProcessingTime.toFixed(2)}ms`);
        console.log(`   Range: ${minTime}ms - ${maxTime}ms`);

        // Junction station analysis
        const junctionStations = successfulLookups.filter(r => r.result.isJunction);
        console.log(`\n🚄 Junction Stations Found: ${junctionStations.length}/${successfulLookups.length}`);

        if (junctionStations.length > 0) {
            console.log("   Junction stations:");
            junctionStations.slice(0, 10).forEach((station, index) => {
                const s = station.result;
                console.log(`     ${index + 1}. ${s.stationName} (${s.kanaReading}) - ID: ${s.stationId}`);
            });
        }

        // Priority analysis
        const highPriorityTasks = successfulLookups.filter(r => r.result.priority === 'high');
        const normalPriorityTasks = successfulLookups.filter(r => r.result.priority === 'normal');

        if (highPriorityTasks.length > 0 && normalPriorityTasks.length > 0) {
            const highPriorityAvgTime = highPriorityTasks.reduce((sum, r) => sum + r.result.processingTime, 0) / highPriorityTasks.length;
            const normalPriorityAvgTime = normalPriorityTasks.reduce((sum, r) => sum + r.result.processingTime, 0) / normalPriorityTasks.length;

            console.log(`\n🏆 Priority Analysis:`);
            console.log(`   High priority avg time: ${highPriorityAvgTime.toFixed(2)}ms (${highPriorityTasks.length} tasks)`);
            console.log(`   Normal priority avg time: ${normalPriorityAvgTime.toFixed(2)}ms (${normalPriorityTasks.length} tasks)`);
        }
    }

    return { processor, results };
}

/**
 * Demonstrate memory-aware batch processing
 * メモリアウェアバッチ処理のデモンストレーション
 */
async function demonstrateMemoryAwareBatchProcessing(module) {
    console.log("\n=== Memory-Aware Batch Processing Demonstration ===");
    console.log("=== メモリアウェアバッチ処理デモンストレーション ===\n");

    const processor = new AdvancedBatchProcessor({
        batchSize: 40,
        minBatchSize: 5,
        maxBatchSize: 100,
        memoryThreshold: 0.75, // Lower threshold for more aggressive memory management
        adaptiveSizing: true
    });

    // Generate memory-intensive tasks (route calculations with complex data)
    const intensiveTasks = [];
    const originStations = ["東京", "大阪", "名古屋", "福岡", "札幌"];
    const destinationStations = ["横浜", "京都", "神戸", "広島", "仙台", "新潟", "静岡", "岡山", "金沢", "松山"];

    // Create comprehensive route matrix
    for (const origin of originStations) {
        for (const destination of destinationStations) {
            intensiveTasks.push({
                origin,
                destination,
                requestId: intensiveTasks.length + 1,
                complexity: Math.random() > 0.7 ? 'high' : 'normal',
                timestamp: Date.now()
            });
        }
    }

    // Add some additional complex tasks
    for (let i = 0; i < 20; i++) {
        intensiveTasks.push({
            origin: originStations[Math.floor(Math.random() * originStations.length)],
            destination: destinationStations[Math.floor(Math.random() * destinationStations.length)],
            requestId: intensiveTasks.length + 1,
            complexity: 'high',
            timestamp: Date.now(),
            metadata: {
                extraProcessing: true,
                iterations: Math.floor(Math.random() * 5) + 1
            }
        });
    }

    console.log(`📊 Generated ${intensiveTasks.length} memory-intensive route calculation tasks`);
    console.log(`💾 Memory threshold: ${(processor.memoryThreshold * 100).toFixed(1)}%`);

    // Track memory usage
    let memorySnapshots = [];

    processor.onProgress((progress) => {
        const memoryInfo = processor.getCurrentMemoryInfo();
        const utilization = processor.calculateMemoryUtilization(memoryInfo);

        memorySnapshots.push({
            batchIndex: progress.batchIndex,
            utilization,
            batchSize: progress.currentBatchSize,
            timestamp: Date.now()
        });

        // Log memory status every few batches
        if (progress.batchIndex % 3 === 0) {
            console.log(`   💾 Memory: ${utilization.toFixed(1)}%, Batch size: ${progress.currentBatchSize}`);
        }
    });

    // Define memory-intensive processing function
    const intensiveProcessor = async (task, index, attempt) => {
        const startTime = Date.now();

        try {
            // Simulate memory-intensive processing
            if (task.complexity === 'high') {
                await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50));
            }

            // Additional processing for metadata tasks
            if (task.metadata?.extraProcessing) {
                for (let i = 0; i < task.metadata.iterations; i++) {
                    // Simulate additional memory allocation
                    const tempData = new Array(1000).fill(Math.random());
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
            }

            const originId = module.getStationId(task.origin);
            const destId = module.getStationId(task.destination);

            if (originId <= 0 || destId <= 0) {
                throw new Error('One or both stations not found');
            }

            // Create route with comprehensive information gathering
            module.createRoute();
            module.addRouteBegin(originId);
            module.addRoute(1, destId);

            const fare = module.calculateFare();
            const fareString = module.getFareString();

            // Get additional route information
            const routeCount = module.getRouteCount();
            const startStationId = module.startStationId();
            const lastStationId = module.lastStationId();

            const processingTime = Date.now() - startTime;

            return {
                requestId: task.requestId,
                origin: task.origin,
                destination: task.destination,
                originId,
                destId,
                fare,
                fareString,
                routeCount,
                startStationId,
                lastStationId,
                complexity: task.complexity,
                processingTime,
                memoryUsageAtCompletion: processor.getCurrentMemoryInfo()
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            error.message = `Intensive route processing (${task.origin} → ${task.destination}): ${error.message}`;
            error.processingTime = processingTime;
            throw error;
        }
    };

    // Process with memory monitoring
    const results = await processor.processBatch(intensiveTasks, intensiveProcessor, {
        retryAttempts: 1,
        retryDelay: 300,
        progressInterval: 2500,
        memoryCheckInterval: 2 // Check memory every 2 batches
    });

    // Analyze memory-aware processing results
    const successfulRoutes = results.filter(r => r.success);
    const failedRoutes = results.filter(r => !r.success);

    console.log("\n📊 Memory-Aware Processing Analysis:");
    console.log(`   Successful routes: ${successfulRoutes.length}`);
    console.log(`   Failed routes: ${failedRoutes.length}`);

    // Memory usage analysis
    if (memorySnapshots.length > 0) {
        const maxMemoryUsage = Math.max(...memorySnapshots.map(s => s.utilization));
        const avgMemoryUsage = memorySnapshots.reduce((sum, s) => sum + s.utilization, 0) / memorySnapshots.length;
        const minBatchSize = Math.min(...memorySnapshots.map(s => s.batchSize));
        const maxBatchSize = Math.max(...memorySnapshots.map(s => s.batchSize));

        console.log(`\n💾 Memory Management Analysis:`);
        console.log(`   Peak memory usage: ${maxMemoryUsage.toFixed(1)}%`);
        console.log(`   Average memory usage: ${avgMemoryUsage.toFixed(1)}%`);
        console.log(`   Batch size adaptation: ${minBatchSize} - ${maxBatchSize}`);

        // Check if memory threshold was respected
        const thresholdViolations = memorySnapshots.filter(s => s.utilization > processor.memoryThreshold * 100);
        console.log(`   Memory threshold violations: ${thresholdViolations.length}/${memorySnapshots.length}`);
    }

    // Performance analysis
    if (successfulRoutes.length > 0) {
        const processingTimes = successfulRoutes.map(r => r.result.processingTime);
        const avgProcessingTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;

        const highComplexityRoutes = successfulRoutes.filter(r => r.result.complexity === 'high');
        const normalComplexityRoutes = successfulRoutes.filter(r => r.result.complexity === 'normal');

        console.log(`\n⏱️ Performance Analysis:`);
        console.log(`   Average processing time: ${avgProcessingTime.toFixed(2)}ms`);

        if (highComplexityRoutes.length > 0 && normalComplexityRoutes.length > 0) {
            const highAvg = highComplexityRoutes.reduce((sum, r) => sum + r.result.processingTime, 0) / highComplexityRoutes.length;
            const normalAvg = normalComplexityRoutes.reduce((sum, r) => sum + r.result.processingTime, 0) / normalComplexityRoutes.length;

            console.log(`   High complexity avg: ${highAvg.toFixed(2)}ms (${highComplexityRoutes.length} routes)`);
            console.log(`   Normal complexity avg: ${normalAvg.toFixed(2)}ms (${normalComplexityRoutes.length} routes)`);
        }

        // Fare analysis
        const fares = successfulRoutes.map(r => r.result.fare).filter(f => f > 0);
        if (fares.length > 0) {
            const avgFare = fares.reduce((a, b) => a + b, 0) / fares.length;
            const maxFare = Math.max(...fares);
            const minFare = Math.min(...fares);

            console.log(`\n💰 Route Fare Analysis:`);
            console.log(`   Average fare: ¥${avgFare.toFixed(0)}`);
            console.log(`   Fare range: ¥${minFare} - ¥${maxFare}`);
        }
    }

    return { processor, results, memorySnapshots };
}

/**
 * Main function
 */
async function main() {
    console.log("Batch Processing with Progress Indicators");
    console.log("========================================");
    console.log("This example demonstrates efficient batch processing techniques");
    console.log("with comprehensive progress tracking and memory management.\n");

    console.log("このサンプルは効率的なバッチ処理技術を包括的な進捗追跡と");
    console.log("メモリ管理と共にデモンストレーションします。\n");

    try {
        // Initialize WebAssembly module
        console.log("🔧 Initializing WebAssembly module...");
        const module = await wasmLoader.loadModule();
        console.log("✅ WebAssembly module loaded successfully\n");

        // Initialize database
        console.log("🗄️ Initializing database connection...");
        module.openDatabase();
        console.log("✅ Database connection established\n");

        // Run batch processing demonstrations
        console.log("🚀 Starting batch processing demonstrations...\n");

        const basicResults = await demonstrateBasicBatchProcessing(module);
        const parallelResults = await demonstrateParallelBatchProcessing(module);
        const memoryAwareResults = await demonstrateMemoryAwareBatchProcessing(module);

        // Final summary
        console.log("\n🎉 === Batch Processing Examples Complete ===");
        console.log("🎉 === バッチ処理サンプル完了 ===\n");

        console.log("📊 Overall Session Summary:");

        const allProcessors = [
            basicResults.processor,
            parallelResults.processor,
            memoryAwareResults.processor
        ];

        const totalItems = allProcessors.reduce((sum, p) => sum + p.stats.totalItems, 0);
        const totalSuccessful = allProcessors.reduce((sum, p) => sum + p.stats.successfulItems, 0);
        const totalDuration = allProcessors.reduce((sum, p) => sum + p.stats.totalDuration, 0);

        console.log(`   Total items processed: ${totalItems}`);
        console.log(`   Total successful: ${totalSuccessful} (${((totalSuccessful / totalItems) * 100).toFixed(1)}%)`);
        console.log(`   Total processing time: ${Math.floor(totalDuration / 1000)}s`);
        console.log(`   Average throughput: ${(totalSuccessful / (totalDuration / 1000)).toFixed(1)} items/sec`);

        console.log("\n🎯 Key Takeaways:");
        console.log("   • Adaptive batch sizing optimizes performance based on real-time conditions");
        console.log("   • Progress tracking provides visibility into long-running operations");
        console.log("   • Memory monitoring prevents system overload and ensures stability");
        console.log("   • Parallel processing can significantly improve throughput");
        console.log("   • Error handling and retry logic ensure robustness");
        console.log("   • Real-time adaptation allows systems to handle varying loads");

    } catch (error) {
        console.error("💥 Fatal error occurred during execution:");
        console.error(error);
        process.exit(1);
    }
}

// Export utilities for standalone use
module.exports = {
    AdvancedBatchProcessor,
    demonstrateBasicBatchProcessing,
    demonstrateParallelBatchProcessing,
    demonstrateMemoryAwareBatchProcessing,
    main
};

// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}