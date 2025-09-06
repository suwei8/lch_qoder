<template>
  <div class="merchant-dashboard">
    <div class="dashboard-header">
      <div class="welcome-section">
        <h1>欢迎回来，{{ authStore.currentUser?.nickname }}</h1>
        <p>今天是 {{ formatDate(new Date()) }}</p>
      </div>
      <div class="user-actions">
        <el-button type="primary" @click="handleLogout">退出登录</el-button>
      </div>
    </div>

    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Shop /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ merchantStats.deviceCount }}</div>
            <div class="stat-label">设备总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ merchantStats.onlineDevices }}</div>
            <div class="stat-label">在线设备</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff2e8; color: #fa8c16;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ merchantStats.todayRevenue }}</div>
            <div class="stat-label">今日收入</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f9f0ff; color: #722ed1;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ merchantStats.todayOrders }}</div>
            <div class="stat-label">今日订单</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 功能导航 -->
    <div class="function-grid">
      <h2>快捷功能</h2>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="function-card" @click="navigateTo('/merchant/devices')">
            <div class="function-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <h3>设备管理</h3>
            <p>查看设备状态，远程控制设备</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="function-card" @click="navigateTo('/merchant/orders')">
            <div class="function-icon">
              <el-icon><List /></el-icon>
            </div>
            <h3>订单管理</h3>
            <p>查看订单记录，处理异常订单</p>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="function-card" @click="navigateTo('/merchant/finance')">
            <div class="function-icon">
              <el-icon><Wallet /></el-icon>
            </div>
            <h3>财务管理</h3>
            <p>查看收入统计，申请提现</p>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 近期订单 -->
    <div class="recent-orders">
      <h2>近期订单</h2>
      <el-table :data="recentOrders" style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="deviceName" label="设备" width="200" />
        <el-table-column prop="amount" label="金额">
          <template #default="scope">
            ¥{{ (scope.row.amount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)"
              size="small"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// 商户统计数据
const merchantStats = ref({
  deviceCount: 0,
  onlineDevices: 0,
  todayRevenue: '0.00',
  todayOrders: 0,
});

// 近期订单数据
const recentOrders = ref<any[]>([]);

// 格式化日期
const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });
};

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 获取订单状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'DONE': 'success',
    'IN_USE': 'warning',
    'CLOSED': 'danger',
    'PAID': 'primary',
  };
  return statusMap[status] || 'info';
};

// 获取订单状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'DONE': '已完成',
    'IN_USE': '使用中',
    'CLOSED': '已关闭',
    'PAID': '已支付',
    'INIT': '初始化',
  };
  return statusMap[status] || status;
};

// 导航到指定页面
const navigateTo = (path: string) => {
  ElMessage.info('功能开发中，敬请期待');
  // router.push(path);
};

// 退出登录
const handleLogout = () => {
  authStore.clearAuth();
  ElMessage.success('已退出登录');
  router.push('/merchant-login');
};

// 加载模拟数据
const loadMockData = () => {
  // 根据当前登录的商户生成对应的模拟数据
  const userId = authStore.currentUser?.id || 1;
  
  merchantStats.value = {
    deviceCount: Math.floor(Math.random() * 3) + 2, // 2-4台设备
    onlineDevices: Math.floor(Math.random() * 3) + 1, // 1-3台在线
    todayRevenue: (Math.random() * 500 + 100).toFixed(2), // 100-600元
    todayOrders: Math.floor(Math.random() * 20) + 5, // 5-25个订单
  };

  // 生成模拟订单数据
  recentOrders.value = Array.from({ length: 10 }, (_, index) => ({
    orderNo: `LCH${Date.now()}${String(index).padStart(3, '0')}`,
    userName: `用户${Math.floor(Math.random() * 1000)}`,
    deviceName: `${authStore.currentUser?.nickname} - ${Math.floor(Math.random() * 3) + 1}号机`,
    amount: Math.floor(Math.random() * 4000) + 500, // 5-45元
    status: ['DONE', 'IN_USE', 'CLOSED', 'PAID'][Math.floor(Math.random() * 4)],
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

onMounted(() => {
  loadMockData();
});
</script>

<style scoped>
.merchant-dashboard {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.welcome-section h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.welcome-section p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon .el-icon {
  font-size: 24px;
}

.stat-content .stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-content .stat-label {
  font-size: 14px;
  color: #666;
}

.function-grid {
  margin-bottom: 32px;
}

.function-grid h2 {
  margin-bottom: 16px;
  color: #333;
}

.function-card {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.function-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.function-icon {
  width: 64px;
  height: 64px;
  border-radius: 32px;
  background: linear-gradient(135deg, #52c41a 0%, #722ed1 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.function-icon .el-icon {
  font-size: 32px;
}

.function-card h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.function-card p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.recent-orders {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recent-orders h2 {
  margin: 0 0 16px 0;
  color: #333;
}
</style>