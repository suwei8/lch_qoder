import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant, MerchantStatus } from '../entities/merchant.entity';
import { CreateMerchantDto, UpdateMerchantDto, ApproveMerchantDto, MerchantListDto } from '../dto/merchant.dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { UsersService } from '../../users/services/users.service';
import { UserRole } from '../../common/interfaces/common.interface';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    private usersService: UsersService,
    private logger: LoggerService,
    private cacheService: CacheService,
  ) {}

  async create(createMerchantDto: CreateMerchantDto): Promise<Merchant> {
    try {
      // 检查用户是否存在
      const user = await this.usersService.findOne(createMerchantDto.user_id);
      
      // 检查用户是否已经是商户
      const existingMerchant = await this.merchantsRepository.findOne({
        where: { user_id: createMerchantDto.user_id }
      });

      if (existingMerchant) {
        throw new ConflictException('该用户已经是商户');
      }

      // 检查营业执照是否已存在
      const existingLicense = await this.merchantsRepository.findOne({
        where: { business_license: createMerchantDto.business_license }
      });

      if (existingLicense) {
        throw new ConflictException('营业执照号码已存在');
      }

      const merchant = this.merchantsRepository.create(createMerchantDto);
      const savedMerchant = await this.merchantsRepository.save(merchant);

      // 清除缓存
      await this.cacheService.del('merchants:list:*');
      
      this.logger.log(`商户创建成功: ${savedMerchant.id}`, 'MerchantsService');
      return savedMerchant;
    } catch (error) {
      this.logger.error(`商户创建失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async findAll(query: MerchantListDto) {
    try {
      const { keyword, status, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const queryBuilder = this.merchantsRepository.createQueryBuilder('merchant')
        .leftJoinAndSelect('merchant.user', 'user');

      // 关键字搜索
      if (keyword) {
        queryBuilder.where(
          '(merchant.company_name LIKE :keyword OR merchant.contact_person LIKE :keyword OR merchant.contact_phone LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
      }

      // 状态筛选
      if (status) {
        queryBuilder.andWhere('merchant.status = :status', { status });
      }

      // 分页
      queryBuilder
        .orderBy('merchant.created_at', 'DESC')
        .skip(offset)
        .take(limit);

      const [merchants, total] = await queryBuilder.getManyAndCount();

      return {
        data: merchants,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`商户列表查询失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async findOne(id: number): Promise<Merchant> {
    try {
      // 先尝试从缓存获取
      const cacheKey = `merchant:${id}`;
      let merchant = await this.cacheService.get(cacheKey);

      if (!merchant) {
        merchant = await this.merchantsRepository.findOne({
          where: { id },
          relations: ['user', 'devices', 'orders']
        });

        if (!merchant) {
          throw new NotFoundException('商户不存在');
        }

        // 缓存商户信息（5分钟）
        await this.cacheService.set(cacheKey, merchant, 300);
      }

      return merchant;
    } catch (error) {
      this.logger.error(`商户查询失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async findByUserId(userId: number): Promise<Merchant | null> {
    try {
      return await this.merchantsRepository.findOne({
        where: { user_id: userId },
        relations: ['user']
      });
    } catch (error) {
      this.logger.error(`通过用户ID查询商户失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async update(id: number, updateMerchantDto: UpdateMerchantDto): Promise<Merchant> {
    try {
      const merchant = await this.findOne(id);
      
      Object.assign(merchant, updateMerchantDto);
      const updatedMerchant = await this.merchantsRepository.save(merchant);

      // 清除缓存
      await this.cacheService.del(`merchant:${id}`);
      await this.cacheService.del('merchants:list:*');

      this.logger.log(`商户更新成功: ${id}`, 'MerchantsService');
      return updatedMerchant;
    } catch (error) {
      this.logger.error(`商户更新失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async approve(id: number, approveMerchantDto: ApproveMerchantDto, approvedBy: number): Promise<Merchant> {
    try {
      const merchant = await this.findOne(id);

      if (merchant.status !== MerchantStatus.PENDING) {
        throw new BadRequestException('只能审批待审核状态的商户');
      }

      merchant.status = approveMerchantDto.status;
      if (approveMerchantDto.reject_reason) {
        merchant.reject_reason = approveMerchantDto.reject_reason;
      }

      if (approveMerchantDto.status === MerchantStatus.APPROVED) {
        merchant.approved_at = new Date();
        merchant.approved_by = approvedBy;
        
        // 更新用户角色为商户
        await this.usersService.update(merchant.user_id, { role: UserRole.MERCHANT });
      }

      const updatedMerchant = await this.merchantsRepository.save(merchant);

      // 清除缓存
      await this.cacheService.del(`merchant:${id}`);
      await this.cacheService.del('merchants:list:*');

      this.logger.log(`商户审批完成: ${id}, 状态: ${approveMerchantDto.status}`, 'MerchantsService');
      return updatedMerchant;
    } catch (error) {
      this.logger.error(`商户审批失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async updateRevenue(id: number, amount: number): Promise<void> {
    try {
      const merchant = await this.findOne(id);
      
      merchant.total_revenue = Number(merchant.total_revenue) + amount;
      merchant.pending_settlement = Number(merchant.pending_settlement) + amount * Number(merchant.commission_rate);

      await this.merchantsRepository.save(merchant);

      // 清除缓存
      await this.cacheService.del(`merchant:${id}`);

      this.logger.log(`商户收入更新成功: ${id}, 金额: ${amount}`, 'MerchantsService');
    } catch (error) {
      this.logger.error(`商户收入更新失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async settlement(id: number, amount: number): Promise<void> {
    try {
      const merchant = await this.findOne(id);
      
      if (Number(merchant.pending_settlement) < amount) {
        throw new BadRequestException('待结算金额不足');
      }

      merchant.pending_settlement = Number(merchant.pending_settlement) - amount;
      await this.merchantsRepository.save(merchant);

      // 清除缓存
      await this.cacheService.del(`merchant:${id}`);

      this.logger.log(`商户结算成功: ${id}, 金额: ${amount}`, 'MerchantsService');
    } catch (error) {
      this.logger.error(`商户结算失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const merchant = await this.findOne(id);
      
      // 软删除 - 将状态设置为暂停
      await this.merchantsRepository.update(id, { status: MerchantStatus.SUSPENDED });

      // 清除缓存
      await this.cacheService.del(`merchant:${id}`);
      await this.cacheService.del('merchants:list:*');

      this.logger.log(`商户删除成功: ${id}`, 'MerchantsService');
    } catch (error) {
      this.logger.error(`商户删除失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }

  async getStats() {
    try {
      const cacheKey = 'merchants:stats';
      let stats = await this.cacheService.get(cacheKey);

      if (!stats) {
        const [
          totalMerchants,
          approvedMerchants,
          pendingMerchants,
          todayNewMerchants
        ] = await Promise.all([
          this.merchantsRepository.count(),
          this.merchantsRepository.count({ where: { status: MerchantStatus.APPROVED } }),
          this.merchantsRepository.count({ where: { status: MerchantStatus.PENDING } }),
          this.merchantsRepository.count({
            where: {
              created_at: new Date(new Date().toDateString())
            }
          })
        ]);

        const totalRevenue = await this.merchantsRepository
          .createQueryBuilder('merchant')
          .select('SUM(merchant.total_revenue)', 'total')
          .getRawOne();

        const pendingSettlement = await this.merchantsRepository
          .createQueryBuilder('merchant')
          .select('SUM(merchant.pending_settlement)', 'total')
          .getRawOne();

        stats = {
          totalMerchants,
          approvedMerchants,
          pendingMerchants,
          todayNewMerchants,
          totalRevenue: Number(totalRevenue?.total || 0),
          pendingSettlement: Number(pendingSettlement?.total || 0)
        };

        // 缓存10分钟
        await this.cacheService.set(cacheKey, stats, 600);
      }

      return stats;
    } catch (error) {
      this.logger.error(`获取商户统计失败: ${error.message}`, error.stack, 'MerchantsService');
      throw error;
    }
  }
}