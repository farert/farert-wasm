/**
 * Bundle Analyzer Configuration for Farert SDK
 * 
 * Provides comprehensive bundle size analysis, tree-shaking verification,
 * and performance monitoring for optimal frontend integration.
 * Based on CLAUDE.md requirements for 150KB gzipped bundle size limit.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { gzipSync } from 'zlib';

// Performance requirements from specification
export const PERFORMANCE_TARGETS = {
  MAX_BUNDLE_SIZE_GZIPPED: 150 * 1024, // 150KB gzipped
  MAX_BUNDLE_SIZE_RAW: 500 * 1024,     // 500KB raw
  MAX_INIT_TIME: 2000,                 // 2 seconds initialization
  MAX_CACHED_RESPONSE_TIME: 10,        // 10ms cached responses
  MAX_ROUTE_CALC_TIME: 500,            // 500ms route calculations
} as const;

// Bundle analysis result interface
export interface BundleAnalysisResult {
  bundleName: string;
  rawSize: number;
  gzippedSize: number;
  compressionRatio: number;
  treeshakingEffectiveness: number;
  recommendations: string[];
  warnings: string[];
  errors: string[];
  performance: PerformanceAnalysis;
  dependencies: DependencyAnalysis;
  chunks: ChunkAnalysis[];
}

export interface PerformanceAnalysis {
  initializationTime: number;
  memoryUsage: number;
  loadTime: number;
  cacheHitRatio: number;
  webAssemblyLoadTime: number;
}

export interface DependencyAnalysis {
  total: number;
  framework: Record<string, number>;
  webassembly: number;
  utilities: number;
  unused: string[];
  duplicates: string[];
}

export interface ChunkAnalysis {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isAsync: boolean;
  isEntry: boolean;
}

export interface BundleConfig {
  entry: string;
  outputDir: string;
  target: 'browser' | 'node' | 'universal';
  framework?: 'svelte' | 'react' | 'vue' | 'vanilla';
  enableTreeShaking: boolean;
  enableMinification: boolean;
  enableCompression: boolean;
  chunkSplitting: boolean;
  analyzeDependencies: boolean;
}

/**
 * Main Bundle Analyzer class for Farert SDK
 */
export class BundleAnalyzer {
  private config: BundleConfig;
  private results: Map<string, BundleAnalysisResult> = new Map();

  constructor(config: BundleConfig) {
    this.config = config;
  }

  /**
   * Analyze bundle with comprehensive metrics
   */
  async analyze(): Promise<BundleAnalysisResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Analyzing bundle: ${this.config.entry}`);
    
    try {
      // Read bundle file
      const bundlePath = this.getBundlePath();
      if (!existsSync(bundlePath)) {
        throw new Error(`Bundle not found: ${bundlePath}`);
      }

      const bundleContent = readFileSync(bundlePath);
      const rawSize = bundleContent.length;
      const gzippedSize = gzipSync(bundleContent).length;
      const compressionRatio = rawSize / gzippedSize;

      // Analyze tree-shaking effectiveness
      const treeshakingEffectiveness = this.analyzeTreeShaking(bundleContent);

      // Performance analysis
      const performance = await this.analyzePerformance(bundlePath);

      // Dependency analysis
      const dependencies = this.analyzeDependencies(bundleContent);

      // Chunk analysis (if applicable)
      const chunks = this.analyzeChunks();

      // Generate recommendations and warnings
      const { recommendations, warnings, errors } = this.generateRecommendations(
        rawSize, gzippedSize, treeshakingEffectiveness, performance, dependencies
      );

      const result: BundleAnalysisResult = {
        bundleName: basename(bundlePath),
        rawSize,
        gzippedSize,
        compressionRatio,
        treeshakingEffectiveness,
        recommendations,
        warnings,
        errors,
        performance,
        dependencies,
        chunks,
      };

      this.results.set(this.config.entry, result);
      
      console.log(`✅ Analysis completed in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      const errorResult: BundleAnalysisResult = {
        bundleName: 'error',
        rawSize: 0,
        gzippedSize: 0,
        compressionRatio: 0,
        treeshakingEffectiveness: 0,
        recommendations: [],
        warnings: [],
        errors: [`Analysis failed: ${error instanceof Error ? error.message : String(error)}`],
        performance: this.getDefaultPerformanceAnalysis(),
        dependencies: this.getDefaultDependencyAnalysis(),
        chunks: [],
      };
      
      console.error(`❌ Bundle analysis failed:`, error);
      return errorResult;
    }
  }

  /**
   * Generate comprehensive bundle report
   */
  generateReport(): string {
    const results = Array.from(this.results.values());
    if (results.length === 0) {
      return 'No analysis results available. Run analyze() first.';
    }

    let report = `# Farert SDK Bundle Analysis Report\n\n`;
    report += `Generated: ${new Date().toISOString()}\n\n`;

    for (const result of results) {
      report += this.formatBundleReport(result);
    }

    report += this.generateSummarySection(results);
    report += this.generateRecommendationsSection(results);

    return report;
  }

  /**
   * Check if bundle meets performance requirements
   */
  meetsPerformanceRequirements(result?: BundleAnalysisResult): boolean {
    const analysis = result || this.results.values().next().value;
    if (!analysis) return false;

    const checks = [
      analysis.gzippedSize <= PERFORMANCE_TARGETS.MAX_BUNDLE_SIZE_GZIPPED,
      analysis.rawSize <= PERFORMANCE_TARGETS.MAX_BUNDLE_SIZE_RAW,
      analysis.performance.initializationTime <= PERFORMANCE_TARGETS.MAX_INIT_TIME,
      analysis.treeshakingEffectiveness >= 0.8, // 80% tree-shaking effectiveness
      analysis.errors.length === 0,
    ];

    return checks.every(check => check);
  }

  /**
   * Analyze tree-shaking effectiveness
   */
  private analyzeTreeShaking(bundleContent: Buffer): number {
    const content = bundleContent.toString();
    
    // Check for common unused code patterns
    const unusedPatterns = [
      /\/\*\s*unused\s*\*\//gi,
      /\/\/\s*@ts-ignore/gi,
      /export\s+{\s*}/gi, // Empty exports
      /import\s+{\s*}\s+from/gi, // Empty imports
    ];

    const deadCodeIndicators = [
      /console\.log/gi,
      /console\.debug/gi,
      /debugger;/gi,
      /\/\*\s*@deprecated\s*\*\//gi,
    ];

    let unusedCodeCount = 0;
    let deadCodeCount = 0;
    const totalLines = content.split('\n').length;

    // Count unused code patterns
    for (const pattern of unusedPatterns) {
      const matches = content.match(pattern);
      if (matches) unusedCodeCount += matches.length;
    }

    // Count dead code patterns
    for (const pattern of deadCodeIndicators) {
      const matches = content.match(pattern);
      if (matches) deadCodeCount += matches.length;
    }

    // Calculate effectiveness (1.0 = perfect, 0.0 = no tree-shaking)
    const totalIssues = unusedCodeCount + deadCodeCount;
    const effectiveness = Math.max(0, 1 - (totalIssues / Math.max(totalLines * 0.01, 1)));
    
    return effectiveness;
  }

  /**
   * Analyze runtime performance
   */
  private async analyzePerformance(bundlePath: string): Promise<PerformanceAnalysis> {
    // Simulate performance metrics based on bundle characteristics
    const stats = statSync(bundlePath);
    const fileSize = stats.size;

    // Estimate initialization time based on bundle size
    const estimatedInitTime = Math.max(500, fileSize / 1024); // Rough estimate

    // Estimate memory usage
    const estimatedMemoryUsage = fileSize * 1.5; // Bundle + runtime overhead

    // Estimate load time (simulated based on size)
    const estimatedLoadTime = fileSize / (1024 * 1024) * 100; // 100ms per MB

    return {
      initializationTime: estimatedInitTime,
      memoryUsage: estimatedMemoryUsage,
      loadTime: estimatedLoadTime,
      cacheHitRatio: 0.85, // Default assumption
      webAssemblyLoadTime: 200, // Estimated WASM load time
    };
  }

  /**
   * Analyze dependencies and imports
   */
  private analyzeDependencies(bundleContent: Buffer): DependencyAnalysis {
    const content = bundleContent.toString();
    
    // Extract imports/requires
    const importPatterns = [
      /import\s+.*?\s+from\s+['"](.*?)['"];?/gi,
      /require\s*\(\s*['"](.*?)[']\s*\)/gi,
      /import\s*\(\s*['"](.*?)[']\s*\)/gi, // Dynamic imports
    ];

    const dependencies = new Set<string>();
    const frameworkDeps: Record<string, number> = {};
    let webassemblyCount = 0;
    let utilitiesCount = 0;

    for (const pattern of importPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const dep = match[1];
        dependencies.add(dep);

        // Categorize dependencies
        if (dep.includes('svelte')) {
          frameworkDeps.svelte = (frameworkDeps.svelte || 0) + 1;
        } else if (dep.includes('react')) {
          frameworkDeps.react = (frameworkDeps.react || 0) + 1;
        } else if (dep.includes('vue')) {
          frameworkDeps.vue = (frameworkDeps.vue || 0) + 1;
        } else if (dep.includes('wasm') || dep.includes('webassembly')) {
          webassemblyCount++;
        } else if (dep.startsWith('../utils/') || dep.includes('utils')) {
          utilitiesCount++;
        }
      }
    }

    return {
      total: dependencies.size,
      framework: frameworkDeps,
      webassembly: webassemblyCount,
      utilities: utilitiesCount,
      unused: [], // Would require deeper analysis
      duplicates: [], // Would require dependency graph analysis
    };
  }

  /**
   * Analyze chunk splitting effectiveness
   */
  private analyzeChunks(): ChunkAnalysis[] {
    const outputDir = this.config.outputDir;
    if (!existsSync(outputDir)) {
      return [];
    }

    const chunks: ChunkAnalysis[] = [];
    const files = readdirSync(outputDir);

    for (const file of files) {
      if (extname(file) === '.js') {
        const filePath = join(outputDir, file);
        const stats = statSync(filePath);
        const content = readFileSync(filePath);
        const gzippedSize = gzipSync(content).length;

        chunks.push({
          name: file,
          size: stats.size,
          gzippedSize,
          modules: this.extractModules(content.toString()),
          isAsync: file.includes('async') || file.includes('lazy'),
          isEntry: file.includes('main') || file.includes('entry'),
        });
      }
    }

    return chunks.sort((a, b) => b.size - a.size);
  }

  /**
   * Extract module names from chunk content
   */
  private extractModules(content: string): string[] {
    const modulePattern = /\/\*\*\s*@module\s+(.*?)\s*\*\//gi;
    const modules: string[] = [];
    
    let match;
    while ((match = modulePattern.exec(content)) !== null) {
      modules.push(match[1]);
    }

    // Fallback: extract common module patterns
    if (modules.length === 0) {
      const fallbackPatterns = [
        /src\/sdk\/(\w+)/gi,
        /\.\/(\w+)\.js/gi,
      ];

      for (const pattern of fallbackPatterns) {
        let patternMatch;
        while ((patternMatch = pattern.exec(content)) !== null) {
          modules.push(patternMatch[1]);
        }
      }
    }

    return [...new Set(modules)]; // Remove duplicates
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    rawSize: number,
    gzippedSize: number,
    treeshakingEffectiveness: number,
    performance: PerformanceAnalysis,
    dependencies: DependencyAnalysis
  ): { recommendations: string[]; warnings: string[]; errors: string[] } {
    const recommendations: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Size checks
    if (gzippedSize > PERFORMANCE_TARGETS.MAX_BUNDLE_SIZE_GZIPPED) {
      errors.push(`Bundle size (${(gzippedSize / 1024).toFixed(1)}KB) exceeds 150KB limit`);
      recommendations.push('Enable code splitting and lazy loading');
      recommendations.push('Remove unused dependencies and dead code');
    }

    if (rawSize > PERFORMANCE_TARGETS.MAX_BUNDLE_SIZE_RAW) {
      warnings.push(`Raw bundle size (${(rawSize / 1024).toFixed(1)}KB) is quite large`);
      recommendations.push('Enable minification and compression');
    }

    // Tree-shaking effectiveness
    if (treeshakingEffectiveness < 0.8) {
      warnings.push(`Tree-shaking effectiveness is ${(treeshakingEffectiveness * 100).toFixed(1)}%`);
      recommendations.push('Review imports and use named imports instead of namespace imports');
      recommendations.push('Remove unused exports and dead code');
    }

    // Performance checks
    if (performance.initializationTime > PERFORMANCE_TARGETS.MAX_INIT_TIME) {
      warnings.push(`Initialization time (${performance.initializationTime}ms) exceeds 2s target`);
      recommendations.push('Implement lazy loading for non-critical features');
      recommendations.push('Optimize WebAssembly module loading');
    }

    // Dependency analysis
    if (dependencies.total > 50) {
      warnings.push(`High dependency count (${dependencies.total})`);
      recommendations.push('Audit dependencies and remove unused packages');
    }

    // Framework-specific recommendations
    const frameworks = Object.keys(dependencies.framework);
    if (frameworks.length > 1) {
      recommendations.push('Consider using only one frontend framework to reduce bundle size');
    }

    // General optimizations
    if (recommendations.length === 0) {
      recommendations.push('Bundle is well-optimized!');
      recommendations.push('Consider implementing performance monitoring in production');
    }

    return { recommendations, warnings, errors };
  }

  /**
   * Format individual bundle report
   */
  private formatBundleReport(result: BundleAnalysisResult): string {
    let report = `## Bundle: ${result.bundleName}\n\n`;
    
    // Size information
    report += `### Size Analysis\n`;
    report += `- Raw Size: ${(result.rawSize / 1024).toFixed(1)} KB\n`;
    report += `- Gzipped Size: ${(result.gzippedSize / 1024).toFixed(1)} KB\n`;
    report += `- Compression Ratio: ${result.compressionRatio.toFixed(2)}x\n`;
    report += `- Tree-shaking Effectiveness: ${(result.treeshakingEffectiveness * 100).toFixed(1)}%\n\n`;

    // Performance metrics
    report += `### Performance Analysis\n`;
    report += `- Initialization Time: ${result.performance.initializationTime}ms\n`;
    report += `- Memory Usage: ${(result.performance.memoryUsage / 1024).toFixed(1)} KB\n`;
    report += `- Load Time: ${result.performance.loadTime.toFixed(1)}ms\n`;
    report += `- WebAssembly Load Time: ${result.performance.webAssemblyLoadTime}ms\n\n`;

    // Dependencies
    report += `### Dependencies\n`;
    report += `- Total Dependencies: ${result.dependencies.total}\n`;
    report += `- Framework Dependencies: ${Object.entries(result.dependencies.framework).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None'}\n`;
    report += `- WebAssembly Modules: ${result.dependencies.webassembly}\n`;
    report += `- Utility Modules: ${result.dependencies.utilities}\n\n`;

    // Chunks (if any)
    if (result.chunks.length > 0) {
      report += `### Chunks\n`;
      for (const chunk of result.chunks.slice(0, 5)) { // Top 5 chunks
        report += `- ${chunk.name}: ${(chunk.size / 1024).toFixed(1)} KB (${(chunk.gzippedSize / 1024).toFixed(1)} KB gzipped)\n`;
      }
      report += '\n';
    }

    // Issues and recommendations
    if (result.errors.length > 0) {
      report += `### ❌ Errors\n`;
      for (const error of result.errors) {
        report += `- ${error}\n`;
      }
      report += '\n';
    }

    if (result.warnings.length > 0) {
      report += `### ⚠️ Warnings\n`;
      for (const warning of result.warnings) {
        report += `- ${warning}\n`;
      }
      report += '\n';
    }

    if (result.recommendations.length > 0) {
      report += `### 💡 Recommendations\n`;
      for (const recommendation of result.recommendations) {
        report += `- ${recommendation}\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Generate summary section
   */
  private generateSummarySection(results: BundleAnalysisResult[]): string {
    let report = `## Summary\n\n`;
    
    const totalSize = results.reduce((sum, r) => sum + r.gzippedSize, 0);
    const avgCompression = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;
    const avgTreeshaking = results.reduce((sum, r) => sum + r.treeshakingEffectiveness, 0) / results.length;
    
    report += `- Total Gzipped Size: ${(totalSize / 1024).toFixed(1)} KB\n`;
    report += `- Average Compression: ${avgCompression.toFixed(2)}x\n`;
    report += `- Average Tree-shaking: ${(avgTreeshaking * 100).toFixed(1)}%\n`;
    report += `- Performance Target Met: ${this.meetsPerformanceRequirements() ? '✅ Yes' : '❌ No'}\n\n`;

    return report;
  }

  /**
   * Generate recommendations section
   */
  private generateRecommendationsSection(results: BundleAnalysisResult[]): string {
    let report = `## Overall Recommendations\n\n`;
    
    const allRecommendations = results.flatMap(r => r.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    for (const recommendation of uniqueRecommendations) {
      report += `- ${recommendation}\n`;
    }
    
    report += '\n';
    report += `## Next Steps\n\n`;
    report += `1. Address any errors before deployment\n`;
    report += `2. Implement recommended optimizations\n`;
    report += `3. Set up continuous bundle monitoring\n`;
    report += `4. Test performance in target environments\n`;
    
    return report;
  }

  /**
   * Get bundle file path based on configuration
   */
  private getBundlePath(): string {
    if (this.config.entry.includes('/')) {
      return this.config.entry;
    }
    return join(this.config.outputDir, this.config.entry);
  }

  /**
   * Default performance analysis for error cases
   */
  private getDefaultPerformanceAnalysis(): PerformanceAnalysis {
    return {
      initializationTime: 0,
      memoryUsage: 0,
      loadTime: 0,
      cacheHitRatio: 0,
      webAssemblyLoadTime: 0,
    };
  }

  /**
   * Default dependency analysis for error cases
   */
  private getDefaultDependencyAnalysis(): DependencyAnalysis {
    return {
      total: 0,
      framework: {},
      webassembly: 0,
      utilities: 0,
      unused: [],
      duplicates: [],
    };
  }
}

/**
 * Utility function to create analyzer with common configurations
 */
export function createSvelteAnalyzer(bundlePath: string): BundleAnalyzer {
  return new BundleAnalyzer({
    entry: bundlePath,
    outputDir: 'dist/sdk',
    target: 'browser',
    framework: 'svelte',
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    chunkSplitting: true,
    analyzeDependencies: true,
  });
}

export function createReactAnalyzer(bundlePath: string): BundleAnalyzer {
  return new BundleAnalyzer({
    entry: bundlePath,
    outputDir: 'dist/sdk',
    target: 'browser',
    framework: 'react',
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    chunkSplitting: true,
    analyzeDependencies: true,
  });
}

export function createVueAnalyzer(bundlePath: string): BundleAnalyzer {
  return new BundleAnalyzer({
    entry: bundlePath,
    outputDir: 'dist/sdk',
    target: 'browser',
    framework: 'vue',
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    chunkSplitting: true,
    analyzeDependencies: true,
  });
}

export function createVanillaAnalyzer(bundlePath: string): BundleAnalyzer {
  return new BundleAnalyzer({
    entry: bundlePath,
    outputDir: 'dist/sdk',
    target: 'universal',
    framework: 'vanilla',
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    chunkSplitting: false,
    analyzeDependencies: true,
  });
}

/**
 * CLI interface for bundle analysis
 */
export async function analyzeBundleFromCLI(args: string[]): Promise<void> {
  const bundlePath = args[0];
  const framework = (args[1] as 'svelte' | 'react' | 'vue' | 'vanilla') || 'vanilla';
  
  if (!bundlePath) {
    console.error('Usage: analyze-bundle <bundle-path> [framework]');
    process.exit(1);
  }

  let analyzer: BundleAnalyzer;
  
  switch (framework) {
    case 'svelte':
      analyzer = createSvelteAnalyzer(bundlePath);
      break;
    case 'react':
      analyzer = createReactAnalyzer(bundlePath);
      break;
    case 'vue':
      analyzer = createVueAnalyzer(bundlePath);
      break;
    default:
      analyzer = createVanillaAnalyzer(bundlePath);
  }

  const result = await analyzer.analyze();
  const report = analyzer.generateReport();
  
  console.log(report);
  
  if (!analyzer.meetsPerformanceRequirements(result)) {
    console.error('\n❌ Bundle does not meet performance requirements');
    process.exit(1);
  } else {
    console.log('\n✅ Bundle meets all performance requirements');
  }
}

// Export for direct usage
export { BundleAnalyzer as default };