import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { LoggerService } from '../common/services/logger.service';

export interface QueryPerformanceMetrics {
  queryType: string;
  tableName: string;
  executionTime: number;
  rowsExamined: number;
  rowsReturned: number;
  indexUsed: boolean;
  queryHash: string;
  timestamp: Date;
}

export interface OptimizationSuggestion {
  type: 'index' | 'query_rewrite' | 'schema_change' | 'cache';
  priority: 'high' | 'medium' | 'low';
  description: string;
  sqlBefore?: string;
  sqlAfter?: string;
  expectedImprovement: string;
  implementation: string;
}

export interface DatabaseHealthReport {
  slowQueries: {
    query: string;
    avgExecutionTime: number;
    frequency: number;
    lastExecution: Date;
  }[];
  missingIndexes: {
    tableName: string;
    columns: string[];
    estimatedImpact: string;
  }[];
  tableStatistics: {
    tableName: string;
    rowCount: number;
    dataSize: string;
    indexSize: string;
    fragmentationLevel: number;
  }[];
  recommendations: OptimizationSuggestion[];
  overallScore: number;
}

/**
 * 数据库性能优化服务
 * 监控查询性能、分析慢查询、提供优化建议
 */
@Injectable()
export class DatabaseOptimizationService {
  private queryMetrics: Map<string, QueryPerformanceMetrics[]> = new Map();
  private slowQueryThreshold = 1000; // 1秒

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private logger: LoggerService
  ) {}

  /**
   * 定时任务：每日数据库健康检查
   * 每天凌晨3点执行
   */
  @Cron('0 0 3 * * *')
  async performDatabaseHealthCheck() {
    try {
      this.logger.log('开始数据库健康检查', 'DatabaseOptimizationService');
      
      const healthReport = await this.generateHealthReport();
      
      // 如果发现严重性能问题，发送告警
      if (healthReport.overallScore < 70) {
        await this.sendPerformanceAlert(healthReport);
      }
      
      this.logger.log(`数据库健康检查完成，评分: ${healthReport.overallScore}`, 'DatabaseOptimizationService');
    } catch (error) {
      this.logger.error(`数据库健康检查异常: ${error.message}`, error.stack, 'DatabaseOptimizationService');
    }
  }

  /**
   * 定时任务：慢查询分析
   * 每小时执行一次
   */
  @Cron('0 0 * * * *')
  async analyzeSlowQueries() {
    try {
      this.logger.log('开始慢查询分析', 'DatabaseOptimizationService');
      
      const slowQueries = await this.getSlowQueries();
      const suggestions = await this.generateOptimizationSuggestions(slowQueries);
      
      if (suggestions.length > 0) {
        this.logger.warn(`发现${suggestions.length}个优化建议`, 'DatabaseOptimizationService');
      }
    } catch (error) {
      this.logger.error(`慢查询分析异常: ${error.message}`, error.stack, 'DatabaseOptimizationService');
    }
  }

  /**
   * 创建优化索引
   */
  async createOptimizedIndexes(): Promise<{
    created: number;
    failed: number;
    details: any[];
  }> {
    const indexSuggestions = [
      {
        name: 'idx_orders_user_created',
        table: 'orders',
        columns: ['user_id', 'created_at'],
        description: '优化用户订单查询'
      },
      {
        name: 'idx_orders_status_amount',
        table: 'orders',
        columns: ['status', 'amount'],
        description: '优化订单状态和金额查询'
      },
      {
        name: 'idx_users_phone_status',
        table: 'users',
        columns: ['phone', 'status'],
        description: '优化用户手机号和状态查询'
      },
      {
        name: 'idx_orders_merchant_date',
        table: 'orders',
        columns: ['merchant_id', 'created_at', 'status'],
        description: '优化商户订单日期查询'
      }
    ];

    const results = {
      created: 0,
      failed: 0,
      details: []
    };

    for (const suggestion of indexSuggestions) {
      try {
        const indexExists = await this.checkIndexExists(suggestion.name);
        if (!indexExists) {
          const sql = `CREATE INDEX ${suggestion.name} ON ${suggestion.table} (${suggestion.columns.join(', ')})`;
          
          await this.dataSource.query(sql);
          
          results.created++;
          results.details.push({
            name: suggestion.name,
            status: 'created',
            description: suggestion.description,
            sql
          });
          
          this.logger.log(`创建索引成功: ${suggestion.name}`, 'DatabaseOptimizationService');
        } else {
          results.details.push({
            name: suggestion.name,
            status: 'exists',
            description: suggestion.description
          });
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          name: suggestion.name,
          status: 'failed',
          error: error.message,
          description: suggestion.description
        });
        
        this.logger.error(`创建索引失败: ${suggestion.name}, ${error.message}`, error.stack, 'DatabaseOptimizationService');
      }
    }

    return results;
  }

  /**
   * 优化查询语句
   */
  async optimizeCommonQueries(): Promise<{
    optimized: number;
    suggestions: OptimizationSuggestion[];
  }> {
    const queryOptimizations = [
      {
        type: 'query_rewrite' as const,
        priority: 'high' as const,
        description: '优化用户订单统计查询',
        sqlBefore: `
          SELECT u.*, COUNT(o.id) as order_count 
          FROM users u 
          LEFT JOIN orders o ON u.id = o.user_id 
          WHERE u.status = 'active' 
          GROUP BY u.id
        `,
        sqlAfter: `
          SELECT u.*, COALESCE(oc.order_count, 0) as order_count
          FROM users u
          LEFT JOIN (
            SELECT user_id, COUNT(*) as order_count
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
            GROUP BY user_id
          ) oc ON u.id = oc.user_id
          WHERE u.status = 'active'
        `,
        expectedImprovement: '查询速度提升60%',
        implementation: '使用子查询避免大表JOIN时的性能问题'
      },
      {
        type: 'query_rewrite' as const,
        priority: 'medium' as const,
        description: '优化商户收入统计查询',
        sqlBefore: `
          SELECT merchant_id, SUM(amount) as total_revenue
          FROM orders
          WHERE status = 'done'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY merchant_id
        `,
        sqlAfter: `
          SELECT merchant_id, SUM(amount) as total_revenue
          FROM orders
          WHERE status = 'done'
          AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY merchant_id
          HAVING SUM(amount) > 0
        `,
        expectedImprovement: '减少无效结果集，提升20%性能',
        implementation: '添加HAVING子句过滤无收入商户'
      }
    ];

    return {
      optimized: queryOptimizations.length,
      suggestions: queryOptimizations
    };
  }

  /**
   * 执行表分析和优化
   */
  async optimizeTables(): Promise<{
    analyzed: number;
    optimized: number;
    details: any[];
  }> {
    const tables = ['users', 'orders', 'merchants', 'devices', 'payments'];
    const results = {
      analyzed: 0,
      optimized: 0,
      details: []
    };

    for (const tableName of tables) {
      try {
        // 分析表
        await this.dataSource.query(`ANALYZE TABLE ${tableName}`);
        
        // 检查表状态
        const [tableStatus] = await this.dataSource.query(
          `SHOW TABLE STATUS WHERE Name = '${tableName}'`
        );
        
        results.analyzed++;
        
        // 如果碎片化严重，执行优化
        const fragmentationRatio = tableStatus.Data_free / (tableStatus.Data_length + tableStatus.Index_length);
        
        if (fragmentationRatio > 0.1) { // 碎片化超过10%
          await this.dataSource.query(`OPTIMIZE TABLE ${tableName}`);
          results.optimized++;
          
          results.details.push({
            table: tableName,
            action: 'optimized',
            fragmentationBefore: `${(fragmentationRatio * 100).toFixed(2)}%`,
            reason: 'High fragmentation detected'
          });
        } else {
          results.details.push({
            table: tableName,
            action: 'analyzed',
            fragmentation: `${(fragmentationRatio * 100).toFixed(2)}%`,
            status: 'good'
          });
        }
        
        this.logger.log(`表分析完成: ${tableName}`, 'DatabaseOptimizationService');
      } catch (error) {
        results.details.push({
          table: tableName,
          action: 'failed',
          error: error.message
        });
        
        this.logger.error(`表优化失败: ${tableName}, ${error.message}`, error.stack, 'DatabaseOptimizationService');
      }
    }

    return results;
  }

  /**
   * 生成数据库健康报告
   */
  async generateHealthReport(): Promise<DatabaseHealthReport> {
    try {
      const [slowQueries, tableStats, missingIndexes] = await Promise.all([
        this.getSlowQueries(),
        this.getTableStatistics(),
        this.findMissingIndexes()
      ]);

      const recommendations = await this.generateOptimizationSuggestions(slowQueries);
      
      // 计算总体评分
      let score = 100;
      score -= Math.min(slowQueries.length * 5, 30); // 慢查询扣分
      score -= Math.min(missingIndexes.length * 10, 40); // 缺失索引扣分
      score -= Math.min(recommendations.filter(r => r.priority === 'high').length * 15, 30); // 高优先级问题扣分

      return {
        slowQueries,
        missingIndexes,
        tableStatistics: tableStats,
        recommendations,
        overallScore: Math.max(score, 0)
      };
    } catch (error) {
      this.logger.error(`生成健康报告失败: ${error.message}`, error.stack, 'DatabaseOptimizationService');
      throw error;
    }
  }

  /**
   * 监控查询性能
   */
  async monitorQueryPerformance<T>(
    queryBuilder: SelectQueryBuilder<T>,
    queryType: string
  ): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      const results = await queryBuilder.getMany();
      const executionTime = Date.now() - startTime;
      
      // 记录性能指标
      const metrics: QueryPerformanceMetrics = {
        queryType,
        tableName: queryBuilder.expressionMap.mainAlias?.name || 'unknown',
        executionTime,
        rowsExamined: 0, // 需要从EXPLAIN结果获取
        rowsReturned: results.length,
        indexUsed: true, // 需要从EXPLAIN结果获取
        queryHash: this.generateQueryHash(queryBuilder.getQuery()),
        timestamp: new Date()
      };

      this.recordQueryMetrics(metrics);

      // 如果查询很慢，记录告警
      if (executionTime > this.slowQueryThreshold) {
        this.logger.warn(
          `慢查询检测: ${queryType}, 执行时间: ${executionTime}ms, SQL: ${queryBuilder.getQuery()}`,
          'DatabaseOptimizationService'
        );
      }

      return results;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        `查询执行失败: ${queryType}, 执行时间: ${executionTime}ms, 错误: ${error.message}`,
        error.stack,
        'DatabaseOptimizationService'
      );
      throw error;
    }
  }

  /**
   * 获取查询执行计划
   */
  async getQueryExecutionPlan(sql: string): Promise<any[]> {
    try {
      const explainResult = await this.dataSource.query(`EXPLAIN FORMAT=JSON ${sql}`);
      return explainResult;
    } catch (error) {
      this.logger.error(`获取执行计划失败: ${error.message}`, error.stack, 'DatabaseOptimizationService');
      throw error;
    }
  }

  /**
   * 获取性能统计信息
   */
  async getPerformanceStatistics(): Promise<{
    queryStats: any;
    indexUsage: any;
    tableStats: any;
    recommendations: OptimizationSuggestion[];
  }> {
    const queryStats = this.calculateQueryStatistics();
    const indexUsage = await this.getIndexUsageStatistics();
    const tableStats = await this.getTableStatistics();
    const recommendations = await this.generateOptimizationSuggestions([]);

    return {
      queryStats,
      indexUsage,
      tableStats,
      recommendations
    };
  }

  // 私有辅助方法

  private async getSlowQueries(): Promise<any[]> {
    try {
      // 这里应该从MySQL的slow_query_log或performance_schema查询
      // 当前返回模拟数据
      return [
        {
          query: 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
          avgExecutionTime: 1500,
          frequency: 234,
          lastExecution: new Date()
        },
        {
          query: 'SELECT COUNT(*) FROM users WHERE created_at >= ?',
          avgExecutionTime: 2300,
          frequency: 89,
          lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000)
        }
      ];
    } catch (error) {
      return [];
    }
  }

  private async getTableStatistics(): Promise<any[]> {
    try {
      const stats = await this.dataSource.query(`
        SELECT 
          TABLE_NAME as tableName,
          TABLE_ROWS as rowCount,
          ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as totalSize,
          ROUND((DATA_LENGTH / 1024 / 1024), 2) as dataSize,
          ROUND((INDEX_LENGTH / 1024 / 1024), 2) as indexSize,
          ROUND((DATA_FREE / 1024 / 1024), 2) as freeSpace
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
      `);

      return stats.map(stat => ({
        ...stat,
        fragmentationLevel: stat.freeSpace / (stat.dataSize + stat.indexSize) * 100
      }));
    } catch (error) {
      return [];
    }
  }

  private async findMissingIndexes(): Promise<any[]> {
    // 这里应该分析查询模式来找出缺失的索引
    // 当前返回模拟数据
    return [
      {
        tableName: 'orders',
        columns: ['status', 'created_at'],
        estimatedImpact: '高 - 可提升状态查询50%性能'
      },
      {
        tableName: 'users',
        columns: ['phone'],
        estimatedImpact: '中 - 可提升登录查询30%性能'
      }
    ];
  }

  private async generateOptimizationSuggestions(slowQueries: any[]): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // 基于慢查询生成建议
    for (const query of slowQueries) {
      if (query.query.includes('ORDER BY') && !query.query.includes('LIMIT')) {
        suggestions.push({
          type: 'query_rewrite',
          priority: 'high',
          description: '为排序查询添加LIMIT子句',
          sqlBefore: query.query,
          sqlAfter: `${query.query} LIMIT 100`,
          expectedImprovement: '减少内存使用，提升50%性能',
          implementation: '添加适当的LIMIT限制结果集大小'
        });
      }
    }

    return suggestions;
  }

  private recordQueryMetrics(metrics: QueryPerformanceMetrics): void {
    const key = metrics.queryType;
    if (!this.queryMetrics.has(key)) {
      this.queryMetrics.set(key, []);
    }
    
    const metricsArray = this.queryMetrics.get(key);
    metricsArray.push(metrics);
    
    // 保持最近1000条记录
    if (metricsArray.length > 1000) {
      metricsArray.splice(0, metricsArray.length - 1000);
    }
  }

  private calculateQueryStatistics(): any {
    const stats = {
      totalQueries: 0,
      avgExecutionTime: 0,
      slowQueriesCount: 0,
      queryTypes: {}
    };

    for (const [queryType, metrics] of this.queryMetrics) {
      stats.totalQueries += metrics.length;
      stats.queryTypes[queryType] = {
        count: metrics.length,
        avgTime: metrics.reduce((sum, m) => sum + m.executionTime, 0) / metrics.length,
        slowCount: metrics.filter(m => m.executionTime > this.slowQueryThreshold).length
      };
    }

    if (stats.totalQueries > 0) {
      let totalTime = 0;
      for (const metrics of this.queryMetrics.values()) {
        totalTime += metrics.reduce((sum, m) => sum + m.executionTime, 0);
      }
      stats.avgExecutionTime = totalTime / stats.totalQueries;
    }

    return stats;
  }

  private async getIndexUsageStatistics(): Promise<any> {
    try {
      const indexStats = await this.dataSource.query(`
        SELECT 
          OBJECT_SCHEMA as schemaName,
          OBJECT_NAME as tableName,
          INDEX_NAME as indexName,
          COUNT_FETCH as usage_count
        FROM performance_schema.table_io_waits_summary_by_index_usage
        WHERE OBJECT_SCHEMA = DATABASE()
        ORDER BY COUNT_FETCH DESC
      `);

      return {
        totalIndexes: indexStats.length,
        mostUsedIndexes: indexStats.slice(0, 10),
        unusedIndexes: indexStats.filter(stat => stat.usage_count === 0)
      };
    } catch (error) {
      return {
        totalIndexes: 0,
        mostUsedIndexes: [],
        unusedIndexes: []
      };
    }
  }

  private generateQueryHash(sql: string): string {
    // 简单的哈希函数，实际应该使用更复杂的算法
    let hash = 0;
    for (let i = 0; i < sql.length; i++) {
      const char = sql.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private async checkIndexExists(indexName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(`
        SELECT COUNT(*) as count
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND INDEX_NAME = '${indexName}'
      `);
      return result[0].count > 0;
    } catch (error) {
      return false;
    }
  }

  private async sendPerformanceAlert(healthReport: DatabaseHealthReport): Promise<void> {
    this.logger.error(
      `数据库性能告警: 健康评分 ${healthReport.overallScore}, 慢查询 ${healthReport.slowQueries.length} 个`,
      JSON.stringify({
        score: healthReport.overallScore,
        slowQueries: healthReport.slowQueries.length,
        missingIndexes: healthReport.missingIndexes.length,
        recommendations: healthReport.recommendations.length
      }),
      'DatabaseOptimizationService'
    );
  }
}