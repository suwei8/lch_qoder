import {
  Controller,
  Get,
  Post,
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
import { ApiOptimizationService } from '../services/api-optimization.service';

/**
 * API性能优化控制器
 * 提供API性能监控、优化建议、实时指标等功能
 */
@ApiTags('API性能优化')
@Controller('performance/api')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class ApiOptimizationController {
  constructor(private readonly apiOptimizationService: ApiOptimizationService) {}

  /**
   * 获取API优化报告
   */
  @Get('optimization-report')
  @ApiOperation({ summary: '获取API优化报告' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getOptimizationReport() {
    try {
      const report = await this.apiOptimizationService.generateOptimizationReport();
      
      return {
        code: 0,
        message: '获取成功',
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
   * 获取实时性能指标
   */
  @Get('realtime-metrics')
  @ApiOperation({ summary: '获取实时性能指标' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getRealTimeMetrics() {
    try {
      const metrics = this.apiOptimizationService.getRealTimeMetrics();
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          ...metrics,
          timestamp: new Date(),
          status: 'healthy'
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
   * 获取热点API列表
   */
  @Get('hotspot-apis')
  @ApiOperation({ summary: '获取热点API列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getHotspotAPIs(
    @Query('limit') limit = 10
  ) {
    try {
      const hotspots = this.apiOptimizationService.getHotspotAPIs(Number(limit));
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          hotspots,
          total: hotspots.length,
          limit: Number(limit)
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
   * 获取API性能统计
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取API性能统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getApiStatistics(
    @Query('hours') hours = 24
  ) {
    try {
      const statistics = this.apiOptimizationService.getApiStatistics(Number(hours));
      
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
   * 清理历史数据
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '清理历史性能数据' })
  @ApiResponse({ status: 200, description: '清理完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async cleanupOldMetrics(
    @Query('days') days = 7
  ) {
    try {
      const removedCount = this.apiOptimizationService.cleanupOldMetrics(Number(days));
      
      return {
        code: 0,
        message: '清理完成',
        data: {
          removedCount,
          daysKept: Number(days),
          cleanupTime: new Date()
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
   * 获取API性能趋势
   */
  @Get('trends')
  @ApiOperation({ summary: '获取API性能趋势' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getPerformanceTrends(
    @Query('period') period = '24h'
  ) {
    try {
      // 根据period参数确定时间范围
      let hours = 24;
      switch (period) {
        case '1h': hours = 1; break;
        case '6h': hours = 6; break;
        case '12h': hours = 12; break;
        case '24h': hours = 24; break;
        case '7d': hours = 24 * 7; break;
        default: hours = 24;
      }

      const statistics = this.apiOptimizationService.getApiStatistics(hours);
      
      return {
        code: 0,
        message: '获取成功',
        data: {
          period,
          trends: statistics.performanceTrend,
          summary: {
            totalRequests: statistics.totalRequests,
            averageResponseTime: statistics.averageResponseTime,
            errorRate: statistics.errorRate,
            uniqueEndpoints: statistics.uniqueEndpoints
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
   * 获取API健康检查
   */
  @Get('health')
  @ApiOperation({ summary: 'API健康检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  async getApiHealth() {
    try {
      const realTimeMetrics = this.apiOptimizationService.getRealTimeMetrics();
      const hotspots = this.apiOptimizationService.getHotspotAPIs(5);
      
      // 健康评分计算
      let healthScore = 100;
      
      // 基于响应时间评分
      if (realTimeMetrics.avgResponseTime > 2000) {
        healthScore -= 30;
      } else if (realTimeMetrics.avgResponseTime > 1000) {
        healthScore -= 15;
      } else if (realTimeMetrics.avgResponseTime > 500) {
        healthScore -= 5;
      }
      
      // 基于RPS评分
      if (realTimeMetrics.currentRPS > 100) {
        healthScore -= 10; // 高负载
      }

      const status = healthScore >= 80 ? 'healthy' : 
                    healthScore >= 60 ? 'warning' : 'critical';

      const issues = [];
      const recommendations = [];

      if (realTimeMetrics.avgResponseTime > 1000) {
        issues.push({
          level: 'warning',
          message: `平均响应时间${realTimeMetrics.avgResponseTime}ms，较慢`,
          component: 'response_time'
        });
        recommendations.push('优化慢查询和数据库索引');
      }

      if (realTimeMetrics.currentRPS > 50) {
        issues.push({
          level: 'info',
          message: `当前RPS为${realTimeMetrics.currentRPS}，负载较高`,
          component: 'throughput'
        });
        recommendations.push('考虑添加缓存或负载均衡');
      }

      return {
        code: 0,
        message: '健康检查完成',
        data: {
          status,
          score: healthScore,
          timestamp: new Date(),
          metrics: realTimeMetrics,
          hotspots,
          issues,
          recommendations
        }
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
}