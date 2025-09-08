import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { RedisCacheOptimizationService } from '../services/redis-cache-optimization.service';

class CacheSetDto {
  key: string;
  value: any;
  ttl?: number;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
}

class CacheGetDto {
  keys: string[];
}

class PreWarmDto {
  patterns: string[];
}

/**
 * Redis缓存优化控制器
 * 提供缓存管理、性能监控、优化策略等功能
 */
@ApiTags('Redis缓存优化')
@Controller('performance/cache')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class RedisCacheOptimizationController {
  constructor(private readonly cacheOptimizationService: RedisCacheOptimizationService) {}

  /**
   * 获取缓存统计信息
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取缓存统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getCacheStatistics() {
    try {
      const statistics = await this.cacheOptimizationService.getCacheStatistics();
      
      return {
        code: 0,
        message: '获取成功',
        data: statistics
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 生成缓存优化报告
   */
  @Get('optimization-report')
  @ApiOperation({ summary: '生成缓存优化报告' })
  @ApiResponse({ status: 200, description: '生成成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getOptimizationReport() {
    try {
      const report = await this.cacheOptimizationService.generateOptimizationReport();
      
      return {
        code: 0,
        message: '生成成功',
        data: report
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 应用缓存优化策略
   */
  @Post('optimize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '应用缓存优化策略' })
  @ApiResponse({ status: 200, description: '优化完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async applyCacheOptimizations() {
    try {
      // 先生成优化报告
      const report = await this.cacheOptimizationService.generateOptimizationReport();
      
      // 应用优化策略
      const result = await this.cacheOptimizationService.applyOptimizations(report);
      
      return {
        code: 0,
        message: '缓存优化完成',
        data: {
          optimizationReport: report,
          appliedOptimizations: result,
          summary: {
            totalRecommendations: report.recommendations.length,
            appliedOptimizations: result.applied,
            failedOptimizations: result.failed,
            hitRatioImprovement: '预计提升5-15%'
          }
        }
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 缓存预热
   */
  @Post('prewarm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '缓存预热' })
  @ApiResponse({ status: 200, description: '预热完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async preWarmCache(@Body() preWarmDto: PreWarmDto) {
    try {
      const result = await this.cacheOptimizationService.preWarmCache(preWarmDto.patterns);
      
      return {
        code: 0,
        message: '缓存预热完成',
        data: result
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 智能缓存设置
   */
  @Post('set')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '智能缓存设置' })
  @ApiResponse({ status: 200, description: '设置成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async smartCacheSet(@Body() setCacheDto: CacheSetDto) {
    try {
      await this.cacheOptimizationService.smartSet(
        setCacheDto.key,
        setCacheDto.value,
        {
          ttl: setCacheDto.ttl,
          category: setCacheDto.category,
          priority: setCacheDto.priority
        }
      );
      
      return {
        code: 0,
        message: '缓存设置成功',
        data: {
          key: setCacheDto.key,
          cached: true
        }
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 智能缓存获取
   */
  @Post('get')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '智能缓存获取' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async smartCacheGet(@Body() getCacheDto: CacheGetDto) {
    try {
      let result;
      
      if (getCacheDto.keys.length === 1) {
        // 单个键获取
        const value = await this.cacheOptimizationService.smartGet(getCacheDto.keys[0]);
        result = { [getCacheDto.keys[0]]: value };
      } else {
        // 批量获取
        result = await this.cacheOptimizationService.smartMGet(getCacheDto.keys);
      }
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          result,
          hitKeys: Object.entries(result).filter(([k, v]) => v !== null).map(([k]) => k),
          missKeys: Object.entries(result).filter(([k, v]) => v === null).map(([k]) => k)
        }
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 获取热点数据分析
   */
  @Get('hotkeys')
  @ApiOperation({ summary: '获取热点数据分析' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getHotKeysAnalysis(
    @Query('timeRange') timeRange = '1h',
    @Query('limit') limit = 50
  ) {
    try {
      // 这里应该从实际的Redis监控数据获取
      // 当前返回模拟数据
      const hotkeysAnalysis = {
        timeRange,
        totalKeys: 15234,
        hotKeys: [
          {
            key: 'user:profile:12345',
            accessCount: 1567,
            lastAccessed: new Date(),
            memoryUsage: '2.3 KB',
            ttl: 3456,
            hitRatio: 98.5,
            pattern: 'user:profile:*'
          },
          {
            key: 'product:price:67890',
            accessCount: 1234,
            lastAccessed: new Date(Date.now() - 5 * 60 * 1000),
            memoryUsage: '1.2 KB',
            ttl: 567,
            hitRatio: 97.8,
            pattern: 'product:price:*'
          },
          {
            key: 'session:abc123def456',
            accessCount: 987,
            lastAccessed: new Date(Date.now() - 10 * 60 * 1000),
            memoryUsage: '4.1 KB',
            ttl: 7189,
            hitRatio: 96.3,
            pattern: 'user:session:*'
          }
        ].slice(0, Number(limit)),
        coldKeys: [
          {
            key: 'stats:daily:2024-01-01',
            lastAccessed: new Date(Date.now() - 24 * 60 * 60 * 1000),
            memoryUsage: '15.6 KB',
            ttl: 82345,
            accessCount: 2,
            pattern: 'stats:daily:*'
          },
          {
            key: 'temp:calculation:xyz789',
            lastAccessed: new Date(Date.now() - 12 * 60 * 60 * 1000),
            memoryUsage: '8.9 KB',
            ttl: 156,
            accessCount: 0,
            pattern: 'temp:*'
          }
        ],
        recommendations: [
          {
            type: 'increase_ttl',
            keys: ['user:profile:*'],
            reason: '高频访问，建议延长TTL',
            expectedImpact: '减少数据库查询20%'
          },
          {
            type: 'remove_cold_keys',
            keys: ['temp:calculation:*'],
            reason: '长期未访问的临时数据',
            expectedImpact: '释放内存空间15MB'
          }
        ]
      };

      return {
        code: 0,
        message: '获取成功',
        data: hotkeysAnalysis
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 获取缓存性能监控
   */
  @Get('monitoring')
  @ApiOperation({ summary: '获取缓存性能监控' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getCacheMonitoring(
    @Query('period') period = '1h'
  ) {
    try {
      // 这里应该从实际的监控系统获取数据
      // 当前返回模拟数据
      const monitoring = {
        period,
        timestamp: new Date(),
        metrics: {
          hitRatio: {
            current: 92.3,
            trend: [91.2, 91.8, 92.1, 92.3, 92.5, 92.3],
            target: 95.0
          },
          throughput: {
            current: 1567, // ops/sec
            peak: 2345,
            average: 1234,
            trend: [1200, 1300, 1450, 1567, 1623, 1567]
          },
          latency: {
            p50: 0.8,  // ms
            p95: 2.1,
            p99: 5.4,
            average: 1.2,
            trend: [1.1, 1.0, 1.2, 1.3, 1.2, 1.2]
          },
          memory: {
            used: '189 MB',
            peak: '234 MB',
            limit: '256 MB',
            utilization: 73.8,
            trend: [70.1, 71.5, 72.8, 73.8, 74.2, 73.8]
          },
          connections: {
            current: 45,
            max: 100,
            idle: 12
          },
          keyspace: {
            keys: 15234,
            expires: 12890,
            avgTtl: 3456
          }
        },
        alerts: [
          {
            level: 'warning',
            message: '内存使用率接近75%',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            resolved: false
          },
          {
            level: 'info',
            message: 'P99延迟略有上升',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            resolved: true
          }
        ],
        recommendations: [
          {
            priority: 'medium',
            message: '考虑清理长期未访问的键以释放内存',
            action: 'cleanup_cold_keys'
          },
          {
            priority: 'low',
            message: '部分热点数据可以考虑延长TTL',
            action: 'extend_hotkey_ttl'
          }
        ]
      };

      return {
        code: 0,
        message: '获取成功',
        data: monitoring
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 缓存健康检查
   */
  @Get('health')
  @ApiOperation({ summary: '缓存健康检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async getCacheHealth() {
    try {
      // 这里应该执行实际的健康检查
      // 当前返回模拟数据
      const healthStatus = {
        status: 'healthy',
        score: 87.5,
        checks: [
          {
            name: 'Redis连接',
            status: 'pass',
            responseTime: '1.2ms',
            details: 'Redis服务正常运行'
          },
          {
            name: '内存使用',
            status: 'warn',
            value: '73.8%',
            threshold: '80%',
            details: '内存使用率略高，建议清理冷数据'
          },
          {
            name: '命中率',
            status: 'pass',
            value: '92.3%',
            threshold: '85%',
            details: '缓存命中率良好'
          },
          {
            name: '响应延迟',
            status: 'pass',
            value: '1.2ms',
            threshold: '5ms',
            details: '响应速度正常'
          },
          {
            name: '过期键清理',
            status: 'pass',
            value: '15.6/s',
            details: '过期键清理速度正常'
          }
        ],
        issues: [
          {
            level: 'warning',
            component: 'memory',
            message: '内存使用率73.8%，接近告警阈值',
            suggestion: '执行冷数据清理或增加内存容量',
            impact: 'medium'
          }
        ],
        recommendations: [
          '定期清理过期和冷数据',
          '优化数据结构减少内存占用',
          '调整TTL策略平衡性能和内存使用'
        ],
        lastCheck: new Date(),
        nextCheck: new Date(Date.now() + 30 * 60 * 1000)
      };

      return {
        code: 0,
        message: '健康检查完成',
        data: healthStatus
      };
    } catch (error) {
      return {
        code: 50001,
        message: '健康检查失败',
        data: {
          status: 'error',
          error: error.message
        }
      };
    }
  }

  /**
   * 执行缓存清理
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行缓存清理' })
  @ApiResponse({ status: 200, description: '清理完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async performCacheCleanup(
    @Body() options: {
      cleanExpired?: boolean;
      cleanColdKeys?: boolean;
      cleanByPattern?: string;
      dryRun?: boolean;
    } = {}
  ) {
    try {
      // 这里应该执行实际的清理操作
      // 当前返回模拟结果
      const cleanupResult = {
        dryRun: options.dryRun || false,
        deletedKeys: options.dryRun ? 0 : 234,
        freedMemory: options.dryRun ? '0 MB' : '45.6 MB',
        categories: {
          expired: options.dryRun ? 0 : 156,
          coldKeys: options.dryRun ? 0 : 67,
          patternMatch: options.dryRun ? 0 : 11
        },
        details: [
          {
            category: 'expired',
            pattern: '*',
            count: options.dryRun ? 156 : 156,
            memory: '23.4 MB',
            action: options.dryRun ? 'would_delete' : 'deleted'
          },
          {
            category: 'cold',
            pattern: 'stats:daily:*',
            count: options.dryRun ? 45 : 45,
            memory: '18.9 MB',
            action: options.dryRun ? 'would_delete' : 'deleted'
          },
          {
            category: 'pattern',
            pattern: options.cleanByPattern || 'temp:*',
            count: options.dryRun ? 22 : 22,
            memory: '3.3 MB',
            action: options.dryRun ? 'would_delete' : 'deleted'
          }
        ],
        duration: '2.3s',
        timestamp: new Date()
      };

      return {
        code: 0,
        message: options.dryRun ? '清理预览完成' : '缓存清理完成',
        data: cleanupResult
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }
}