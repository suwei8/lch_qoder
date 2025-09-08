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
import { DatabaseOptimizationService } from '../services/database-optimization.service';

class ExecutionPlanDto {
  sql: string;
}

/**
 * 数据库性能优化控制器
 * 提供数据库性能监控、优化建议、健康检查等功能
 */
@ApiTags('数据库性能优化')
@Controller('performance/database')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DatabaseOptimizationController {
  constructor(private readonly databaseOptimizationService: DatabaseOptimizationService) {}

  /**
   * 获取数据库健康报告
   */
  @Get('health-report')
  @ApiOperation({ summary: '获取数据库健康报告' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getDatabaseHealthReport() {
    try {
      const healthReport = await this.databaseOptimizationService.generateHealthReport();
      
      return {
        code: 0,
        message: '获取成功',
        data: healthReport
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 获取性能统计信息
   */
  @Get('statistics')
  @ApiOperation({ summary: '获取性能统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getPerformanceStatistics() {
    try {
      const statistics = await this.databaseOptimizationService.getPerformanceStatistics();
      
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
   * 创建优化索引
   */
  @Post('optimize/indexes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建优化索引' })
  @ApiResponse({ status: 200, description: '优化完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async createOptimizedIndexes() {
    try {
      const result = await this.databaseOptimizationService.createOptimizedIndexes();
      
      return {
        code: 0,
        message: '索引优化完成',
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
   * 优化查询语句
   */
  @Post('optimize/queries')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '优化查询语句' })
  @ApiResponse({ status: 200, description: '优化完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async optimizeQueries() {
    try {
      const result = await this.databaseOptimizationService.optimizeCommonQueries();
      
      return {
        code: 0,
        message: '查询优化完成',
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
   * 优化数据库表
   */
  @Post('optimize/tables')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '优化数据库表' })
  @ApiResponse({ status: 200, description: '优化完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async optimizeTables() {
    try {
      const result = await this.databaseOptimizationService.optimizeTables();
      
      return {
        code: 0,
        message: '表优化完成',
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
   * 获取查询执行计划
   */
  @Post('explain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取查询执行计划' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getQueryExecutionPlan(@Body() dto: ExecutionPlanDto) {
    try {
      const executionPlan = await this.databaseOptimizationService.getQueryExecutionPlan(dto.sql);
      
      return {
        code: 0,
        message: '获取执行计划成功',
        data: {
          sql: dto.sql,
          executionPlan
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
   * 执行完整的数据库优化
   */
  @Post('optimize/full')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '执行完整的数据库优化' })
  @ApiResponse({ status: 200, description: '优化完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async performFullOptimization() {
    try {
      // 执行完整优化流程
      const [indexResult, queryResult, tableResult] = await Promise.all([
        this.databaseOptimizationService.createOptimizedIndexes(),
        this.databaseOptimizationService.optimizeCommonQueries(),
        this.databaseOptimizationService.optimizeTables()
      ]);

      // 生成优化后的健康报告
      const healthReport = await this.databaseOptimizationService.generateHealthReport();

      return {
        code: 0,
        message: '完整数据库优化完成',
        data: {
          indexes: indexResult,
          queries: queryResult,
          tables: tableResult,
          finalHealthScore: healthReport.overallScore,
          summary: {
            indexesCreated: indexResult.created,
            queriesOptimized: queryResult.optimized,
            tablesOptimized: tableResult.optimized,
            improvementSuggestions: healthReport.recommendations.length
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
   * 获取慢查询日志
   */
  @Get('slow-queries')
  @ApiOperation({ summary: '获取慢查询日志' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getSlowQueries(
    @Query('limit') limit = 50,
    @Query('threshold') threshold = 1000
  ) {
    try {
      // 这里应该从实际的慢查询日志获取数据
      // 当前返回模拟数据
      const slowQueries = [
        {
          id: 1,
          query: 'SELECT * FROM orders WHERE user_id = 123 ORDER BY created_at DESC',
          executionTime: 2500,
          rowsExamined: 15000,
          rowsReturned: 50,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          frequency: 234,
          suggestion: '建议为user_id和created_at字段创建复合索引'
        },
        {
          id: 2,
          query: 'SELECT COUNT(*) FROM users WHERE created_at >= "2024-01-01"',
          executionTime: 3200,
          rowsExamined: 50000,
          rowsReturned: 1,
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          frequency: 89,
          suggestion: '建议为created_at字段创建索引'
        },
        {
          id: 3,
          query: 'SELECT o.*, u.nickname FROM orders o JOIN users u ON o.user_id = u.id WHERE o.status = "processing"',
          executionTime: 1800,
          rowsExamined: 8000,
          rowsReturned: 120,
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          frequency: 456,
          suggestion: '建议为orders.status字段创建索引'
        }
      ];

      const filteredQueries = slowQueries
        .filter(q => q.executionTime >= Number(threshold))
        .slice(0, Number(limit));

      return {
        code: 0,
        message: '获取成功',
        data: {
          queries: filteredQueries,
          total: filteredQueries.length,
          threshold: Number(threshold),
          limit: Number(limit),
          summary: {
            averageExecutionTime: filteredQueries.reduce((sum, q) => sum + q.executionTime, 0) / filteredQueries.length,
            maxExecutionTime: Math.max(...filteredQueries.map(q => q.executionTime)),
            totalFrequency: filteredQueries.reduce((sum, q) => sum + q.frequency, 0)
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
   * 获取索引使用情况
   */
  @Get('index-usage')
  @ApiOperation({ summary: '获取索引使用情况' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getIndexUsage() {
    try {
      // 这里应该从performance_schema获取实际的索引使用数据
      // 当前返回模拟数据
      const indexUsage = {
        totalIndexes: 45,
        usedIndexes: 38,
        unusedIndexes: 7,
        mostUsedIndexes: [
          {
            tableName: 'users',
            indexName: 'PRIMARY',
            usageCount: 125643,
            cardinality: 12000,
            selectivity: 'High'
          },
          {
            tableName: 'orders',
            indexName: 'idx_orders_user_id',
            usageCount: 89234,
            cardinality: 8500,
            selectivity: 'Medium'
          },
          {
            tableName: 'orders',
            indexName: 'idx_orders_created_at',
            usageCount: 67891,
            cardinality: 15000,
            selectivity: 'High'
          }
        ],
        unusedIndexesList: [
          {
            tableName: 'users',
            indexName: 'idx_users_email',
            reason: '查询中很少使用email字段进行过滤',
            recommendation: '考虑删除此索引以减少维护成本'
          },
          {
            tableName: 'orders',
            indexName: 'idx_orders_notes',
            reason: 'notes字段很少用于查询条件',
            recommendation: '考虑删除此索引'
          }
        ],
        recommendations: [
          {
            type: 'create',
            table: 'orders',
            columns: ['status', 'merchant_id'],
            reason: '经常按状态和商户查询订单',
            priority: 'high'
          },
          {
            type: 'drop',
            table: 'users',
            index: 'idx_users_email',
            reason: '使用频率极低',
            priority: 'medium'
          }
        ]
      };

      return {
        code: 0,
        message: '获取成功',
        data: indexUsage
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 获取表空间使用情况
   */
  @Get('table-space')
  @ApiOperation({ summary: '获取表空间使用情况' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getTableSpaceUsage() {
    try {
      // 这里应该从information_schema获取实际的表空间数据
      // 当前返回模拟数据
      const tableSpace = {
        totalSize: '2.5 GB',
        dataSize: '1.8 GB',
        indexSize: '0.5 GB',
        freeSpace: '0.2 GB',
        tables: [
          {
            tableName: 'orders',
            rowCount: 156789,
            dataSize: '854.3 MB',
            indexSize: '234.7 MB',
            totalSize: '1.1 GB',
            avgRowLength: 5.8,
            fragmentation: '12.3%',
            lastOptimized: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          {
            tableName: 'users',
            rowCount: 12456,
            dataSize: '123.4 MB',
            indexSize: '45.6 MB',
            totalSize: '169.0 MB',
            avgRowLength: 10.2,
            fragmentation: '5.7%',
            lastOptimized: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            tableName: 'payments',
            rowCount: 89234,
            dataSize: '456.7 MB',
            indexSize: '123.4 MB',
            totalSize: '580.1 MB',
            avgRowLength: 5.3,
            fragmentation: '18.9%',
            lastOptimized: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
          }
        ],
        recommendations: [
          {
            table: 'payments',
            action: 'optimize',
            reason: '碎片化严重（18.9%）',
            priority: 'high',
            estimatedGain: '减少15%存储空间'
          },
          {
            table: 'orders',
            action: 'analyze',
            reason: '表统计信息可能过时',
            priority: 'medium',
            estimatedGain: '提升查询计划准确性'
          }
        ]
      };

      return {
        code: 0,
        message: '获取成功',
        data: tableSpace
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }

  /**
   * 获取实时性能监控数据
   */
  @Get('monitor/realtime')
  @ApiOperation({ summary: '获取实时性能监控数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getRealtimeMonitoring() {
    try {
      // 这里应该从performance_schema获取实时数据
      // 当前返回模拟数据
      const realtimeData = {
        timestamp: new Date(),
        connections: {
          current: 23,
          max: 100,
          aborted: 0
        },
        queries: {
          queriesPerSecond: 145.7,
          slowQueries: 3,
          selectStatementsPerSecond: 98.4,
          insertStatementsPerSecond: 28.9,
          updateStatementsPerSecond: 12.3,
          deleteStatementsPerSecond: 6.1
        },
        innodb: {
          bufferPoolHitRatio: 99.8,
          bufferPoolUsage: 87.3,
          rowsRead: 156789,
          rowsInserted: 2345,
          rowsUpdated: 1234,
          rowsDeleted: 89
        },
        locks: {
          lockWaits: 0,
          deadlocks: 0,
          avgLockWaitTime: 0
        },
        io: {
          diskReads: 234,
          diskWrites: 89,
          diskReadBytes: '2.3 MB',
          diskWriteBytes: '890 KB'
        }
      };

      return {
        code: 0,
        message: '获取成功',
        data: realtimeData
      };
    } catch (error) {
      return {
        code: 50001,
        message: error.message
      };
    }
  }
}
