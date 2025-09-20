import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { OrderStatus } from '../../common/interfaces/common.interface';

export interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  format?: 'excel' | 'csv';
  filters?: Record<string, any>;
  columns?: string[];
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  downloadUrl?: string;
  errorMessage?: string;
  recordCount?: number;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly exportDir: string;

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    private readonly configService: ConfigService,
  ) {
    this.exportDir = path.join(process.cwd(), 'exports');
    this.ensureExportDirectory();
  }

  /**
   * 导出订单数据
   */
  async exportOrders(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const {
        startDate,
        endDate,
        format = 'excel',
        filters = {},
        columns = []
      } = options;

      // 构建查询条件
      const whereConditions: any = {};
      
      if (startDate && endDate) {
        whereConditions.created_at = Between(startDate, endDate);
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      if (filters.merchantId) {
        whereConditions.merchant_id = filters.merchantId;
      }

      if (filters.deviceId) {
        whereConditions.device_id = filters.deviceId;
      }

      // 查询订单数据
      const orders = await this.orderRepository.find({
        where: whereConditions,
        relations: ['user', 'device', 'merchant'],
        order: { created_at: 'DESC' }
      });

      if (orders.length === 0) {
        return {
          success: false,
          errorMessage: '没有找到符合条件的订单数据'
        };
      }

      // 生成文件
      const fileName = `orders_export_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      const filePath = path.join(this.exportDir, fileName);

      if (format === 'excel') {
        await this.generateOrderExcel(orders, filePath, columns);
      } else {
        await this.generateOrderCSV(orders, filePath, columns);
      }

      this.logger.log(`订单数据导出成功: ${fileName}, 记录数: ${orders.length}`);

      return {
        success: true,
        filePath,
        fileName,
        downloadUrl: `/api/exports/download/${fileName}`,
        recordCount: orders.length
      };

    } catch (error) {
      this.logger.error('订单数据导出失败', error);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * 导出用户数据
   */
  async exportUsers(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const {
        startDate,
        endDate,
        format = 'excel',
        filters = {},
        columns = []
      } = options;

      const whereConditions: any = {};
      
      if (startDate && endDate) {
        whereConditions.created_at = Between(startDate, endDate);
      }

      if (filters.role) {
        whereConditions.role = filters.role;
      }

      if (filters.vipLevel) {
        whereConditions.vip_level = filters.vipLevel;
      }

      const users = await this.userRepository.find({
        where: whereConditions,
        order: { created_at: 'DESC' }
      });

      if (users.length === 0) {
        return {
          success: false,
          errorMessage: '没有找到符合条件的用户数据'
        };
      }

      const fileName = `users_export_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      const filePath = path.join(this.exportDir, fileName);

      if (format === 'excel') {
        await this.generateUserExcel(users, filePath, columns);
      } else {
        await this.generateUserCSV(users, filePath, columns);
      }

      this.logger.log(`用户数据导出成功: ${fileName}, 记录数: ${users.length}`);

      return {
        success: true,
        filePath,
        fileName,
        downloadUrl: `/api/exports/download/${fileName}`,
        recordCount: users.length
      };

    } catch (error) {
      this.logger.error('用户数据导出失败', error);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * 导出设备数据
   */
  async exportDevices(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const {
        startDate,
        endDate,
        format = 'excel',
        filters = {},
        columns = []
      } = options;

      const whereConditions: any = {};
      
      if (startDate && endDate) {
        whereConditions.created_at = Between(startDate, endDate);
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      if (filters.merchantId) {
        whereConditions.merchant_id = filters.merchantId;
      }

      const devices = await this.deviceRepository.find({
        where: whereConditions,
        relations: ['merchant'],
        order: { created_at: 'DESC' }
      });

      if (devices.length === 0) {
        return {
          success: false,
          errorMessage: '没有找到符合条件的设备数据'
        };
      }

      const fileName = `devices_export_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      const filePath = path.join(this.exportDir, fileName);

      if (format === 'excel') {
        await this.generateDeviceExcel(devices, filePath, columns);
      } else {
        await this.generateDeviceCSV(devices, filePath, columns);
      }

      this.logger.log(`设备数据导出成功: ${fileName}, 记录数: ${devices.length}`);

      return {
        success: true,
        filePath,
        fileName,
        downloadUrl: `/api/exports/download/${fileName}`,
        recordCount: devices.length
      };

    } catch (error) {
      this.logger.error('设备数据导出失败', error);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * 导出商户数据
   */
  async exportMerchants(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const {
        startDate,
        endDate,
        format = 'excel',
        filters = {},
        columns = []
      } = options;

      const whereConditions: any = {};
      
      if (startDate && endDate) {
        whereConditions.created_at = Between(startDate, endDate);
      }

      if (filters.status) {
        whereConditions.status = filters.status;
      }

      const merchants = await this.merchantRepository.find({
        where: whereConditions,
        order: { created_at: 'DESC' }
      });

      if (merchants.length === 0) {
        return {
          success: false,
          errorMessage: '没有找到符合条件的商户数据'
        };
      }

      const fileName = `merchants_export_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      const filePath = path.join(this.exportDir, fileName);

      if (format === 'excel') {
        await this.generateMerchantExcel(merchants, filePath, columns);
      } else {
        await this.generateMerchantCSV(merchants, filePath, columns);
      }

      this.logger.log(`商户数据导出成功: ${fileName}, 记录数: ${merchants.length}`);

      return {
        success: true,
        filePath,
        fileName,
        downloadUrl: `/api/exports/download/${fileName}`,
        recordCount: merchants.length
      };

    } catch (error) {
      this.logger.error('商户数据导出失败', error);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * 导出财务报表
   */
  async exportFinancialReport(options: ExportOptions = {}): Promise<ExportResult> {
    try {
      const {
        startDate,
        endDate,
        format = 'excel',
        filters = {}
      } = options;

      if (!startDate || !endDate) {
        return {
          success: false,
          errorMessage: '财务报表导出需要指定开始和结束日期'
        };
      }

      // 查询订单数据用于财务统计
      const orders = await this.orderRepository.find({
        where: {
          created_at: Between(startDate, endDate),
          status: OrderStatus.DONE
        },
        relations: ['user', 'device', 'merchant'],
        order: { created_at: 'DESC' }
      });

      if (orders.length === 0) {
        return {
          success: false,
          errorMessage: '指定时间段内没有完成的订单'
        };
      }

      const fileName = `financial_report_${Date.now()}.xlsx`;
      const filePath = path.join(this.exportDir, fileName);

      await this.generateFinancialReportExcel(orders, filePath, startDate, endDate);

      this.logger.log(`财务报表导出成功: ${fileName}, 订单数: ${orders.length}`);

      return {
        success: true,
        filePath,
        fileName,
        downloadUrl: `/api/exports/download/${fileName}`,
        recordCount: orders.length
      };

    } catch (error) {
      this.logger.error('财务报表导出失败', error);
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * 生成订单Excel文件
   */
  private async generateOrderExcel(orders: Order[], filePath: string, columns: string[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('订单数据');

    // 设置列标题
    const defaultColumns = [
      { header: '订单ID', key: 'id', width: 10 },
      { header: '订单号', key: 'order_no', width: 20 },
      { header: '用户手机', key: 'user_phone', width: 15 },
      { header: '设备名称', key: 'device_name', width: 20 },
      { header: '商户名称', key: 'merchant_name', width: 20 },
      { header: '订单金额', key: 'amount', width: 12 },
      { header: '实付金额', key: 'paid_amount', width: 12 },
      { header: '订单状态', key: 'status', width: 12 },
      { header: '支付方式', key: 'payment_method', width: 15 },
      { header: '创建时间', key: 'created_at', width: 20 },
      { header: '完成时间', key: 'completed_at', width: 20 }
    ];

    worksheet.columns = defaultColumns;

    // 添加数据
    orders.forEach(order => {
      worksheet.addRow({
        id: order.id,
        order_no: order.order_no,
        user_phone: order.user?.phone || '',
        device_name: order.device?.name || '',
        merchant_name: order.merchant?.company_name || '',
        amount: order.amount,
        paid_amount: order.paid_amount,
        status: this.getOrderStatusText(order.status),
        payment_method: this.getPaymentMethodText(order.payment_method),
        created_at: order.created_at?.toLocaleString() || '',
        end_at: order.end_at?.toLocaleString() || ''
      });
    });

    // 设置样式
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * 生成用户Excel文件
   */
  private async generateUserExcel(users: User[], filePath: string, columns: string[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('用户数据');

    const defaultColumns = [
      { header: '用户ID', key: 'id', width: 10 },
      { header: '手机号', key: 'phone', width: 15 },
      { header: '昵称', key: 'nickname', width: 20 },
      { header: '余额', key: 'balance', width: 12 },
      { header: 'VIP等级', key: 'vip_level', width: 10 },
      { header: '积分', key: 'points', width: 10 },
      { header: '注册时间', key: 'created_at', width: 20 },
      { header: '最后登录', key: 'last_login_at', width: 20 }
    ];

    worksheet.columns = defaultColumns;

    users.forEach(user => {
      worksheet.addRow({
        id: user.id,
        phone: user.phone,
        nickname: user.nickname || '',
        balance: user.balance,
        gift_balance: user.gift_balance,
        created_at: user.created_at?.toLocaleString() || '',
        last_login_at: user.last_login_at?.toLocaleString() || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * 生成设备Excel文件
   */
  private async generateDeviceExcel(devices: Device[], filePath: string, columns: string[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('设备数据');

    const defaultColumns = [
      { header: '设备ID', key: 'id', width: 10 },
      { header: '设备名称', key: 'name', width: 20 },
      { header: '设备编号', key: 'device_no', width: 20 },
      { header: '商户名称', key: 'merchant_name', width: 20 },
      { header: '设备状态', key: 'status', width: 12 },
      { header: '位置', key: 'location', width: 30 },
      { header: '创建时间', key: 'created_at', width: 20 },
      { header: '最后维护', key: 'last_maintenance_at', width: 20 }
    ];

    worksheet.columns = defaultColumns;

    devices.forEach(device => {
      worksheet.addRow({
        id: device.id,
        name: device.name,
        devid: device.devid,
        merchant_name: device.merchant?.name || '',
        status: this.getDeviceStatusText(device.status),
        location: device.location || '',
        created_at: device.created_at?.toLocaleString() || '',
        last_seen_at: device.last_seen_at?.toLocaleString() || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * 生成商户Excel文件
   */
  private async generateMerchantExcel(merchants: Merchant[], filePath: string, columns: string[]): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('商户数据');

    const defaultColumns = [
      { header: '商户ID', key: 'id', width: 10 },
      { header: '商户名称', key: 'name', width: 20 },
      { header: '联系人', key: 'contact_name', width: 15 },
      { header: '联系电话', key: 'contact_phone', width: 15 },
      { header: '审核状态', key: 'status', width: 12 },
      { header: '分成比例', key: 'commission_rate', width: 12 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];

    worksheet.columns = defaultColumns;

    merchants.forEach(merchant => {
      worksheet.addRow({
        id: merchant.id,
        company_name: merchant.company_name,
        contact_person: merchant.contact_person,
        contact_phone: merchant.contact_phone,
        status: this.getMerchantStatusText(merchant.status),
        commission_rate: `${(merchant.commission_rate * 100).toFixed(2)}%`,
        created_at: merchant.created_at?.toLocaleString() || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * 生成财务报表Excel文件
   */
  private async generateFinancialReportExcel(
    orders: Order[], 
    filePath: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    
    // 汇总数据工作表
    const summarySheet = workbook.addWorksheet('财务汇总');
    
    // 计算汇总数据
    const totalRevenue = orders.reduce((sum, order) => sum + order.paid_amount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalRevenue / totalOrders;
    
    // 按商户分组统计
    const merchantStats = new Map();
    orders.forEach(order => {
      const merchantId = order.merchant_id;
      const merchantName = order.merchant?.company_name || '未知商户';
      
      if (!merchantStats.has(merchantId)) {
        merchantStats.set(merchantId, {
          name: merchantName,
          orderCount: 0,
          revenue: 0,
          commission: 0
        });
      }
      
      const stats = merchantStats.get(merchantId);
      stats.orderCount++;
      stats.revenue += order.paid_amount;
      stats.commission += order.paid_amount * (order.merchant?.commission_rate || 0);
    });

    // 添加汇总信息
    summarySheet.addRow(['财务报表汇总']);
    summarySheet.addRow(['报表期间', `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`]);
    summarySheet.addRow(['总订单数', totalOrders]);
    summarySheet.addRow(['总收入', `¥${totalRevenue.toFixed(2)}`]);
    summarySheet.addRow(['平均订单金额', `¥${avgOrderValue.toFixed(2)}`]);
    summarySheet.addRow([]);

    // 商户收入统计
    summarySheet.addRow(['商户收入统计']);
    summarySheet.addRow(['商户名称', '订单数量', '总收入', '平台分成']);
    
    merchantStats.forEach(stats => {
      summarySheet.addRow([
        stats.name,
        stats.orderCount,
        `¥${stats.revenue.toFixed(2)}`,
        `¥${stats.commission.toFixed(2)}`
      ]);
    });

    // 详细订单数据工作表
    const detailSheet = workbook.addWorksheet('订单明细');
    await this.generateOrderExcel(orders, '', []);
    
    // 复制订单数据到详细工作表
    const tempWorkbook = new ExcelJS.Workbook();
    const tempSheet = tempWorkbook.addWorksheet('temp');
    
    const columns = [
      { header: '订单号', key: 'order_no', width: 20 },
      { header: '商户名称', key: 'merchant_name', width: 20 },
      { header: '订单金额', key: 'amount', width: 12 },
      { header: '实付金额', key: 'paid_amount', width: 12 },
      { header: '平台分成', key: 'commission', width: 12 },
      { header: '创建时间', key: 'created_at', width: 20 }
    ];

    detailSheet.columns = columns;

    orders.forEach(order => {
      const commission = order.paid_amount * (order.merchant?.commission_rate || 0);
      detailSheet.addRow({
        order_no: order.order_no,
        merchant_name: order.merchant?.company_name || '',
        amount: order.amount,
        paid_amount: order.paid_amount,
        commission: commission.toFixed(2),
        created_at: order.created_at?.toLocaleString() || ''
      });
    });

    // 设置样式
    [summarySheet, detailSheet].forEach(sheet => {
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });

    await workbook.xlsx.writeFile(filePath);
  }

  /**
   * 生成CSV文件（简化实现）
   */
  private async generateOrderCSV(orders: Order[], filePath: string, columns: string[]): Promise<void> {
    const headers = ['订单ID', '订单号', '用户手机', '设备名称', '订单金额', '订单状态', '创建时间'];
    const csvContent = [
      headers.join(','),
      ...orders.map(order => [
        order.id,
        order.order_no,
        order.user?.phone || '',
        order.device?.name || '',
        order.amount,
        this.getOrderStatusText(order.status),
        order.created_at?.toLocaleString() || ''
      ].join(','))
    ].join('\n');

    fs.writeFileSync(filePath, csvContent, 'utf8');
  }

  private async generateUserCSV(users: User[], filePath: string, columns: string[]): Promise<void> {
    const headers = ['用户ID', '手机号', '昵称', '余额', 'VIP等级', '注册时间'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user.id,
        user.phone,
        user.nickname || '',
        user.balance,
        user.gift_balance,
        user.created_at?.toLocaleString() || ''
      ].join(','))
    ].join('\n');

    fs.writeFileSync(filePath, csvContent, 'utf8');
  }

  private async generateDeviceCSV(devices: Device[], filePath: string, columns: string[]): Promise<void> {
    const headers = ['设备ID', '设备名称', '设备编号', '商户名称', '设备状态', '创建时间'];
    const csvContent = [
      headers.join(','),
      ...devices.map(device => [
        device.id,
        device.name,
        device.devid,
        device.merchant?.name || '',
        this.getDeviceStatusText(device.status),
        device.created_at?.toLocaleString() || ''
      ].join(','))
    ].join('\n');

    fs.writeFileSync(filePath, csvContent, 'utf8');
  }

  private async generateMerchantCSV(merchants: Merchant[], filePath: string, columns: string[]): Promise<void> {
    const headers = ['商户ID', '商户名称', '联系人', '联系电话', '审核状态', '创建时间'];
    const csvContent = [
      headers.join(','),
      ...merchants.map(merchant => [
        merchant.id,
        merchant.company_name,
        merchant.contact_person,
        merchant.contact_phone,
        this.getMerchantStatusText(merchant.status),
        merchant.created_at?.toLocaleString() || ''
      ].join(','))
    ].join('\n');

    fs.writeFileSync(filePath, csvContent, 'utf8');
  }

  /**
   * 确保导出目录存在
   */
  private ensureExportDirectory(): void {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * 获取订单状态文本
   */
  private getOrderStatusText(status: string): string {
    const statusMap = {
      'pending': '待支付',
      'paid': '已支付',
      'in_progress': '洗车中',
      'completed': '已完成',
      'cancelled': '已取消',
      'refunded': '已退款'
    };
    return statusMap[status] || status;
  }

  /**
   * 获取支付方式文本
   */
  private getPaymentMethodText(method: string): string {
    const methodMap = {
      'wechat_jsapi': '微信支付',
      'wechat_h5': '微信H5支付',
      'balance': '余额支付'
    };
    return methodMap[method] || method;
  }

  /**
   * 获取设备状态文本
   */
  private getDeviceStatusText(status: string): string {
    const statusMap = {
      'online': '在线',
      'offline': '离线',
      'maintenance': '维护中',
      'error': '故障'
    };
    return statusMap[status] || status;
  }

  /**
   * 获取商户状态文本
   */
  private getMerchantStatusText(status: string): string {
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝',
      'suspended': '已暂停'
    };
    return statusMap[status] || status;
  }

  /**
   * 清理过期的导出文件
   */
  async cleanupExpiredFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.exportDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.logger.log(`清理过期导出文件: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('清理导出文件失败', error);
    }
  }

  /**
   * 获取文件下载路径
   */
  getFilePath(fileName: string): string {
    return path.join(this.exportDir, fileName);
  }
}