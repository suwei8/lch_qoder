import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Param
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { BalanceTransactionService } from '../services/balance-transaction.service';
import { TransactionType } from '../entities/balance-transaction.entity';

@ApiTags('余额流水')
@Controller('balance-transactions')
export class BalanceTransactionController {
  constructor(
    private readonly balanceTransactionService: BalanceTransactionService
  ) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户余额流水' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'type', required: false, enum: TransactionType, description: '交易类型' })
  @ApiQuery({ name: 'start_date', required: false, description: '开始日期' })
  @ApiQuery({ name: 'end_date', required: false, description: '结束日期' })
  async getUserTransactions(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: TransactionType,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string
  ) {
    // 使用测试用户ID 1
    return this.balanceTransactionService.getUserTransactions(1, {
      page,
      limit,
      type,
      startDate,
      endDate
    });
  }

  @Get('balance')
  @ApiOperation({ summary: '获取当前用户余额信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserBalance() {
    // 使用测试用户ID 1
    return this.balanceTransactionService.getUserBalance(1);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取交易详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTransactionDetail(
    @Param('id') id: number
  ) {
    // 使用测试用户ID 1
    return this.balanceTransactionService.getTransactionDetail(1, id);
  }

  @Post('init-test-data')
  @ApiOperation({ summary: '初始化测试数据' })
  @ApiResponse({ status: 200, description: '初始化成功' })
  async initTestData() {
    // 使用测试用户ID 1
    return this.balanceTransactionService.initTestData(1);
  }
}