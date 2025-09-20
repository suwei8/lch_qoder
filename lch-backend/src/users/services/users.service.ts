import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole, UserStatus } from '../../common/interfaces/common.interface';
import { CreateUserDto, UpdateUserDto, UserListDto } from '../dto/user.dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private logger: LoggerService,
    private cacheService: CacheService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // 检查手机号是否已存在
      const existingUser = await this.usersRepository.findOne({
        where: { phone: createUserDto.phone }
      });

      if (existingUser) {
        throw new BadRequestException('手机号已存在');
      }

      const user = this.usersRepository.create(createUserDto);
      const savedUser = await this.usersRepository.save(user);
      
      // 清除用户列表缓存
      await this.cacheService.del('users:list:*');
      
      this.logger.log(`用户创建成功: ${savedUser.id}`, 'UsersService');
      return savedUser;
    } catch (error) {
      this.logger.error(`用户创建失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async findAll(query: UserListDto) {
    try {
      const { keyword, role, status, page = 1, limit = 20, pageSize } = query;
      // 如果提供了pageSize，使用pageSize，否则使用limit
      const actualLimit = pageSize || limit;
      const offset = (page - 1) * actualLimit;

      const queryBuilder = this.usersRepository.createQueryBuilder('user');

      // 关键字搜索
      if (keyword) {
        queryBuilder.where(
          '(user.phone LIKE :keyword OR user.nickname LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
      }

      // 角色筛选
      if (role) {
        queryBuilder.andWhere('user.role = :role', { role });
      }

      // 状态筛选
      if (status) {
        queryBuilder.andWhere('user.status = :status', { status });
      }

      // 分页
      queryBuilder
        .orderBy('user.created_at', 'DESC')
        .skip(offset)
        .take(actualLimit);

      const [users, total] = await queryBuilder.getManyAndCount();

      return {
        data: users,
        total,
        page,
        limit: actualLimit,
        totalPages: Math.ceil(total / actualLimit)
      };
    } catch (error) {
      this.logger.error(`用户列表查询失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async findOne(id: number): Promise<User> {
    try {
      // 先尝试从缓存获取
      const cacheKey = `user:${id}`;
      let user = await this.cacheService.get(cacheKey);

      if (!user) {
        user = await this.usersRepository.findOne({
          where: { id },
          relations: ['orders']
        });

        if (!user) {
          throw new NotFoundException('用户不存在');
        }

        // 缓存用户信息（5分钟）
        await this.cacheService.set(cacheKey, user, 300);
      }

      return user;
    } catch (error) {
      this.logger.error(`用户查询失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async findByPhone(phone: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: { phone }
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      return user;
    } catch (error) {
      this.logger.error(`通过手机号查询用户失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async findByWechatOpenid(openid: string): Promise<User | null> {
    try {
      return await this.usersRepository.findOne({
        where: { wechat_openid: openid }
      });
    } catch (error) {
      this.logger.error(`通过微信openid查询用户失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findOne(id);
      
      Object.assign(user, updateUserDto);
      const updatedUser = await this.usersRepository.save(user);

      // 清除缓存
      await this.cacheService.del(`user:${id}`);
      await this.cacheService.del('users:list:*');

      this.logger.log(`用户更新成功: ${id}`, 'UsersService');
      return updatedUser;
    } catch (error) {
      this.logger.error(`用户更新失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async updateBalance(id: number, amount: number, operation: 'add' | 'subtract'): Promise<User> {
    try {
      const user = await this.findOne(id);
      
      if (operation === 'add') {
        user.balance = Number(user.balance) + amount;
      } else {
        if (Number(user.balance) < amount) {
          throw new BadRequestException('余额不足');
        }
        user.balance = Number(user.balance) - amount;
      }

      const updatedUser = await this.usersRepository.save(user);

      // 清除缓存
      await this.cacheService.del(`user:${id}`);

      this.logger.log(`用户余额更新成功: ${id}, 操作: ${operation}, 金额: ${amount}`, 'UsersService');
      return updatedUser;
    } catch (error) {
      this.logger.error(`用户余额更新失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async updateGiftBalance(id: number, amount: number, operation: 'add' | 'subtract'): Promise<User> {
    try {
      const user = await this.findOne(id);
      
      if (operation === 'add') {
        user.gift_balance = Number(user.gift_balance || 0) + amount;
      } else {
        const currentGiftBalance = Number(user.gift_balance || 0);
        if (currentGiftBalance < amount) {
          throw new BadRequestException('赠送余额不足');
        }
        user.gift_balance = currentGiftBalance - amount;
      }

      const updatedUser = await this.usersRepository.save(user);

      // 清除缓存
      await this.cacheService.del(`user:${id}`);

      this.logger.log(`用户赠送余额更新成功: ${id}, 操作: ${operation}, 金额: ${amount}`, 'UsersService');
      return updatedUser;
    } catch (error) {
      this.logger.error(`用户赠送余额更新失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async updateLoginInfo(id: number, ip: string): Promise<void> {
    try {
      await this.usersRepository.update(id, {
        last_login_at: new Date(),
        last_login_ip: ip
      });

      // 清除缓存
      await this.cacheService.del(`user:${id}`);
    } catch (error) {
      this.logger.error(`更新登录信息失败: ${error.message}`, error.stack, 'UsersService');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const user = await this.findOne(id);
      
      // 软删除 - 将状态设置为已禁用
      await this.usersRepository.update(id, { status: UserStatus.BANNED });

      // 清除缓存
      await this.cacheService.del(`user:${id}`);
      await this.cacheService.del('users:list:*');

      this.logger.log(`用户删除成功: ${id}`, 'UsersService');
    } catch (error) {
      this.logger.error(`用户删除失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  async getStats() {
    try {
      const cacheKey = 'users:stats';
      let stats = await this.cacheService.get(cacheKey);

      if (!stats) {
        const [
          totalUsers,
          activeUsers,
          merchantUsers,
          todayNewUsers
        ] = await Promise.all([
          this.usersRepository.count(),
          this.usersRepository.count({ where: { status: UserStatus.ACTIVE } }),
          this.usersRepository.count({ where: { role: UserRole.MERCHANT } }),
          this.usersRepository.count({
            where: {
              created_at: new Date(new Date().toDateString())
            }
          })
        ]);

        stats = {
          totalUsers,
          activeUsers,
          merchantUsers,
          todayNewUsers
        };

        // 缓存10分钟
        await this.cacheService.set(cacheKey, stats, 600);
      }

      return stats;
    } catch (error) {
      this.logger.error(`获取用户统计失败: ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }

  /**
   * 增加用户余额 (OrdersService需要)
   */
  async addBalance(userId: number, amount: number, reason: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 更新用户余额
      const newBalance = (user.balance || 0) + amount;
      await this.usersRepository.update(userId, {
        balance: newBalance
      });

      // 清除用户缓存
      await this.cacheService.del(`user:${userId}`);

      this.logger.log(`用户余额增加成功: 用户${userId}, 金额${amount}, 原因: ${reason}`, 'UsersService');
    } catch (error) {
      this.logger.error(`用户余额增加失败: 用户${userId}, ${error.message}`, error.stack, 'UsersService');
      throw error;
    }
  }
}