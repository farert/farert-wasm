/**
 * Memory Management and Cleanup Examples
 * メモリ管理とクリーンアップサンプル
 *
 * This example focuses specifically on memory management patterns, object lifecycle
 * management, and memory leak prevention for the Farert WebAssembly API.
 *
 * このサンプルはFarert WebAssembly APIのメモリ管理パターン、オブジェクト
 * ライフサイクル管理、メモリリーク防止に特化したものです。
 *
 * Features:
 * - Object lifecycle tracking and management
 * - Memory leak detection and prevention
 * - Resource pooling and reuse patterns
 * - Garbage collection optimization
 * - Memory pressure monitoring
 * - Cleanup automation and best practices
 *
 * Execution / 実行方法:
 * node examples/api/performance/memory-management.js
 * node --expose-gc examples/api/performance/memory-management.js (recommended)
 */

const path = require('path');
const { wasmLoader } = require('../../../dist/cli/cli/wasm_loader.js');

/**
 * Advanced Memory Tracker with Leak Detection
 * リーク検出機能付き高度メモリトラッカー
 */
class AdvancedMemoryTracker {
    constructor(options = {}) {
        this.trackingEnabled = options.trackingEnabled !== false;
        this.leakDetectionThreshold = options.leakDetectionThreshold || 1024 * 1024; // 1MB
        this.samplingInterval = options.samplingInterval || 5000; // 5 seconds
        this.maxSamples = options.maxSamples || 100;

        this.memoryHistory = [];
        this.objectRegistry = new Map();
        this.leakAlerts = [];
        this.gcStats = {
            forced: 0,
            automatic: 0,
            lastGC: null
        };

        this.isMonitoring = false;
        this.monitoringTimer = null;

        // Bind methods for consistent context
        this.trackObject = this.trackObject.bind(this);
        this.untrackObject = this.untrackObject.bind(this);
        this.forceGC = this.forceGC.bind(this);
    }

    /**
     * Start continuous memory monitoring
     * 継続的メモリ監視の開始
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.log('📊 Memory monitoring already active');
            return;
        }

        console.log('🔍 Starting memory monitoring...');
        this.isMonitoring = true;

        this.monitoringTimer = setInterval(() => {
            this.recordMemorySnapshot();
            this.detectMemoryLeaks();
        }, this.samplingInterval);

        // Initial snapshot
        this.recordMemorySnapshot('monitoring_start');
    }

    /**
     * Stop memory monitoring
     * メモリ監視の停止
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        console.log('⏹️ Stopping memory monitoring...');
        this.isMonitoring = false;

        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }

        this.recordMemorySnapshot('monitoring_stop');
    }

    /**
     * Record memory snapshot with enhanced metadata
     * 拡張メタデータ付きメモリスナップショット記録
     */
    recordMemorySnapshot(label = '') {
        const memoryInfo = this.getCurrentMemoryInfo();
        const timestamp = Date.now();

        const snapshot = {
            timestamp,
            label,
            memory: memoryInfo,
            trackedObjects: this.objectRegistry.size,
            gcStats: { ...this.gcStats }
        };

        this.memoryHistory.push(snapshot);

        // Maintain history limit
        if (this.memoryHistory.length > this.maxSamples) {
            this.memoryHistory.shift();
        }

        return snapshot;
    }

    /**
     * Get comprehensive memory information
     * 包括的メモリ情報の取得
     */
    getCurrentMemoryInfo() {
        const info = {
            timestamp: Date.now(),
            platform: typeof process !== 'undefined' ? 'node' : 'browser'
        };

        // Node.js memory info
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const nodeMemory = process.memoryUsage();
            info.node = {
                heapUsed: nodeMemory.heapUsed,
                heapTotal: nodeMemory.heapTotal,
                external: nodeMemory.external,
                rss: nodeMemory.rss,
                arrayBuffers: nodeMemory.arrayBuffers || 0
            };
        }

        // Browser memory info
        if (typeof performance !== 'undefined' && performance.memory) {
            info.browser = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }

        return info;
    }

    /**
     * Track object lifecycle with enhanced metadata
     * 拡張メタデータ付きオブジェクトライフサイクル追跡
     */
    trackObject(obj, metadata = {}) {
        if (!this.trackingEnabled) {
            return obj;
        }

        const objId = this.generateObjectId();
        const trackingInfo = {
            id: objId,
            object: obj,
            createdAt: Date.now(),
            type: metadata.type || 'unknown',
            size: metadata.size || 0,
            description: metadata.description || '',
            stackTrace: this.captureStackTrace(),
            memoryAtCreation: this.getCurrentMemoryInfo()
        };

        this.objectRegistry.set(objId, trackingInfo);

        // Log creation if verbose
        if (metadata.verbose) {
            console.log(`📦 Tracking object: ${trackingInfo.type} (${objId})`);
        }

        return objId;
    }

    /**
     * Untrack object and perform cleanup
     * オブジェクトの追跡解除とクリーンアップ実行
     */
    untrackObject(objId, cleanupCallback = null) {
        if (!this.trackingEnabled || !this.objectRegistry.has(objId)) {
            return false;
        }

        const trackingInfo = this.objectRegistry.get(objId);
        const lifetime = Date.now() - trackingInfo.createdAt;

        // Execute cleanup callback if provided
        if (cleanupCallback && typeof cleanupCallback === 'function') {
            try {
                cleanupCallback(trackingInfo.object);
            } catch (error) {
                console.warn(`⚠️ Cleanup error for object ${objId}:`, error.message);
            }
        }

        this.objectRegistry.delete(objId);

        console.log(`🗑️ Untracked object: ${trackingInfo.type} (${objId}) - lifetime: ${lifetime}ms`);
        return true;
    }

    /**
     * Detect potential memory leaks
     * 潜在的メモリリークの検出
     */
    detectMemoryLeaks() {
        if (this.memoryHistory.length < 5) {
            return { leaksDetected: false, reason: 'insufficient_data' };
        }

        const recent = this.memoryHistory.slice(-5);
        const analysis = this.analyzeMemoryTrend(recent);

        // Check for consistent memory growth
        if (analysis.trend === 'growing' && analysis.growthRate > this.leakDetectionThreshold / 1000) {
            const alert = {
                timestamp: Date.now(),
                type: 'memory_leak_suspected',
                severity: analysis.growthRate > this.leakDetectionThreshold * 2 / 1000 ? 'critical' : 'warning',
                details: {
                    growthRate: analysis.growthRate,
                    totalGrowth: analysis.totalGrowth,
                    timespan: analysis.timespan,
                    trackedObjects: this.objectRegistry.size
                },
                recommendations: this.generateLeakRecommendations(analysis)
            };

            this.leakAlerts.push(alert);

            // Log alert
            const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
            console.log(`${emoji} Memory leak detected:`);
            console.log(`   Growth rate: ${(alert.details.growthRate / 1024).toFixed(2)} KB/s`);
            console.log(`   Total growth: ${(alert.details.totalGrowth / 1024).toFixed(2)} KB`);
            console.log(`   Tracked objects: ${alert.details.trackedObjects}`);

            return { leaksDetected: true, alert };
        }

        return { leaksDetected: false, reason: 'within_normal_range' };
    }

    /**
     * Analyze memory usage trend
     * メモリ使用量トレンドの分析
     */
    analyzeMemoryTrend(samples) {
        if (samples.length < 2) {
            return { trend: 'unknown', growthRate: 0, totalGrowth: 0, timespan: 0 };
        }

        const oldest = samples[0];
        const newest = samples[samples.length - 1];

        const timespan = newest.timestamp - oldest.timestamp;
        const oldestMemory = this.extractUsedMemory(oldest.memory);
        const newestMemory = this.extractUsedMemory(newest.memory);
        const totalGrowth = newestMemory - oldestMemory;
        const growthRate = timespan > 0 ? (totalGrowth / timespan) * 1000 : 0; // bytes per second

        let trend = 'stable';
        if (growthRate > 1024) { // 1KB/s
            trend = 'growing';
        } else if (growthRate < -1024) {
            trend = 'decreasing';
        }

        return {
            trend,
            growthRate,
            totalGrowth,
            timespan,
            sampleCount: samples.length
        };
    }

    /**
     * Extract used memory from memory info object
     * メモリ情報オブジェクトから使用メモリの抽出
     */
    extractUsedMemory(memoryInfo) {
        if (memoryInfo.node) {
            return memoryInfo.node.heapUsed;
        } else if (memoryInfo.browser) {
            return memoryInfo.browser.usedJSHeapSize;
        }
        return 0;
    }

    /**
     * Generate recommendations for addressing memory leaks
     * メモリリーク対処の推奨事項生成
     */
    generateLeakRecommendations(analysis) {
        const recommendations = [];

        if (analysis.growthRate > 10 * 1024) { // 10KB/s
            recommendations.push('Critical: Immediate investigation required - very high memory growth rate');
            recommendations.push('Check for objects not being properly cleaned up');
            recommendations.push('Review event listeners and callback registrations');
        }

        if (this.objectRegistry.size > 1000) {
            recommendations.push('High number of tracked objects - review object lifecycle management');
            recommendations.push('Consider implementing object pooling for frequently created/destroyed objects');
        }

        recommendations.push('Force garbage collection to verify if memory can be reclaimed');
        recommendations.push('Use heap snapshots to identify objects consuming memory');
        recommendations.push('Review closure usage and circular references');

        return recommendations;
    }

    /**
     * Force garbage collection with statistics
     * 統計付きガベージコレクション強制実行
     */
    forceGC() {
        const beforeMemory = this.getCurrentMemoryInfo();
        const beforeTime = Date.now();

        let gcExecuted = false;

        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
            gcExecuted = true;
        } else if (typeof window !== 'undefined' && window.gc) {
            window.gc();
            gcExecuted = true;
        }

        if (gcExecuted) {
            this.gcStats.forced++;
            this.gcStats.lastGC = Date.now();

            // Wait for GC to complete
            setTimeout(() => {
                const afterMemory = this.getCurrentMemoryInfo();
                const gcTime = Date.now() - beforeTime;

                const beforeUsed = this.extractUsedMemory(beforeMemory);
                const afterUsed = this.extractUsedMemory(afterMemory);
                const memoryReclaimed = beforeUsed - afterUsed;

                console.log(`🗑️ Garbage collection completed:`);
                console.log(`   Time: ${gcTime}ms`);
                console.log(`   Memory reclaimed: ${(memoryReclaimed / 1024).toFixed(2)} KB`);
                console.log(`   Recovery rate: ${((memoryReclaimed / beforeUsed) * 100).toFixed(1)}%`);

                this.recordMemorySnapshot('post_gc');
            }, 50);
        } else {
            console.log('ℹ️ Garbage collection not available (run with --expose-gc flag)');
        }

        return gcExecuted;
    }

    /**
     * Generate comprehensive memory report
     * 包括的メモリレポートの生成
     */
    generateMemoryReport() {
        const currentMemory = this.getCurrentMemoryInfo();
        const latestSnapshot = this.memoryHistory[this.memoryHistory.length - 1];

        const report = {
            timestamp: Date.now(),
            summary: {
                currentMemory: this.extractUsedMemory(currentMemory),
                trackedObjects: this.objectRegistry.size,
                memoryHistory: this.memoryHistory.length,
                leakAlerts: this.leakAlerts.length,
                gcStats: { ...this.gcStats }
            },
            analysis: this.memoryHistory.length >= 2 ?
                this.analyzeMemoryTrend(this.memoryHistory.slice(-10)) : null,
            objects: this.generateObjectSummary(),
            recommendations: this.generateGeneralRecommendations()
        };

        return report;
    }

    /**
     * Generate summary of tracked objects
     * 追跡オブジェクトの要約生成
     */
    generateObjectSummary() {
        const objectsByType = new Map();
        const longLivedObjects = [];
        const currentTime = Date.now();

        for (const [id, info] of this.objectRegistry) {
            const type = info.type;
            const lifetime = currentTime - info.createdAt;

            // Group by type
            if (!objectsByType.has(type)) {
                objectsByType.set(type, { count: 0, totalSize: 0, avgLifetime: 0 });
            }
            const typeInfo = objectsByType.get(type);
            typeInfo.count++;
            typeInfo.totalSize += info.size || 0;
            typeInfo.avgLifetime = (typeInfo.avgLifetime * (typeInfo.count - 1) + lifetime) / typeInfo.count;

            // Identify long-lived objects (> 5 minutes)
            if (lifetime > 5 * 60 * 1000) {
                longLivedObjects.push({ id, type, lifetime, description: info.description });
            }
        }

        return {
            totalObjects: this.objectRegistry.size,
            objectsByType: Array.from(objectsByType.entries()).map(([type, info]) => ({
                type,
                ...info
            })),
            longLivedObjects: longLivedObjects.slice(0, 10) // Top 10 longest-lived
        };
    }

    /**
     * Generate general memory management recommendations
     * 一般的メモリ管理推奨事項の生成
     */
    generateGeneralRecommendations() {
        const recommendations = [];
        const currentUsage = this.extractUsedMemory(this.getCurrentMemoryInfo());

        if (currentUsage > 100 * 1024 * 1024) { // 100MB
            recommendations.push('High memory usage detected - consider optimizing data structures');
        }

        if (this.objectRegistry.size > 500) {
            recommendations.push('Large number of tracked objects - review object cleanup procedures');
        }

        if (this.leakAlerts.length > 0) {
            recommendations.push('Memory leak alerts detected - investigate and address root causes');
        }

        if (this.gcStats.forced > 10) {
            recommendations.push('Frequent forced GC detected - review memory allocation patterns');
        }

        if (recommendations.length === 0) {
            recommendations.push('Memory usage appears to be within normal parameters');
        }

        return recommendations;
    }

    /**
     * Utility methods
     */
    generateObjectId() {
        return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    captureStackTrace() {
        if (typeof Error.captureStackTrace === 'function') {
            const obj = {};
            Error.captureStackTrace(obj, this.trackObject);
            return obj.stack;
        }
        return new Error().stack;
    }

    /**
     * Cleanup all tracked objects and stop monitoring
     * 全追跡オブジェクトのクリーンアップと監視停止
     */
    cleanup() {
        console.log('🧹 Performing comprehensive memory cleanup...');

        this.stopMonitoring();

        // Cleanup all tracked objects
        const objectCount = this.objectRegistry.size;
        for (const [id, info] of this.objectRegistry) {
            try {
                // Basic cleanup attempt
                if (info.object && typeof info.object.cleanup === 'function') {
                    info.object.cleanup();
                }
            } catch (error) {
                console.warn(`⚠️ Error cleaning up object ${id}:`, error.message);
            }
        }

        this.objectRegistry.clear();
        this.memoryHistory.length = 0;
        this.leakAlerts.length = 0;

        console.log(`✅ Cleaned up ${objectCount} tracked objects`);

        // Final garbage collection
        this.forceGC();
    }
}

/**
 * Resource Pool for Object Reuse
 * オブジェクト再利用のためのリソースプール
 */
class ResourcePool {
    constructor(createFn, resetFn, maxSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
        this.pool = [];
        this.activeResources = new Set();
        this.stats = {
            created: 0,
            reused: 0,
            destroyed: 0,
            maxActive: 0
        };
    }

    /**
     * Acquire a resource from the pool
     * プールからリソースを取得
     */
    acquire() {
        let resource;

        if (this.pool.length > 0) {
            resource = this.pool.pop();
            this.stats.reused++;
            console.log(`♻️ Reused resource from pool (${this.pool.length} remaining)`);
        } else {
            resource = this.createFn();
            this.stats.created++;
            console.log(`🆕 Created new resource (total created: ${this.stats.created})`);
        }

        this.activeResources.add(resource);
        this.stats.maxActive = Math.max(this.stats.maxActive, this.activeResources.size);

        return resource;
    }

    /**
     * Release a resource back to the pool
     * リソースをプールに戻す
     */
    release(resource) {
        if (!this.activeResources.has(resource)) {
            console.warn('⚠️ Attempted to release non-active resource');
            return false;
        }

        this.activeResources.delete(resource);

        if (this.pool.length < this.maxSize) {
            // Reset resource state
            if (this.resetFn) {
                try {
                    this.resetFn(resource);
                } catch (error) {
                    console.warn('⚠️ Failed to reset resource:', error.message);
                    return false;
                }
            }

            this.pool.push(resource);
            console.log(`📦 Released resource to pool (${this.pool.length} available)`);
            return true;
        } else {
            // Pool is full, destroy resource
            this.stats.destroyed++;
            console.log(`🗑️ Destroyed excess resource (pool full)`);
            return false;
        }
    }

    /**
     * Get pool statistics
     * プール統計の取得
     */
    getStats() {
        return {
            ...this.stats,
            poolSize: this.pool.length,
            activeResources: this.activeResources.size,
            utilizationRate: this.stats.reused / (this.stats.created + this.stats.reused)
        };
    }

    /**
     * Cleanup all resources
     * 全リソースのクリーンアップ
     */
    cleanup() {
        console.log(`🧹 Cleaning up resource pool: ${this.pool.length} pooled, ${this.activeResources.size} active`);

        // Clear pool
        this.pool.length = 0;

        // Clear active resources (caller responsible for cleanup)
        this.activeResources.clear();

        console.log('✅ Resource pool cleaned up');
    }
}

/**
 * Demonstration Functions
 */

/**
 * Demonstrate basic memory tracking
 * 基本的メモリ追跡のデモンストレーション
 */
async function demonstrateMemoryTracking(module) {
    console.log("=== Memory Tracking Demonstration ===");
    console.log("=== メモリ追跡デモンストレーション ===\n");

    const tracker = new AdvancedMemoryTracker();
    tracker.startMonitoring();

    // Create various objects to track
    const objects = [];

    console.log("📦 Creating and tracking various objects...\n");

    for (let i = 0; i < 20; i++) {
        try {
            // Create route object
            module.createRoute();

            // Track the route creation
            const objId = tracker.trackObject(
                { routeIndex: i },
                {
                    type: 'route',
                    description: `Route object #${i}`,
                    size: 1024, // Estimated size
                    verbose: i % 5 === 0 // Log every 5th object
                }
            );

            objects.push(objId);

            // Add some stations to create memory usage
            const stationId = module.getStationId("東京");
            if (stationId > 0) {
                module.addRouteBegin(stationId);
            }

            // Memory snapshot every 10 objects
            if ((i + 1) % 10 === 0) {
                tracker.recordMemorySnapshot(`Created ${i + 1} routes`);
            }

            // Small delay to allow memory monitoring
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.warn(`⚠️ Failed to create route ${i}:`, error.message);
        }
    }

    console.log(`\n📊 Created ${objects.length} tracked objects`);

    // Wait for memory monitoring to collect data
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Demonstrate leak detection
    console.log('\n🔍 Running leak detection...');
    const leakResult = tracker.detectMemoryLeaks();

    if (leakResult.leaksDetected) {
        console.log('🚨 Memory leak detected!');
        console.log('Recommendations:', leakResult.alert.recommendations.join('\n   '));
    } else {
        console.log('✅ No memory leaks detected');
    }

    // Cleanup half the objects
    console.log('\n🧹 Cleaning up half the objects...');
    const halfPoint = Math.floor(objects.length / 2);

    for (let i = 0; i < halfPoint; i++) {
        tracker.untrackObject(objects[i], (obj) => {
            // Custom cleanup logic
            console.log(`   Cleaning up route ${obj.routeIndex}`);
        });
    }

    // Force garbage collection
    console.log('\n🗑️ Forcing garbage collection...');
    tracker.forceGC();

    // Wait for GC effects
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate final report
    console.log('\n📋 Generating memory report...');
    const report = tracker.generateMemoryReport();

    console.log('\n📊 Memory Report Summary:');
    console.log(`   Current memory: ${(report.summary.currentMemory / 1024).toFixed(2)} KB`);
    console.log(`   Tracked objects: ${report.summary.trackedObjects}`);
    console.log(`   Memory snapshots: ${report.summary.memoryHistory}`);
    console.log(`   Leak alerts: ${report.summary.leakAlerts}`);
    console.log(`   GC forced: ${report.summary.gcStats.forced} times`);

    if (report.analysis) {
        console.log(`\n📈 Memory trend: ${report.analysis.trend}`);
        console.log(`   Growth rate: ${(report.analysis.growthRate / 1024).toFixed(2)} KB/s`);
    }

    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
    });

    // Cleanup
    tracker.cleanup();

    return tracker;
}

/**
 * Demonstrate resource pooling
 * リソースプーリングのデモンストレーション
 */
async function demonstrateResourcePooling(module) {
    console.log("\n=== Resource Pooling Demonstration ===");
    console.log("=== リソースプーリングデモンストレーション ===\n");

    // Create a resource pool for route objects
    const routePool = new ResourcePool(
        // Create function
        () => {
            module.createRoute();
            return { id: Math.random().toString(36).substr(2, 9), created: Date.now() };
        },
        // Reset function
        (resource) => {
            // Reset route state
            module.removeAll(); // Clear any existing route data
            resource.lastUsed = Date.now();
        },
        10 // Max pool size
    );

    console.log("🏊 Testing resource pool with high-frequency operations...\n");

    const testStations = ["東京", "新宿", "横浜", "大阪"];
    const operations = 50;

    for (let i = 0; i < operations; i++) {
        // Acquire resource from pool
        const resource = routePool.acquire();

        try {
            // Use the resource for route calculation
            const origin = testStations[i % testStations.length];
            const dest = testStations[(i + 1) % testStations.length];

            const originId = module.getStationId(origin);
            const destId = module.getStationId(dest);

            if (originId > 0 && destId > 0) {
                module.addRouteBegin(originId);
                module.addRoute(1, destId);
                const fare = module.calculateFare();

                if (i % 10 === 0) {
                    console.log(`🎯 Operation ${i + 1}: ${origin} → ${dest}, fare: ¥${fare}`);
                }
            }

        } catch (error) {
            console.warn(`⚠️ Operation ${i + 1} failed:`, error.message);
        }

        // Release resource back to pool
        routePool.release(resource);

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Display pool statistics
    const stats = routePool.getStats();
    console.log('\n📊 Resource Pool Statistics:');
    console.log(`   Total created: ${stats.created}`);
    console.log(`   Total reused: ${stats.reused}`);
    console.log(`   Total destroyed: ${stats.destroyed}`);
    console.log(`   Max active: ${stats.maxActive}`);
    console.log(`   Current pool size: ${stats.poolSize}`);
    console.log(`   Utilization rate: ${(stats.utilizationRate * 100).toFixed(1)}%`);

    // Calculate efficiency
    const totalOperations = stats.created + stats.reused;
    const efficiency = totalOperations > 0 ? (stats.reused / totalOperations) * 100 : 0;
    console.log(`   Pool efficiency: ${efficiency.toFixed(1)}%`);

    // Cleanup
    routePool.cleanup();

    return routePool;
}

/**
 * Demonstrate memory pressure handling
 * メモリ圧迫処理のデモンストレーション
 */
async function demonstrateMemoryPressureHandling(module) {
    console.log("\n=== Memory Pressure Handling Demonstration ===");
    console.log("=== メモリ圧迫処理デモンストレーション ===\n");

    const tracker = new AdvancedMemoryTracker({
        leakDetectionThreshold: 500 * 1024, // Lower threshold for demo
        samplingInterval: 1000 // More frequent sampling
    });

    tracker.startMonitoring();

    // Simulate memory-intensive operations
    console.log("💾 Simulating memory-intensive operations...\n");

    const memoryThreshold = 0.8; // 80% memory utilization
    const batchSize = 20;
    let operations = 0;
    let totalBatches = 0;

    try {
        for (let batch = 0; batch < 10; batch++) {
            console.log(`📦 Processing batch ${batch + 1}...`);

            // Process batch of operations
            const routes = [];
            for (let i = 0; i < batchSize; i++) {
                try {
                    module.createRoute();
                    const stationId = module.getStationId("東京");
                    if (stationId > 0) {
                        module.addRouteBegin(stationId);
                    }

                    const objId = tracker.trackObject(
                        { batchId: batch, operationId: i },
                        { type: 'batch_route', size: 2048 }
                    );
                    routes.push(objId);
                    operations++;

                } catch (error) {
                    console.warn(`⚠️ Failed to create route in batch ${batch}, operation ${i}`);
                }
            }

            totalBatches++;

            // Check memory pressure
            const currentMemory = tracker.getCurrentMemoryInfo();
            const memUsage = tracker.extractUsedMemory(currentMemory);

            // Simulate memory threshold check
            const simulatedUsage = (memUsage / (100 * 1024 * 1024)); // Normalize to 100MB scale
            const utilizationPercent = simulatedUsage * 100;

            console.log(`   Memory utilization: ${utilizationPercent.toFixed(1)}%`);

            if (utilizationPercent > memoryThreshold * 100) {
                console.log('⚠️ Memory pressure detected! Initiating cleanup...');

                // Cleanup current batch
                for (const objId of routes) {
                    tracker.untrackObject(objId);
                }

                // Force garbage collection
                tracker.forceGC();

                // Wait for memory recovery
                await new Promise(resolve => setTimeout(resolve, 500));

                console.log('✅ Emergency cleanup completed');
            }

            // Regular inter-batch delay
            await new Promise(resolve => setTimeout(resolve, 200));
        }

    } catch (error) {
        console.error('❌ Memory pressure handling failed:', error.message);
    }

    console.log(`\n📊 Memory pressure simulation completed:`);
    console.log(`   Total operations: ${operations}`);
    console.log(`   Total batches: ${totalBatches}`);
    console.log(`   Operations per batch: ${(operations / totalBatches).toFixed(1)}`);

    // Final leak detection
    const leakResult = tracker.detectMemoryLeaks();
    if (leakResult.leaksDetected) {
        console.log('\n🚨 Memory leaks detected during pressure test!');
    } else {
        console.log('\n✅ No memory leaks detected during pressure test');
    }

    // Cleanup
    tracker.cleanup();

    return { operations, totalBatches, tracker };
}

/**
 * Main function
 */
async function main() {
    console.log("Memory Management and Cleanup Examples");
    console.log("=====================================");
    console.log("This example demonstrates comprehensive memory management patterns,");
    console.log("object lifecycle tracking, and memory leak prevention techniques.\n");

    console.log("このサンプルは包括的なメモリ管理パターン、オブジェクトライフサイクル追跡、");
    console.log("メモリリーク防止技術をデモンストレーションします。\n");

    try {
        // Initialize WebAssembly module
        console.log("🔧 Initializing WebAssembly module...");
        const module = await wasmLoader.loadModule();
        console.log("✅ WebAssembly module loaded successfully\n");

        // Initialize database
        console.log("🗄️ Initializing database connection...");
        module.openDatabase();
        console.log("✅ Database connection established\n");

        // Run memory management demonstrations
        console.log("🚀 Starting memory management demonstrations...\n");

        const memoryTracker = await demonstrateMemoryTracking(module);
        const resourcePool = await demonstrateResourcePooling(module);
        const pressureResult = await demonstrateMemoryPressureHandling(module);

        // Final summary
        console.log("\n🎉 === Memory Management Examples Complete ===");
        console.log("🎉 === メモリ管理サンプル完了 ===\n");

        console.log("📊 Session Summary:");
        console.log(`   Memory tracking operations completed successfully`);
        console.log(`   Resource pool efficiency: ${(resourcePool.getStats().utilizationRate * 100).toFixed(1)}%`);
        console.log(`   Memory pressure operations: ${pressureResult.operations}`);

        console.log("\n🎯 Key Learnings:");
        console.log("   • Object lifecycle tracking prevents memory leaks");
        console.log("   • Resource pooling improves performance and reduces GC pressure");
        console.log("   • Memory pressure handling ensures application stability");
        console.log("   • Proactive monitoring catches issues before they become critical");
        console.log("   • Forced garbage collection should be used sparingly but strategically");

    } catch (error) {
        console.error("💥 Fatal error occurred during execution:");
        console.error(error);
        process.exit(1);
    }
}

// Export utilities for standalone use
module.exports = {
    AdvancedMemoryTracker,
    ResourcePool,
    demonstrateMemoryTracking,
    demonstrateResourcePooling,
    demonstrateMemoryPressureHandling,
    main
};

// Execute if run directly
if (require.main === module) {
    main().catch(console.error);
}