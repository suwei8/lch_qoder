import { Injectable } from '@nestjs/common';

@Injectable()
export class StoresService {
  // 模拟门店数据
  private mockStores = [
    {
      id: 1,
      name: '便民洗衣店(万达店)',
      address: '万达广场B1层',
      latitude: 39.9042,
      longitude: 116.4074,
      image: '/images/store1.jpg',
      status: 'active',
      deviceCount: 8,
      availableDevices: 6,
      minPrice: 3.5,
      maxPrice: 15.0,
      phone: '010-12345678',
      businessHours: '08:00-22:00',
      description: '24小时自助洗衣服务，设备齐全，环境整洁'
    },
    {
      id: 2,
      name: '便民洗衣店(中关村店)',
      address: '中关村大街1号',
      latitude: 39.9889,
      longitude: 116.3058,
      image: '/images/store2.jpg',
      status: 'active',
      deviceCount: 12,
      availableDevices: 9,
      minPrice: 4.0,
      maxPrice: 18.0,
      phone: '010-87654321',
      businessHours: '07:00-23:00',
      description: '高端洗衣设备，支持多种洗涤模式'
    },
    {
      id: 3,
      name: '便民洗衣店(国贸店)',
      address: '国贸商城地下一层',
      latitude: 39.9088,
      longitude: 116.4317,
      image: '/images/store3.jpg',
      status: 'active',
      deviceCount: 6,
      availableDevices: 4,
      minPrice: 5.0,
      maxPrice: 20.0,
      phone: '010-11223344',
      businessHours: '08:30-21:30',
      description: '商务区优质洗衣服务，快速便捷'
    },
    {
      id: 4,
      name: '便民洗衣店(三里屯店)',
      address: '三里屯太古里南区',
      latitude: 39.9368,
      longitude: 116.4472,
      image: '/images/store4.jpg',
      status: 'inactive',
      deviceCount: 10,
      availableDevices: 0,
      minPrice: 4.5,
      maxPrice: 16.0,
      phone: '010-55667788',
      businessHours: '09:00-22:00',
      description: '时尚购物区洗衣服务，设备维护中'
    }
  ];

  // 模拟设备数据
  private mockDevices = [
    {
      id: 1,
      storeId: 1,
      name: '洗衣机A1',
      type: 'washer',
      status: 'available',
      price: 3.5,
      capacity: '8kg',
      duration: 45,
      description: '标准洗涤程序'
    },
    {
      id: 2,
      storeId: 1,
      name: '洗衣机A2',
      type: 'washer',
      status: 'busy',
      price: 3.5,
      capacity: '8kg',
      duration: 45,
      remainingTime: 25,
      description: '标准洗涤程序'
    },
    {
      id: 3,
      storeId: 1,
      name: '烘干机B1',
      type: 'dryer',
      status: 'available',
      price: 2.0,
      capacity: '8kg',
      duration: 30,
      description: '高温烘干'
    }
  ];

  async getStoreList(params: {
    page: number;
    limit: number;
    keyword?: string;
  }) {
    let stores = [...this.mockStores];
    
    // 关键词搜索
    if (params.keyword) {
      stores = stores.filter(store => 
        store.name.includes(params.keyword!) || 
        store.address.includes(params.keyword!)
      );
    }

    // 分页
    const total = stores.length;
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const data = stores.slice(start, end);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async getNearbyStores(params: {
    latitude: number;
    longitude: number;
    radius: number;
    limit: number;
  }) {
    // 计算距离并过滤
    const storesWithDistance = this.mockStores.map(store => {
      const distance = this.calculateDistance(
        params.latitude,
        params.longitude,
        store.latitude,
        store.longitude
      );
      
      return {
        ...store,
        distance: Math.round(distance)
      };
    }).filter(store => store.distance <= params.radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, params.limit);

    return storesWithDistance;
  }

  async searchStores(params: {
    keyword: string;
    latitude?: number;
    longitude?: number;
    page: number;
    limit: number;
  }) {
    let stores = this.mockStores.filter(store => 
      store.name.includes(params.keyword) || 
      store.address.includes(params.keyword)
    );

    // 如果有位置信息，计算距离并排序
    if (params.latitude && params.longitude) {
      stores = stores.map(store => ({
        ...store,
        distance: Math.round(this.calculateDistance(
          params.latitude!,
          params.longitude!,
          store.latitude,
          store.longitude
        ))
      })).sort((a, b) => (a as any).distance - (b as any).distance);
    }

    // 分页
    const total = stores.length;
    const start = (params.page - 1) * params.limit;
    const end = start + params.limit;
    const data = stores.slice(start, end);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit)
    };
  }

  async getStoreDetail(id: number) {
    const store = this.mockStores.find(s => s.id === id);
    if (!store) {
      throw new Error('门店不存在');
    }
    return store;
  }

  async getStoreDevices(storeId: number) {
    return this.mockDevices.filter(device => device.storeId === storeId);
  }

  // 计算两点间距离（米）
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}