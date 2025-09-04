import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MerchantsService } from '../services/merchants.service';
import { CreateMerchantDto, UpdateMerchantDto, ApproveMerchantDto, MerchantListDto } from '../dto/merchant.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { User } from '../../users/entities/user.entity';

@ApiTags('商户管理')
@Controller('merchants')
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建商户' })
  @ApiResponse({ status: 201, description: '商户创建成功' })
  async create(@Body() createMerchantDto: CreateMerchantDto) {
    return this.merchantsService.create(createMerchantDto);
  }

  @Post('apply')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '申请成为商户' })
  @ApiResponse({ status: 201, description: '申请提交成功' })
  async apply(@CurrentUser() user: User, @Body() createMerchantDto: Omit<CreateMerchantDto, 'user_id'>) {
    return this.merchantsService.create({
      ...createMerchantDto,
      user_id: user.id
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取商户列表' })
  @ApiResponse({ status: 200, description: '商户列表获取成功' })
  async findAll(@Query() query: MerchantListDto) {
    return this.merchantsService.findAll(query);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前商户信息' })
  @ApiResponse({ status: 200, description: '商户信息获取成功' })
  async getProfile(@CurrentUser() user: User) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      return null;
    }
    return merchant;
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取商户统计信息' })
  @ApiResponse({ status: 200, description: '商户统计获取成功' })
  async getStats() {
    return this.merchantsService.getStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取指定商户信息' })
  @ApiResponse({ status: 200, description: '商户信息获取成功' })
  async findOne(@Param('id') id: string) {
    return this.merchantsService.findOne(+id);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新当前商户信息' })
  @ApiResponse({ status: 200, description: '商户信息更新成功' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateMerchantDto: UpdateMerchantDto
  ) {
    const merchant = await this.merchantsService.findByUserId(user.id);
    if (!merchant) {
      throw new Error('商户不存在');
    }
    return this.merchantsService.update(merchant.id, updateMerchantDto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新指定商户信息' })
  @ApiResponse({ status: 200, description: '商户信息更新成功' })
  async update(@Param('id') id: string, @Body() updateMerchantDto: UpdateMerchantDto) {
    return this.merchantsService.update(+id, updateMerchantDto);
  }

  @Patch(':id/approve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '审批商户申请' })
  @ApiResponse({ status: 200, description: '商户审批成功' })
  async approve(
    @Param('id') id: string,
    @Body() approveMerchantDto: ApproveMerchantDto,
    @CurrentUser() user: User
  ) {
    return this.merchantsService.approve(+id, approveMerchantDto, user.id);
  }

  @Patch(':id/settlement')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '商户结算' })
  @ApiResponse({ status: 200, description: '结算成功' })
  async settlement(
    @Param('id') id: string,
    @Body() body: { amount: number }
  ) {
    return this.merchantsService.settlement(+id, body.amount);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除商户' })
  @ApiResponse({ status: 200, description: '商户删除成功' })
  async remove(@Param('id') id: string) {
    return this.merchantsService.remove(+id);
  }
}