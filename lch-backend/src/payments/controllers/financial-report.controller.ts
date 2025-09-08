import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
import { FinancialReportService, ReportTemplate } from '../services/financial-report.service';

class ManualGenerateDto {
  templateId: string;
  customPeriod?: {
    start: Date;
    end: Date;
  };
}

class CreateTemplateDto {
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  schedule: {
    cron?: string;
    enabled: boolean;
  };
  data: {
    metrics: string[];
    dateRange: any;
  };
  format: {
    type: 'excel' | 'pdf' | 'csv' | 'json';
    charts?: boolean;
  };
  recipients: {
    emails: string[];
    autoSend: boolean;
  };
}

/**
 * 财务报表管理控制器
 * 提供报表模板管理、报表生成、下载等功能
 */
@ApiTags('财务报表管理')
@Controller('payments/reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class FinancialReportController {
  constructor(private readonly reportService: FinancialReportService) {}

  /**
   * 获取报表模板列表
   */
  @Get('templates')
  @ApiOperation({ summary: '获取报表模板列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getReportTemplates() {
    const templates = this.reportService.getReportTemplates();
    return {
      code: 0,
      message: '获取成功',
      data: templates
    };
  }

  /**
   * 创建报表模板
   */
  @Post('templates')
  @ApiOperation({ summary: '创建报表模板' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async createReportTemplate(@Body() templateData: CreateTemplateDto) {
    const newTemplate: ReportTemplate = {
      id: `custom_${Date.now()}`,
      ...templateData,
      retention: {
        days: 90,
        autoDelete: true
      }
    };

    // 这里应该保存到数据库
    const templates = this.reportService.getReportTemplates();
    templates.push(newTemplate);

    return {
      code: 0,
      message: '创建成功',
      data: newTemplate
    };
  }

  /**
   * 手动生成报表
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动生成报表' })
  @ApiResponse({ status: 200, description: '生成成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async manualGenerate(@Body() generateDto: ManualGenerateDto) {
    try {
      const report = await this.reportService.manualGenerate(
        generateDto.templateId,
        generateDto.customPeriod
      );
      
      return {
        code: 0,
        message: '报表生成成功',
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
   * 获取已生成的报表列表
   */
  @Get()
  @ApiOperation({ summary: '获取报表列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getGeneratedReports(
    @Query('page') page = 1,
    @Query('size') size = 20,
    @Query('templateId') templateId?: string,
    @Query('status') status?: string
  ) {
    let reports = this.reportService.getGeneratedReports(100);

    // 根据条件筛选
    if (templateId) {
      reports = reports.filter(r => r.templateId === templateId);
    }
    if (status) {
      reports = reports.filter(r => r.status === status);
    }

    const total = reports.length;
    const paginatedReports = reports.slice((page - 1) * size, page * size);

    return {
      code: 0,
      message: '获取成功',
      data: {
        reports: paginatedReports,
        total,
        page,
        size
      }
    };
  }

  /**
   * 获取报表详情
   */
  @Get(':reportId')
  @ApiOperation({ summary: '获取报表详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getReportDetail(@Param('reportId') reportId: string) {
    const reports = this.reportService.getGeneratedReports();
    const report = reports.find(r => r.id === reportId);

    if (!report) {
      return {
        code: 40404,
        message: '报表不存在'
      };
    }

    return {
      code: 0,
      message: '获取成功',
      data: report
    };
  }

  /**
   * 下载报表文件
   */
  @Get(':reportId/download')
  @ApiOperation({ summary: '下载报表文件' })
  @ApiResponse({ status: 200, description: '下载成功' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  async downloadReport(@Param('reportId') reportId: string) {
    const reports = this.reportService.getGeneratedReports();
    const report = reports.find(r => r.id === reportId);

    if (!report || !report.filePath) {
      return {
        code: 40404,
        message: '报表文件不存在'
      };
    }

    return {
      code: 0,
      message: '获取下载链接成功',
      data: {
        downloadUrl: `/api/files/reports/${reportId}`,
        filename: report.reportName,
        fileSize: report.fileSize,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
      }
    };
  }

  /**
   * 删除报表
   */
  @Delete(':reportId')
  @ApiOperation({ summary: '删除报表' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async deleteReport(@Param('reportId') reportId: string) {
    const success = await this.reportService.deleteReport(reportId);

    if (!success) {
      return {
        code: 40404,
        message: '报表不存在'
      };
    }

    return {
      code: 0,
      message: '删除成功'
    };
  }

  /**
   * 批量删除报表
   */
  @Post('batch-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量删除报表' })
  @ApiResponse({ status: 200, description: '批量删除完成' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async batchDeleteReports(@Body() data: { reportIds: string[] }) {
    const results = [];
    const errors = [];

    for (const reportId of data.reportIds) {
      try {
        const success = await this.reportService.deleteReport(reportId);
        results.push({ reportId, success });
      } catch (error) {
        errors.push({ reportId, error: error.message });
      }
    }

    return {
      code: 0,
      message: '批量删除完成',
      data: {
        successCount: results.filter(r => r.success).length,
        errorCount: errors.length,
        results,
        errors
      }
    };
  }

  /**
   * 获取报表统计信息
   */
  @Get('stats/overview')
  @ApiOperation({ summary: '获取报表统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getReportStats() {
    const reports = this.reportService.getGeneratedReports();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayReports = reports.filter(r => r.generatedAt >= today);
    const completedReports = reports.filter(r => r.status === 'completed');
    const failedReports = reports.filter(r => r.status === 'failed');

    return {
      code: 0,
      message: '获取成功',
      data: {
        totalReports: reports.length,
        todayReports: todayReports.length,
        completedReports: completedReports.length,
        failedReports: failedReports.length,
        successRate: reports.length > 0 ? (completedReports.length / reports.length * 100).toFixed(1) : 0,
        templateStats: this.reportService.getReportTemplates().map(template => ({
          templateId: template.id,
          templateName: template.name,
          reportCount: reports.filter(r => r.templateId === template.id).length,
          enabled: template.schedule.enabled
        })),
        recentReports: reports
          .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
          .slice(0, 5)
          .map(r => ({
            id: r.id,
            name: r.reportName,
            status: r.status,
            generatedAt: r.generatedAt,
            fileSize: r.fileSize
          }))
      }
    };
  }

  /**
   * 预览报表数据
   */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '预览报表数据' })
  @ApiResponse({ status: 200, description: '预览成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async previewReportData(@Body() data: {
    templateId: string;
    customPeriod?: { start: Date; end: Date };
  }) {
    try {
      // 这里应该实现预览逻辑，不生成实际文件
      // 当前返回模拟数据
      return {
        code: 0,
        message: '预览成功',
        data: {
          period: data.customPeriod || { start: new Date(), end: new Date() },
          metrics: {
            totalRevenue: 156789,
            totalOrders: 432,
            activeUsers: 89,
            activeMerchants: 23
          },
          charts: {
            revenueChart: [
              { date: '2025-01-01', revenue: 12000 },
              { date: '2025-01-02', revenue: 15000 },
              { date: '2025-01-03', revenue: 18000 }
            ]
          },
          summary: {
            highlights: ['收入增长12%', '用户活跃度提升'],
            trends: ['订单量稳步上升'],
            recommendations: ['建议加强营销推广']
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
   * 重新发送报表
   */
  @Post(':reportId/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重新发送报表' })
  @ApiResponse({ status: 200, description: '发送成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async resendReport(
    @Param('reportId') reportId: string,
    @Body() data: { emails?: string[] }
  ) {
    // 这里应该实现重新发送逻辑
    return {
      code: 0,
      message: '报表发送成功',
      data: {
        reportId,
        sentTo: data.emails || ['admin@liangjieche.com'],
        sentAt: new Date()
      }
    };
  }

  /**
   * 导出报表配置
   */
  @Get('config/export')
  @ApiOperation({ summary: '导出报表配置' })
  @ApiResponse({ status: 200, description: '导出成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async exportConfig() {
    const templates = this.reportService.getReportTemplates();
    
    return {
      code: 0,
      message: '导出成功',
      data: {
        downloadUrl: '/api/files/report-config.json',
        config: templates,
        exportedAt: new Date()
      }
    };
  }

  /**
   * 导入报表配置
   */
  @Post('config/import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '导入报表配置' })
  @ApiResponse({ status: 200, description: '导入成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async importConfig(@Body() data: { templates: ReportTemplate[] }) {
    // 这里应该实现配置导入逻辑
    return {
      code: 0,
      message: '配置导入成功',
      data: {
        importedCount: data.templates.length,
        importedAt: new Date()
      }
    };
  }
}