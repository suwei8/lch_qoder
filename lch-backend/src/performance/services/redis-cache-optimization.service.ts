import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LoggerService } from '../../common/services/logger.service';

export interface CacheConfig {
  key: string;
  ttl: number; // 生存时间(秒)
  type: 'string' | 'hash' | 'list' | 'set' | 'zset';
  category: 'user' | 'order' | 'merchant' | 'product' | 'session' | 'temporary';
  description: string;
  priority: 'high' | 'medium' | 'low';
  evictionPolicy?: 'LRU' | 'LFU' | 'TTL';
}

export interface CacheMetrics {
  keyPattern: string;
  hitCount: number;
  missCount: number;
  hitRatio: number;
  memoryUsage: number;
  keyCount: number;
  avgTtl: number;
  lastAccessed: Date;
}

export interface CacheOptimizationReport {
  totalKeys: number;
  totalMemory: string;
  hitRatio: number;
  expiredKeysPerSecond: number;
  evictedKeysPerSecond: number;
  hotKeys: string[];
  coldKeys: string[];
  recommendations: {
    type: 'ttl_adjustment' | 'key_compression' | 'data_structure_optimization' | 'eviction_policy';
    priority: 'high' | 'medium' | 'low';
    description: string;
    keyPattern: string;
    expectedImpact: string;
    implementation: string;
  }[];
  performanceIssues: {
    issue: string;
    severity: 'critical' | 'warning' | 'info';
    affectedKeys: string[];
    suggestion: string;
  }[];
}

/**
 * Redis缓存策略优化服务
 * 管理缓存策略、监控性能、自动优化
 */
@Injectable()
export class RedisCacheOptimizationService implements OnModuleInit {
  private cacheConfigs: Map<string, CacheConfig> = new Map();
  private metricsHistory: Map<string, CacheMetrics[]> = new Map();

  // 模拟Redis连接，实际应该注入Redis服务
  private redis: any = {
    get: async (key: string) => null,
    set: async (key: string, value: string, ttl?: number) => 'OK',
    del: async (key: string) => 1,
    keys: async (pattern: string) => [],
    ttl: async (key: string) => -1,
    memory: { usage: async (key: string) => 0 },
    info: async () => '',
    config: { get: async (param: string) => [] }
  };

  constructor(private logger: LoggerService) {
    this.initializeCacheConfigs();
  }

  async onModuleInit() {
    this.logger.log('Redis缓存优化服务初始化', 'RedisCacheOptimizationService');
    await this.loadCacheMetrics();
  }

  /**
   * 定时任务：缓存性能分析
   * 每30分钟执行一次
   */
  @Cron('0 */30 * * * *')
  async analyzeCachePerformance() {
    try {
      this.logger.log('开始缓存性能分析', 'RedisCacheOptimizationService');
      
      const report = await this.generateOptimizationReport();
      
      // 自动应用优化建议
      await this.applyOptimizations(report);
      
      this.logger.log(`缓存性能分析完成，命中率: ${report.hitRatio}%`, 'RedisCacheOptimizationService');
    } catch (error) {
      this.logger.error(`缓存性能分析异常: ${error.message}`, error.stack, 'RedisCacheOptimizationService');
    }
  }

  /**
   * 定时任务：清理过期和冷数据
   * 每小时执行一次
   */
  @Cron('0 0 * * * *')
  async cleanupExpiredKeys() {
    try {
      this.logger.log('开始清理过期缓存', 'RedisCacheOptimizationService');
      
      const cleanupResult = await this.performCacheCleanup();
      
      this.logger.log(`缓存清理完成，清理${cleanupResult.deletedKeys}个键`, 'RedisCacheOptimizationService');
    } catch (error) {
      this.logger.error(`缓存清理异常: ${error.message}`, error.stack, 'RedisCacheOptimizationService');
    }
  }

  /**
   * 初始化缓存配置
   */
  private initializeCacheConfigs() {
    const configs: CacheConfig[] = [
      {
        key: 'user:profile:*',
        ttl: 3600, // 1小时
        type: 'hash',
        category: 'user',
        description: '用户基本信息',
        priority: 'high',
        evictionPolicy: 'LRU'
      },
      {
        key: 'user:session:*',
        ttl: 7200, // 2小时
        type: 'string',
        category: 'session',
        description: '用户会话信息',
        priority: 'high',
        evictionPolicy: 'TTL'
      },
      {
        key: 'order:detail:*',
        ttl: 1800, // 30分钟
        type: 'hash',
        category: 'order',
        description: '订单详情',
        priority: 'medium',
        evictionPolicy: 'LRU'
      },
      {
        key: 'merchant:info:*',
        ttl: 7200, // 2小时
        type: 'hash',
        category: 'merchant',
        description: '商户信息',
        priority: 'medium',
        evictionPolicy: 'LRU'
      },
      {
        key: 'product:price:*',
        ttl: 600, // 10分钟
        type: 'string',
        category: 'product',
        description: '产品价格信息',
        priority: 'high',
        evictionPolicy: 'TTL'
      },
      {
        key: 'api:rate_limit:*',
        ttl: 60, // 1分钟
        type: 'string',
        category: 'temporary',
        description: 'API频率限制',
        priority: 'high',
        evictionPolicy: 'TTL'
      },
      {
        key: 'stats:daily:*',
        ttl: 86400, // 24小时
        type: 'hash',
        category: 'temporary',
        description: '每日统计数据',
        priority: 'low',
        evictionPolicy: 'LRU'
      }
    ];

    configs.forEach(config => {
      this.cacheConfigs.set(config.key, config);
    });
  }

  /**
   * 智能缓存设置
   */
  async smartSet(key: string, value: any, options?: {
    ttl?: number;
    category?: string;
    priority?: 'high' | 'medium' | 'low';
  }): Promise<void> {
    const config = this.findBestConfig(key, options);
    const serializedValue = this.serializeValue(value, config.type);
    
    await this.redis.set(key, serializedValue, config.ttl);
    
    // 更新访问统计
    this.updateAccessMetrics(key, 'set');
    
    this.logger.debug(`缓存设置: ${key}, TTL: ${config.ttl}s`, 'RedisCacheOptimizationService');
  }

  /**
   * 智能缓存获取
   */
  async smartGet(key: string): Promise<any> {
    const startTime = Date.now();
    
    try {
      const value = await this.redis.get(key);
      const isHit = value !== null;
      
      // 更新访问统计
      this.updateAccessMetrics(key, isHit ? 'hit' : 'miss');
      
      if (isHit) {
        // 检查是否需要预刷新
        await this.checkPreRefresh(key);
        return this.deserializeValue(value);
      }
      
      return null;
    } finally {
      const duration = Date.now() - startTime;
      if (duration > 10) { // 超过10ms记录慢查询
        this.logger.warn(`缓存慢查询: ${key}, 耗时: ${duration}ms`, 'RedisCacheOptimizationService');
      }
    }
  }

  /**
   * 批量缓存操作
   */
  async smartMGet(keys: string[]): Promise<{ [key: string]: any }> {
    const pipeline = []; // 实际应该使用Redis pipeline
    const results = {};
    
    for (const key of keys) {
      try {
        const value = await this.smartGet(key);
        results[key] = value;
      } catch (error) {
        this.logger.error(`批量获取缓存失败: ${key}`, error.stack, 'RedisCacheOptimizationService');
        results[key] = null;
      }
    }
    
    return results;
  }

  /**
   * 预刷新机制
   */
  private async checkPreRefresh(key: string): Promise<void> {
    const ttl = await this.redis.ttl(key);
    const config = this.findConfigForKey(key);
    
    if (config && ttl > 0 && ttl < config.ttl * 0.2) { // TTL小于20%时预刷新
      // 这里应该触发异步刷新逻辑
      this.logger.debug(`触发预刷新: ${key}, 剩余TTL: ${ttl}s`, 'RedisCacheOptimizationService');
    }
  }

  /**
   * 生成优化报告
   */
  async generateOptimizationReport(): Promise<CacheOptimizationReport> {
    const [keyStats, memoryInfo, performanceMetrics] = await Promise.all([
      this.getKeyStatistics(),
      this.getMemoryInfo(),
      this.getPerformanceMetrics()
    ]);

    const recommendations = this.generateRecommendations(keyStats, memoryInfo, performanceMetrics);
    const performanceIssues = this.identifyPerformanceIssues(performanceMetrics);

    return {
      totalKeys: keyStats.totalKeys,
      totalMemory: memoryInfo.totalMemory,
      hitRatio: performanceMetrics.overallHitRatio,
      expiredKeysPerSecond: performanceMetrics.expiredKeysPerSecond,
      evictedKeysPerSecond: performanceMetrics.evictedKeysPerSecond,
      hotKeys: performanceMetrics.hotKeys,
      coldKeys: performanceMetrics.coldKeys,
      recommendations,
      performanceIssues
    };
  }

  /**
   * 应用优化策略
   */
  async applyOptimizations(report: CacheOptimizationReport): Promise<{
    applied: number;
    failed: number;
    details: any[];
  }> {
    const results = {
      applied: 0,
      failed: 0,
      details: []
    };

    for (const recommendation of report.recommendations) {
      try {
        switch (recommendation.type) {
          case 'ttl_adjustment':
            await this.adjustTTL(recommendation.keyPattern, recommendation);
            break;
          case 'key_compression':
            await this.compressKeys(recommendation.keyPattern);
            break;
          case 'data_structure_optimization':
            await this.optimizeDataStructure(recommendation.keyPattern);
            break;
          case 'eviction_policy':
            await this.adjustEvictionPolicy(recommendation);
            break;
        }
        
        results.applied++;
        results.details.push({
          type: recommendation.type,
          status: 'applied',
          description: recommendation.description
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          type: recommendation.type,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 缓存预热
   */
  async preWarmCache(patterns: string[]): Promise<{
    warmed: number;
    failed: number;
    details: any[];
  }> {
    const results = {
      warmed: 0,
      failed: 0,
      details: []
    };

    for (const pattern of patterns) {
      try {
        const warmupData = await this.generateWarmupData(pattern);
        
        for (const [key, value] of Object.entries(warmupData)) {
          await this.smartSet(key, value);
          results.warmed++;
        }
        
        results.details.push({
          pattern,
          status: 'success',
          count: Object.keys(warmupData).length
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          pattern,
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStatistics(): Promise<{
    overview: any;
    keyPatterns: CacheMetrics[];
    performance: any;
    memory: any;
  }> {
    const [keyStats, performanceMetrics, memoryInfo] = await Promise.all([
      this.getKeyStatistics(),
      this.getPerformanceMetrics(),
      this.getMemoryInfo()
    ]);

    const keyPatterns = Array.from(this.metricsHistory.values())
      .flat()
      .reduce((acc, metric) => {
        const existing = acc.find(m => m.keyPattern === metric.keyPattern);
        if (existing) {
          existing.hitCount += metric.hitCount;
          existing.missCount += metric.missCount;
          existing.memoryUsage += metric.memoryUsage;
        } else {
          acc.push({ ...metric });
        }
        return acc;
      }, [] as CacheMetrics[]);

    return {
      overview: {
        totalKeys: keyStats.totalKeys,
        totalMemory: memoryInfo.totalMemory,
        hitRatio: performanceMetrics.overallHitRatio,
        connectedClients: memoryInfo.connectedClients
      },
      keyPatterns,
      performance: performanceMetrics,
      memory: memoryInfo
    };
  }

  // 私有辅助方法

  private findBestConfig(key: string, options?: any): CacheConfig {
    // 查找匹配的配置
    for (const [pattern, config] of this.cacheConfigs) {
      if (this.matchesPattern(key, pattern)) {
        return {
          ...config,
          ttl: options?.ttl || config.ttl
        };
      }
    }

    // 默认配置
    return {
      key: key,
      ttl: options?.ttl || 3600,
      type: 'string',
      category: options?.category || 'temporary',
      description: '默认缓存配置',
      priority: options?.priority || 'medium'
    };
  }

  private findConfigForKey(key: string): CacheConfig | null {
    for (const [pattern, config] of this.cacheConfigs) {
      if (this.matchesPattern(key, pattern)) {
        return config;
      }
    }
    return null;
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  private serializeValue(value: any, type: string): string {
    switch (type) {
      case 'hash':
        return JSON.stringify(value);
      case 'list':
        return JSON.stringify(Array.isArray(value) ? value : [value]);
      default:
        return typeof value === 'string' ? value : JSON.stringify(value);
    }
  }

  private deserializeValue(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private updateAccessMetrics(key: string, type: 'set' | 'hit' | 'miss'): void {
    const pattern = this.findPatternForKey(key);
    
    if (!this.metricsHistory.has(pattern)) {
      this.metricsHistory.set(pattern, []);
    }

    const metrics = this.metricsHistory.get(pattern);
    const today = new Date().toDateString();
    let todayMetric = metrics.find(m => m.lastAccessed.toDateString() === today);

    if (!todayMetric) {
      todayMetric = {
        keyPattern: pattern,
        hitCount: 0,
        missCount: 0,
        hitRatio: 0,
        memoryUsage: 0,
        keyCount: 0,
        avgTtl: 0,
        lastAccessed: new Date()
      };
      metrics.push(todayMetric);
    }

    switch (type) {
      case 'hit':
        todayMetric.hitCount++;
        break;
      case 'miss':
        todayMetric.missCount++;
        break;
      case 'set':
        todayMetric.keyCount++;
        break;
    }

    todayMetric.hitRatio = todayMetric.hitCount / (todayMetric.hitCount + todayMetric.missCount) * 100;
    todayMetric.lastAccessed = new Date();

    // 保持最近30天的数据
    if (metrics.length > 30) {
      metrics.splice(0, metrics.length - 30);
    }
  }

  private findPatternForKey(key: string): string {
    for (const pattern of this.cacheConfigs.keys()) {
      if (this.matchesPattern(key, pattern)) {
        return pattern;
      }
    }
    return 'unknown:*';
  }

  private async loadCacheMetrics(): Promise<void> {
    // 这里应该从Redis或持久化存储加载历史指标
    this.logger.log('加载缓存指标完成', 'RedisCacheOptimizationService');
  }

  private async getKeyStatistics(): Promise<any> {
    // 模拟数据，实际应该从Redis获取
    return {
      totalKeys: 15234,
      keysByType: {
        string: 8945,
        hash: 4523,
        list: 1234,
        set: 432,
        zset: 100
      },
      keysByTTL: {
        persistent: 2345,
        expiring: 12889
      }
    };
  }

  private async getMemoryInfo(): Promise<any> {
    // 模拟数据，实际应该从Redis INFO命令获取
    return {
      totalMemory: '256 MB',
      usedMemory: '189 MB',
      peakMemory: '234 MB',
      connectedClients: 45,
      keyspaceHits: 1234567,
      keyspaceMisses: 89234
    };
  }

  private async getPerformanceMetrics(): Promise<any> {
    // 模拟数据，实际应该从Redis统计获取
    return {
      overallHitRatio: 92.3,
      expiredKeysPerSecond: 15.6,
      evictedKeysPerSecond: 2.3,
      hotKeys: ['user:profile:123', 'product:price:456', 'session:abc123'],
      coldKeys: ['stats:daily:2024-01-01', 'temp:data:xyz', 'cache:old:data'],
      avgResponseTime: 1.2
    };
  }

  private generateRecommendations(keyStats: any, memoryInfo: any, performance: any): any[] {
    const recommendations = [];

    // TTL调整建议
    if (performance.expiredKeysPerSecond > 100) {
      recommendations.push({
        type: 'ttl_adjustment',
        priority: 'medium',
        description: '部分键的TTL设置过短，建议适当延长',
        keyPattern: 'user:session:*',
        expectedImpact: '减少15%的缓存未命中',
        implementation: '将用户会话TTL从1小时调整为2小时'
      });
    }

    // 内存优化建议
    if (memoryInfo.usedMemory > memoryInfo.totalMemory * 0.8) {
      recommendations.push({
        type: 'key_compression',
        priority: 'high',
        description: '内存使用率过高，建议压缩数据或清理冷数据',
        keyPattern: 'stats:*',
        expectedImpact: '减少30%内存使用',
        implementation: '压缩统计数据或缩短TTL'
      });
    }

    return recommendations;
  }

  private identifyPerformanceIssues(metrics: any): any[] {
    const issues = [];

    if (metrics.overallHitRatio < 80) {
      issues.push({
        issue: '缓存命中率过低',
        severity: 'critical' as const,
        affectedKeys: metrics.coldKeys,
        suggestion: '检查缓存策略和键的使用模式'
      });
    }

    if (metrics.avgResponseTime > 5) {
      issues.push({
        issue: '平均响应时间过长',
        severity: 'warning' as const,
        affectedKeys: metrics.hotKeys,
        suggestion: '考虑数据结构优化或网络延迟问题'
      });
    }

    return issues;
  }

  private async performCacheCleanup(): Promise<{ deletedKeys: number }> {
    // 模拟清理过程
    return { deletedKeys: 234 };
  }

  private async adjustTTL(pattern: string, recommendation: any): Promise<void> {
    const config = this.cacheConfigs.get(pattern);
    if (config) {
      config.ttl = Math.floor(config.ttl * 1.5); // 延长50%
      this.logger.log(`调整TTL: ${pattern}, 新TTL: ${config.ttl}s`, 'RedisCacheOptimizationService');
    }
  }

  private async compressKeys(pattern: string): Promise<void> {
    this.logger.log(`压缩键: ${pattern}`, 'RedisCacheOptimizationService');
  }

  private async optimizeDataStructure(pattern: string): Promise<void> {
    this.logger.log(`优化数据结构: ${pattern}`, 'RedisCacheOptimizationService');
  }

  private async adjustEvictionPolicy(recommendation: any): Promise<void> {
    this.logger.log(`调整淘汰策略: ${recommendation.keyPattern}`, 'RedisCacheOptimizationService');
  }

  private async generateWarmupData(pattern: string): Promise<{ [key: string]: any }> {
    // 根据模式生成预热数据
    const data = {};
    
    if (pattern.includes('user:profile')) {
      // 生成用户资料预热数据
      for (let i = 1; i <= 100; i++) {
        data[`user:profile:${i}`] = {
          id: i,
          nickname: `User${i}`,
          avatar: `avatar${i}.jpg`
        };
      }
    }

    return data;
  }
}