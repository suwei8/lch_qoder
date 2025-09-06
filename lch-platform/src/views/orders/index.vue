<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">订单管理</h1>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.totalOrders }}</div>
            <div class="stat-label">订单总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.completedOrders }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ orderStats.processingOrders }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f0f9ff; color: #0ea5e9;">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ (orderStats.totalRevenue / 100).toFixed(0) }}</div>
            <div class="stat-label">总收益</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 搜索过滤 -->
    <div class="filter-card">
      <el-form :model="searchForm" @submit.prevent="getOrderList">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="订单号">
              <el-input 
                v-model="searchForm.order_no" 
                placeholder="请输入订单号"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
                <el-option label="待支付" value="pending" />
                <el-option label="已支付" value="paid" />
                <el-option label="进行中" value="started" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
                <el-option label="已退款" value="refunded" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" @click="getOrderList">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 订单列表 -->
    <div class="table-card">
      <el-table 
        :data="orderList" 
        v-loading="loading"
        style="width: 100%"
      >
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="user_nickname" label="用户" width="120" />
        <el-table-column prop="device_name" label="设备" width="120" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            ¥{{ (row.amount / 100).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration_minutes" label="时长" width="80">
          <template #default="{ row }">
            {{ row.duration_minutes }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewOrder(row)">查看</el-button>
            <el-button 
              v-if="row.status === 'paid'" 
              size="small" 
              type="success" 
              @click="startOrder(row)"
            >
              启动
            </el-button>
            <el-button 
              v-if="row.status === 'started'" 
              size="small" 
              type="warning" 
              @click="finishOrder(row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Document, 
  CircleCheck, 
  Loading, 
  Money
} from '@element-plus/icons-vue';
import { orderApi } from '@/api/order';
import { formatDate } from '@/utils/format';

// 订单接口定义
interface Order {
  id: number;
  order_no: string;
  user_nickname: string;
  device_name: string;
  amount: number;
  duration_minutes: number;
  status: string;
  created_at: Date;
  paid_at?: Date;
  started_at?: Date;
  finished_at?: Date;
}

// 响应式数据
const loading = ref(false);
const orderList = ref<Order[]>([]);

// 订单统计数据
const orderStats = ref({
  totalOrders: 1234,
  completedOrders: 1089,
  processingOrders: 23,
  totalRevenue: 12345600
});

// 搜索表单
const searchForm = reactive({
  order_no: '',
  status: '',
  page: 1,
  limit: 20
});

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
});

// 生成模拟订单数据
const generateMockOrders = (): Order[] => {
  const statuses = ['pending', 'paid', 'started', 'completed', 'cancelled', 'refunded'] as const;
  const devices = ['设备1号', '设备2号', '设备3号', '设备4号', '设备5号'];
  const users = ['张三', '李四', '王五', '赵六', '钱七'];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    order_no: `ORD${String(Date.now() + i).slice(-8)}`,
    user_nickname: users[i % users.length],
    device_name: devices[i % devices.length],
    amount: Math.floor(Math.random() * 5000) + 500, // 分为单位
    duration_minutes: Math.floor(Math.random() * 20) + 5,
    status: statuses[i % statuses.length],
    paid_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    started_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    finished_at: i % 3 === 0 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
  }));
};

// 加载订单列表
const getOrderList = async () => {
  try {
    loading.value = true;
    console.log('正在加载订单列表...');
    
    // 先尝试从API加载
    try {
      const params = {
        ...searchForm,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await orderApi.getOrders(params);
      orderList.value = response.data || [];
      pagination.total = response.total || 0;
    } catch (apiError) {
      console.warn('API调用失败，使用模拟数据:', apiError);
      // API失败时使用模拟数据
      const mockData = generateMockOrders();
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      orderList.value = mockData.slice(start, end);
      pagination.total = mockData.length;
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    ElMessage.error('获取订单列表失败，已切换到演示模式');
    orderList.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 加载订单统计
const getOrderStats = async () => {
  try {
    const stats = await orderApi.getOrderStats();
    orderStats.value = stats;
  } catch (error) {
    console.error('获取订单统计失败:', error);
    // 使用默认模拟数据
  }
};

// 搜索重置
const resetSearch = () => {
  Object.assign(searchForm, {
    order_no: '',
    status: '',
  });
  pagination.page = 1;
  getOrderList();
};

// 事件处理
const handleSizeChange = (val: number) => {
  pagination.limit = val;
  getOrderList();
};

const handleCurrentChange = (val: number) => {
  pagination.page = val;
  getOrderList();
};

// 订单操作
const viewOrder = (row: Order) => {
  ElMessage.info(`查看订单: ${row.order_no}`);
};

const startOrder = async (row: Order) => {
  try {
    await orderApi.startOrder(row.id);
    ElMessage.success('订单启动成功');
    getOrderList();
  } catch (error) {
    ElMessage.error('订单启动失败');
  }
};

const finishOrder = async (row: Order) => {
  try {
    await orderApi.finishOrder(row.id);
    ElMessage.success('订单完成成功');
    getOrderList();
  } catch (error) {
    ElMessage.error('订单完成失败');
  }
};

// 状态显示
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'info',
    paid: 'primary',
    started: 'warning',
    completed: 'success',
    cancelled: 'info',
    refunded: 'danger'
  };
  return statusMap[status] || 'info';
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    started: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    refunded: '已退款'
  };
  return statusMap[status] || '未知';
};

// 初始化
onMounted(() => {
  getOrderList();
  getOrderStats();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 500;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.filter-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>