import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { User } from '../entities/user.entity';
import { 
  UserComplaintService, 
  CreateComplaintDto, 
  UpdateComplaintDto, 
  ComplaintListQuery 
} from '../services/user-complaint.service';

@ApiTags('用户投诉管理')
@Controller('users/complaints')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UserComplaintController {
  constructor(
    private readonly userComplaintService: UserComplaintService
  ) {}

  @Post()
  @ApiOperation({ summary: '创建投诉' })
  @ApiResponse({ status: 201, description: '投诉创建成功' })
  async createComplaint(
    @CurrentUser() user: User,
    @Body() createDto: Omit<CreateComplaintDto, 'userId'>
  ) {
    return this.userComplaintService.createComplaint({
      ...createDto,
      userId: user.id
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: '获取投诉列表' })
  @ApiResponse({ status: 200, description: '投诉列表获取成功' })
  async getComplaints(@Query() query: ComplaintListQuery) {
    return this.userComplaintService.getComplaints(query);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '获取投诉统计' })
  @ApiResponse({ status: 200, description: '投诉统计获取成功' })
  async getComplaintStats() {
    return this.userComplaintService.getComplaintStats();
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的投诉' })
  @ApiResponse({ status: 200, description: '我的投诉获取成功' })
  async getMyComplaints(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.userComplaintService.getUserComplaints(user.id, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取投诉详情' })
  @ApiResponse({ status: 200, description: '投诉详情获取成功' })
  async getComplaintById(@Param('id', ParseIntPipe) id: number) {
    return this.userComplaintService.getComplaintById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: '更新投诉' })
  @ApiResponse({ status: 200, description: '投诉更新成功' })
  async updateComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateComplaintDto
  ) {
    return this.userComplaintService.updateComplaint(id, updateDto);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '分配投诉处理人' })
  @ApiResponse({ status: 200, description: '投诉分配成功' })
  async assignComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { assignedTo: number }
  ) {
    return this.userComplaintService.assignComplaint(id, body.assignedTo);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiOperation({ summary: '解决投诉' })
  @ApiResponse({ status: 200, description: '投诉解决成功' })
  async resolveComplaint(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { resolution: string }
  ) {
    return this.userComplaintService.resolveComplaint(id, body.resolution);
  }

  @Post('batch-update')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '批量更新投诉' })
  @ApiResponse({ status: 200, description: '批量更新成功' })
  async batchUpdateComplaints(
    @Body() body: { ids: number[]; updateDto: UpdateComplaintDto }
  ) {
    return this.userComplaintService.batchUpdateComplaints(body.ids, body.updateDto);
  }

  @Post('init-test-data')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: '初始化测试数据' })
  @ApiResponse({ status: 200, description: '测试数据初始化成功' })
  async initTestData() {
    await this.userComplaintService.initTestData();
    return { message: '投诉测试数据初始化成功' };
  }
}