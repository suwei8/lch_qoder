<template>
  <div class="merchant-orders">
    <div class="page-header">
      <h1>订单管理</h1>
      <p>查看和管理您的洗车订单</p>
    </div>

    <!-- 订单统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.total }}</div>
            <div class="stat-label">总订单数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff2e8; color: #fa8c16;">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f9f0ff; color: #722ed1;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ orderStats.todayRevenue }}</div>
            <div class="stat-label">今日收入</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-form :model="searchForm" layout="inline">
        <el-form-item label="订单号">
          <el-input 
            v-model="searchForm.orderNo" 
            placeholder="请输入订单号"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="用户手机号">
          <el-input 
            v-model="searchForm.userPhone" 
            placeholder="请输入用户手机号"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            style="width: 150px"
          >
            <el-option label="全部" value="" />
            <el-option label="已完成" value="DONE" />
            <el-option label="使用中" value="IN_USE" />
            <el-option label="已关闭" value="CLOSED" />
            <el-option label="已支付" value="PAID" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchOrders">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 订单列表 -->
    <div class="order-list">
      <el-table :data="orders" style="width: 100%">
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column prop="userName" label="用户" width="120" />
        <el-table-column prop="userPhone" label="手机号" width="120" />
        <el-table-column prop="deviceName" label="设备" width="200" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="scope">
            ¥{{ (scope.row.amount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template #default="scope">
            {{ getPaymentMethodText(scope.row.paymentMethod) }}
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
        <el-table-column prop="duration" label="用时" width="80">
          <template #default="scope">
            <span v-if="scope.row.duration">{{ scope.row.duration }}分</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewOrderDetail(scope.row)">
              详情
            </el-button>
            <el-button 
              v-if="scope.row.status === 'IN_USE'"
              size="small" 
              type="warning"
              @click="handleOrderAction(scope.row, 'stop')"
            >
              停止
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; text-align: right"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// 订单统计数据
const orderStats = ref({
  total: 0,
  completed: 0,
  inProgress: 0,
  todayRevenue: '0.00',
});

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  userPhone: '',
  status: '',
});

// 时间范围
const dateRange = ref<[Date, Date] | null>(null);

// 订单列表
const orders = ref<any[]>([]);

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

// 格式化日期时间
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 获取支付方式文本
const getPaymentMethodText = (method: string) => {
  const methodMap: Record<string, string> = {
    'wechat': '微信支付',
    'balance': '余额支付',
    'gift_balance': '赠送余额',
  };
  return methodMap[method] || method;
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

// 查看订单详情
const viewOrderDetail = (order: any) => {
  ElMessage.info(`查看订单 ${order.orderNo} 详情 - 功能开发中`);
};

// 处理订单操作
const handleOrderAction = (order: any, action: string) => {
  ElMessage.info(`${action === 'stop' ? '停止' : '处理'}订单 ${order.orderNo} - 功能开发中`);
};

// 搜索订单
const searchOrders = () => {
  loadMockOrders();
  ElMessage.success('搜索完成');
};

// 重置搜索
const resetSearch = () => {
  searchForm.orderNo = '';
  searchForm.userPhone = '';
  searchForm.status = '';
  dateRange.value = null;
  loadMockOrders();
};

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.size = size;
  loadMockOrders();
};

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadMockOrders();
};

// 加载模拟订单数据
const loadMockOrders = () => {
  const merchantName = authStore.currentUser?.nickname || '测试商户';
  const totalOrders = Math.floor(Math.random() * 200) + 50; // 50-250个订单
  
  // 生成当前页的订单数据
  const startIndex = (pagination.page - 1) * pagination.size;
  const endIndex = Math.min(startIndex + pagination.size, totalOrders);
  
  orders.value = Array.from({ length: endIndex - startIndex }, (_, index) => {
    const realIndex = startIndex + index;
    const status = ['DONE', 'IN_USE', 'CLOSED', 'PAID'][Math.floor(Math.random() * 4)];
    const paymentMethod = ['wechat', 'balance', 'gift_balance'][Math.floor(Math.random() * 3)];
    
    return {
      id: realIndex + 1,
      orderNo: `LCH${Date.now()}${String(realIndex).padStart(3, '0')}`,
      userName: `用户${Math.floor(Math.random() * 1000)}`,
      userPhone: `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      deviceName: `${merchantName} - ${Math.floor(Math.random() * 3) + 1}号机`,
      amount: Math.floor(Math.random() * 4000) + 500, // 5-45元
      paymentMethod,
      status,
      duration: status === 'DONE' ? Math.floor(Math.random() * 60) + 10 : null,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
  });

  // 更新分页信息
  pagination.total = totalOrders;

  // 更新统计数据
  orderStats.value = {
    total: totalOrders,
    completed: Math.floor(totalOrders * 0.7),
    inProgress: Math.floor(totalOrders * 0.1),
    todayRevenue: (Math.random() * 1000 + 200).toFixed(2),
  };
};

onMounted(() => {
  loadMockOrders();
});
</script>

<style scoped>
.merchant-orders {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
}

.page-header p {
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

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.order-list {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>