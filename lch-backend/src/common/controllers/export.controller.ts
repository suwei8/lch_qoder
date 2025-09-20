import { Controller, Get, Query, Res, UseGuards, Logger } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../interfaces/common.interface';
import { ExportService, ExportOptions } from '../services/export.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('api/exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  private readonly logger = new Logger(ExportController.name);

  constructor(private readonly exportService: ExportService) {}

  /**
   * 导出订单数据
   */
  @Get('orders')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  async exportOrders(@Query() query: any) {
    try {
      const options: ExportOptions = {
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        format: query.format || 'excel',
        filters: {
          status: query.status,
          merchantId: query.merchantId,
          deviceId: query.deviceId
        }
      };

      const result = await this.exportService.exportOrders(options);
      
      if (!result.success) {
        return {
          success: false,
          message: result.errorMessage
        };
      }

      return {
        success: true,
        data: {
          fileName: result.fileName,
          downloadUrl: result.downloadUrl,
          recordCount: result.recordCount
        }
      };

    } catch (error) {
      this.logger.error('导出订单数据失败', error);
      return {
        success: false,
        message: '导出失败，请稍后重试'
      };
    }
  }

  /**
   * 导出用户数据
   */
  @Get('users')
  @Roles(UserRole.PLATFORM_ADMIN)
  async exportUsers(@Query() query: any) {
    try {
      const options: ExportOptions = {
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        format: query.format || 'excel',
        filters: {
          role: query.role,
          vipLevel: query.vipLevel
        }
      };

      const result = await this.exportService.exportUsers(options);
      
      if (!result.success) {
        return {
          success: false,
          message: result.errorMessage
        };
      }

      return {
        success: true,
        data: {
          fileName: result.fileName,
          downloadUrl: result.downloadUrl,
          recordCount: result.recordCount
        }
      };

    } catch (error) {
      this.logger.error('导出用户数据失败', error);
      return {
        success: false,
        message: '导出失败，请稍后重试'
      };
    }
  }

  /**
   * 导出设备数据
   */
  @Get('devices')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  async exportDevices(@Query() query: any) {
    try {
      const options: ExportOptions = {
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        format: query.format || 'excel',
        filters: {
          status: query.status,
          merchantId: query.merchantId
        }
      };

      const result = await this.exportService.exportDevices(options);
      
      if (!result.success) {
        return {
          success: false,
          message: result.errorMessage
        };
      }

      return {
        success: true,
        data: {
          fileName: result.fileName,
          downloadUrl: result.downloadUrl,
          recordCount: result.recordCount
        }
      };

    } catch (error) {
      this.logger.error('导出设备数据失败', error);
      return {
        success: false,
        message: '导出失败，请稍后重试'
      };
    }
  }

  /**
   * 导出商户数据
   */
  @Get('merchants')
  @Roles(UserRole.PLATFORM_ADMIN)
  async exportMerchants(@Query() query: any) {
    try {
      const options: ExportOptions = {
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
        format: query.format || 'excel',
        filters: {
          status: query.status
        }
      };

      const result = await this.exportService.exportMerchants(options);
      
      if (!result.success) {
        return {
          success: false,
          message: result.errorMessage
        };
      }

      return {
        success: true,
        data: {
          fileName: result.fileName,
          downloadUrl: result.downloadUrl,
          recordCount: result.recordCount
        }
      };

    } catch (error) {
      this.logger.error('导出商户数据失败', error);
      return {
        success: false,
        message: '导出失败，请稍后重试'
      };
    }
  }

  /**
   * 导出财务报表
   */
  @Get('financial-report')
  @Roles(UserRole.PLATFORM_ADMIN)
  async exportFinancialReport(@Query() query: any) {
    try {
      if (!query.startDate || !query.endDate) {
        return {
          success: false,
          message: '请指定开始和结束日期'
        };
      }

      const options: ExportOptions = {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
        format: 'excel',
        filters: {}
      };

      const result = await this.exportService.exportFinancialReport(options);
      
      if (!result.success) {
        return {
          success: false,
          message: result.errorMessage
        };
      }

      return {
        success: true,
        data: {
          fileName: result.fileName,
          downloadUrl: result.downloadUrl,
          recordCount: result.recordCount
        }
      };

    } catch (error) {
      this.logger.error('导出财务报表失败', error);
      return {
        success: false,
        message: '导出失败，请稍后重试'
      };
    }
  }

  /**
   * 下载导出文件
   */
  @Get('download/:fileName')
  async downloadFile(@Query('fileName') fileName: string, @Res() res: Response) {
    try {
      const filePath = this.exportService.getFilePath(fileName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: '文件不存在或已过期'
        });
      }

      const fileExtension = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (fileExtension === '.xlsx') {
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (fileExtension === '.csv') {
        contentType = 'text/csv';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

    } catch (error) {
      this.logger.error('下载文件失败', error);
      res.status(500).json({
        success: false,
        message: '下载失败，请稍后重试'
      });
    }
  }
}