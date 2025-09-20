import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';

export interface ExportOrderQuery {
  keyword?: string;
  status?: string;
  payment_method?: string;
  user_id?: number;
  merchant_id?: number;
  device_id?: number;
  start_date?: string;
  end_date?: string;
  format?: 'excel' | 'csv';
}

@Controller('orders/export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderExportController {
  constructor() {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  async exportOrders(
    @Query() query: ExportOrderQuery,
    @Res() res: Response,
  ) {
    // TODO: 实现订单导出功能
    res.json({ message: '订单导出功能开发中', query });
  }

  @Get('refund-report')
  @Roles(UserRole.ADMIN)
  async exportRefundReport(
    @Query() query: { start_date?: string; end_date?: string; format?: 'excel' | 'csv' },
    @Res() res: Response,
  ) {
    // TODO: 实现退款报表导出功能
    res.json({ message: '退款报表导出功能开发中', query });
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  async exportOrderStats(
    @Query() query: {
      period?: 'daily' | 'weekly' | 'monthly';
      start_date?: string;
      end_date?: string;
      format?: 'excel' | 'csv';
    },
    @Res() res: Response,
  ) {
    // TODO: 实现订单统计导出功能
    res.json({ message: '订单统计导出功能开发中', query });
  }

  @Get('exception-report')
  @Roles(UserRole.ADMIN)
  async exportExceptionReport(
    @Query() query: { start_date?: string; end_date?: string; format?: 'excel' | 'csv' },
    @Res() res: Response,
  ) {
    // TODO: 实现异常订单报表导出功能
    res.json({ message: '异常订单报表导出功能开发中', query });
  }
}