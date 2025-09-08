import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { LoggerService } from '../../common/services/logger.service';

export interface ApiPerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  contentLength: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

export interface ApiOptimizationReport {
  slowEndpoints: {
    endpoint: string;
    avgResponseTime: number;
    callCount: number;
    maxResponseTime: number;
    p95ResponseTime: number;
  }[];
  errorRates: {
    endpoint: string;
    errorRate: number;
    totalCalls: number;
    errorCount: number;
  }[];
  recommendations: {
    type: 'caching' | 'indexing' | 'pagination' | 'compression' | 'optimization';
    endpoint: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImprovement: string;
    implementation: string;
  }[];
  overallMetrics: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalRequests: number;
    errorRate: number;
    throughput: number; // requests per second
  };
}

/**
 * API性能优化服务
 * 监控API响应时间，分析性能瓶颈，提供优化建议
 */
@Injectable()
export class ApiOptimizationService implements NestInterceptor {
  private metrics: ApiPerformanceMetrics[] = [];
  private slowQueryThreshold = 1000; // 1秒
  private maxMetricsHistory = 10000; // 最大保存10000条记录

  constructor(private logger: LoggerService) {}

  /**
   * NestJS拦截器接口实现
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // 记录性能指标
        this.recordMetrics({
          endpoint: `${request.method} ${request.route?.path || request.url}`,
          method: request.method,
          responseTime,
          statusCode: response.statusCode,
          contentLength: response.get('content-length') || 0,
          timestamp: new Date(),
          userAgent: request.get('user-agent'),
          ip: request.ip
        });

        // 慢查询告警
        if (responseTime > this.slowQueryThreshold) {
          this.logger.warn(
            `慢API检测: ${request.method} ${request.url}, 响应时间: ${responseTime}ms`,
            'ApiOptimizationService'
          );
        }
      }),
      map((data) => {
        // 可以在这里添加响应数据压缩等优化
        return this.optimizeResponse(data);
      })
    );
  }

  /**
   * 记录性能指标
   */
  private recordMetrics(metric: ApiPerformanceMetrics): void {
    this.metrics.push(metric);
    
    // 保持最近的记录数限制
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  /**
   * 优化响应数据
   */
  private optimizeResponse(data: any): any {
    // 移除空值字段以减少响应大小
    if (typeof data === 'object' && data !== null) {
      return this.removeEmptyFields(data);
    }
    return data;
  }

  /**
   * 移除空值字段
   */
  private removeEmptyFields(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.removeEmptyFields(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key] = this.removeEmptyFields(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * 生成API优化报告
   */
  async generateOptimizationReport(): Promise<ApiOptimizationReport> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // 筛选最近24小时的数据
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > oneDayAgo
    );

    // 按端点分组统计
    const endpointStats = this.groupMetricsByEndpoint(recentMetrics);
    
    // 识别慢接口
    const slowEndpoints = this.identifySlowEndpoints(endpointStats);
    
    // 计算错误率
    const errorRates = this.calculateErrorRates(endpointStats);
    
    // 生成优化建议
    const recommendations = this.generateRecommendations(slowEndpoints, errorRates);
    
    // 计算总体指标
    const overallMetrics = this.calculateOverallMetrics(recentMetrics);

    return {
      slowEndpoints,
      errorRates,
      recommendations,
      overallMetrics
    };
  }

  /**
   * 按端点分组统计
   */
  private groupMetricsByEndpoint(metrics: ApiPerformanceMetrics[]): Map<string, ApiPerformanceMetrics[]> {
    const grouped = new Map<string, ApiPerformanceMetrics[]>();
    
    metrics.forEach(metric => {
      const key = metric.endpoint;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(metric);
    });
    
    return grouped;
  }

  /**
   * 识别慢接口
   */
  private identifySlowEndpoints(endpointStats: Map<string, ApiPerformanceMetrics[]>): any[] {
    const slowEndpoints = [];
    
    endpointStats.forEach((metrics, endpoint) => {
      const responseTimes = metrics.map(m => m.responseTime);
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
      
      if (avgResponseTime > 500 || p95ResponseTime > 1000) { // 平均>500ms或P95>1s
        slowEndpoints.push({
          endpoint,
          avgResponseTime: Math.round(avgResponseTime),
          callCount: metrics.length,
          maxResponseTime,
          p95ResponseTime: Math.round(p95ResponseTime)
        });
      }
    });
    
    return slowEndpoints.sort((a, b) => b.avgResponseTime - a.avgResponseTime);
  }

  /**
   * 计算错误率
   */
  private calculateErrorRates(endpointStats: Map<string, ApiPerformanceMetrics[]>): any[] {
    const errorRates = [];
    
    endpointStats.forEach((metrics, endpoint) => {
      const totalCalls = metrics.length;
      const errorCount = metrics.filter(m => m.statusCode >= 400).length;
      const errorRate = (errorCount / totalCalls) * 100;
      
      if (errorRate > 1) { // 错误率超过1%
        errorRates.push({
          endpoint,
          errorRate: Math.round(errorRate * 100) / 100,
          totalCalls,
          errorCount
        });
      }
    });
    
    return errorRates.sort((a, b) => b.errorRate - a.errorRate);
  }

  /**
   * 生成优化建议
   */
  private generateRecommendations(slowEndpoints: any[], errorRates: any[]): any[] {
    const recommendations = [];

    // 基于慢接口生成建议
    slowEndpoints.forEach(endpoint => {
      if (endpoint.avgResponseTime > 2000) {
        recommendations.push({
          type: 'caching' as const,
          endpoint: endpoint.endpoint,
          priority: 'high' as const,
          description: `${endpoint.endpoint} 平均响应时间${endpoint.avgResponseTime}ms，建议添加缓存`,
          expectedImprovement: '响应时间减少50-80%',
          implementation: '实现Redis缓存或内存缓存'
        });
      }

      if (endpoint.endpoint.includes('GET') && endpoint.avgResponseTime > 1000) {
        recommendations.push({
          type: 'indexing' as const,
          endpoint: endpoint.endpoint,
          priority: 'medium' as const,
          description: '查询接口响应较慢，可能需要数据库索引优化',
          expectedImprovement: '查询速度提升30-70%',
          implementation: '添加相关字段的数据库索引'
        });
      }

      if (endpoint.endpoint.includes('list') || endpoint.endpoint.includes('search')) {
        recommendations.push({
          type: 'pagination' as const,
          endpoint: endpoint.endpoint,
          priority: 'medium' as const,
          description: '列表查询建议实现分页以减少响应时间',
          expectedImprovement: '减少数据传输量，提升响应速度',
          implementation: '实现基于游标或偏移的分页机制'
        });
      }
    });

    // 基于错误率生成建议
    errorRates.forEach(endpoint => {
      if (endpoint.errorRate > 5) {
        recommendations.push({
          type: 'optimization' as const,
          endpoint: endpoint.endpoint,
          priority: 'high' as const,
          description: `${endpoint.endpoint} 错误率${endpoint.errorRate}%，需要优化错误处理`,
          expectedImprovement: '提升服务稳定性',
          implementation: '优化错误处理逻辑，添加重试机制'
        });
      }
    });

    return recommendations;
  }

  /**
   * 计算总体指标
   */
  private calculateOverallMetrics(metrics: ApiPerformanceMetrics[]): any {
    if (metrics.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        throughput: 0
      };
    }

    const responseTimes = metrics.map(m => m.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);
    
    const totalRequests = metrics.length;
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;
    
    // 计算吞吐量（按最近1小时）
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentMetrics = metrics.filter(m => m.timestamp.getTime() > oneHourAgo);
    const throughput = recentMetrics.length / 60; // 每分钟请求数

    return {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      p99ResponseTime: Math.round(p99ResponseTime),
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100
    };
  }

  /**
   * 计算百分位数
   */
  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  /**
   * 获取实时性能指标
   */
  getRealTimeMetrics(): {
    currentRPS: number;
    avgResponseTime: number;
    activeConnections: number;
    memoryUsage: string;
  } {
    const now = Date.now();
    const lastMinute = now - 60 * 1000;
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > lastMinute
    );

    const currentRPS = recentMetrics.length / 60;
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    return {
      currentRPS: Math.round(currentRPS * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      activeConnections: recentMetrics.length, // 简化实现
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
    };
  }

  /**
   * 获取热点API
   */
  getHotspotAPIs(limit = 10): {
    endpoint: string;
    callCount: number;
    avgResponseTime: number;
    totalTime: number;
  }[] {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const recentMetrics = this.metrics.filter(
      m => m.timestamp.getTime() > oneDayAgo
    );

    const endpointStats = this.groupMetricsByEndpoint(recentMetrics);
    const hotspots = [];

    endpointStats.forEach((metrics, endpoint) => {
      const callCount = metrics.length;
      const totalTime = metrics.reduce((sum, m) => sum + m.responseTime, 0);
      const avgResponseTime = totalTime / callCount;

      hotspots.push({
        endpoint,
        callCount,
        avgResponseTime: Math.round(avgResponseTime),
        totalTime: Math.round(totalTime)
      });
    });

    return hotspots
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, limit);
  }

  /**
   * 清理历史数据
   */
  cleanupOldMetrics(daysToKeep = 7): number {
    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;
    const originalLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(
      m => m.timestamp.getTime() > cutoffTime
    );

    const removedCount = originalLength - this.metrics.length;
    this.logger.log(`清理了${removedCount}条历史API指标数据`, 'ApiOptimizationService');
    
    return removedCount;
  }

  /**
   * 获取API性能统计
   */
  getApiStatistics(hours = 24): {
    timeRange: string;
    totalRequests: number;
    uniqueEndpoints: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: any[];
    performanceTrend: any[];
  } {
    const now = Date.now();
    const cutoffTime = now - hours * 60 * 60 * 1000;
    
    const metrics = this.metrics.filter(
      m => m.timestamp.getTime() > cutoffTime
    );

    const uniqueEndpoints = new Set(metrics.map(m => m.endpoint)).size;
    const totalRequests = metrics.length;
    const averageResponseTime = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
      : 0;
    
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // 获取Top端点
    const endpointStats = this.groupMetricsByEndpoint(metrics);
    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, metrics]) => ({
        endpoint,
        requests: metrics.length,
        avgResponseTime: Math.round(
          metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length
        )
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    // 生成性能趋势（按小时）
    const performanceTrend = [];
    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;
      
      const hourMetrics = metrics.filter(
        m => m.timestamp.getTime() >= hourStart && m.timestamp.getTime() < hourEnd
      );

      performanceTrend.push({
        hour: new Date(hourStart).getHours(),
        requests: hourMetrics.length,
        avgResponseTime: hourMetrics.length > 0
          ? Math.round(hourMetrics.reduce((sum, m) => sum + m.responseTime, 0) / hourMetrics.length)
          : 0,
        errorRate: hourMetrics.length > 0
          ? Math.round((hourMetrics.filter(m => m.statusCode >= 400).length / hourMetrics.length) * 100 * 100) / 100
          : 0
      });
    }

    return {
      timeRange: `${hours}小时`,
      totalRequests,
      uniqueEndpoints,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topEndpoints,
      performanceTrend
    };
  }
}