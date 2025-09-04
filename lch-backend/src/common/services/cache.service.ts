import { Injectable } from '@nestjs/common';
// import { InjectRedis } from '@nestjs-modules/ioredis';
// import Redis from 'ioredis';

@Injectable()
export class CacheService {
  // constructor(@InjectRedis() private readonly redis: Redis) {}

  private cache = new Map<string, any>();

  async get(key: string): Promise<any> {
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.cache.set(key, value);
    
    if (ttl) {
      setTimeout(() => {
        this.cache.delete(key);
      }, ttl * 1000);
    }
  }

  async del(key: string): Promise<void> {
    // 支持模式匹配删除
    if (key.includes('*')) {
      const pattern = key.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      const keysToDelete = Array.from(this.cache.keys()).filter(k => regex.test(k));
      keysToDelete.forEach(k => this.cache.delete(k));
    } else {
      this.cache.delete(key);
    }
  }

  async cacheUser(userId: number, user: any): Promise<void> {
    await this.set(`user:${userId}`, user, 3600); // 缓存1小时
  }

  async getCachedUser(userId: number): Promise<any> {
    return await this.get(`user:${userId}`);
  }

  async clearUserCache(userId: number): Promise<void> {
    await this.del(`user:${userId}`);
  }
}
